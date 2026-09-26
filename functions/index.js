const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Scheduled Cloud Function that runs daily at midnight (UTC)
 * to scan users and flip expired subscriptions to "expired" status.
 */
exports.expireSubscriptionsDaily = onSchedule('every 24 hours', async (event) => {
  const now = admin.firestore.Timestamp.now();
  console.log(`[expireSubscriptionsDaily] Running daily check at ${now.toDate().toISOString()}`);

  try {
    const usersRef = db.collection('users');
    
    // Find users with active status
    const snapshot = await usersRef.where('subscriptionStatus', '==', 'active').get();
    let expiredCount = 0;
    const batch = db.batch();

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const expiresAt = data.subscriptionExpiresAt || data.pass_expires_at;

      let isExpired = false;
      if (expiresAt) {
        if (typeof expiresAt.toMillis === 'function') {
          isExpired = expiresAt.toMillis() < now.toMillis();
        } else if (typeof expiresAt === 'string') {
          isExpired = new Date(expiresAt).getTime() < now.toMillis();
        }
      }

      if (isExpired) {
        batch.update(docSnap.ref, {
          subscriptionStatus: 'expired',
          has_active_pass: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        expiredCount++;
      }
    });

    if (expiredCount > 0) {
      await batch.commit();
      console.log(`[expireSubscriptionsDaily] Successfully flipped ${expiredCount} expired subscriptions.`);
    } else {
      console.log('[expireSubscriptionsDaily] No expired subscriptions found today.');
    }
  } catch (error) {
    console.error('[expireSubscriptionsDaily] Error checking expired subscriptions:', error);
  }
});
