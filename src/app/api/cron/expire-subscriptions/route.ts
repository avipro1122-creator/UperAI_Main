import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/client'
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore'
import { parseFirestoreTimestamp } from '@/lib/services/subscriptionService'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return handleExpireSubscriptions(req)
}

export async function POST(req: NextRequest) {
  return handleExpireSubscriptions(req)
}

async function handleExpireSubscriptions(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const secretParam = req.nextUrl.searchParams.get('secret')
    const cronSecret = process.env.CRON_SECRET

    // If CRON_SECRET is configured, enforce authorization
    if (cronSecret) {
      const isAuthorized =
        authHeader === `Bearer ${cronSecret}` || secretParam === cronSecret
      if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const now = new Date()
    const usersRef = collection(db, 'users')

    // Find active subscriptions
    const q = query(usersRef, where('subscriptionStatus', '==', 'active'))
    const snapshot = await getDocs(q)

    const expiredUsers: string[] = []

    for (const userDoc of snapshot.docs) {
      const data = userDoc.data() || {}
      const rawExp = data.subscriptionExpiresAt || data.pass_expires_at
      const expDate = parseFirestoreTimestamp(rawExp)

      if (expDate && expDate.getTime() < now.getTime()) {
        await setDoc(
          doc(db, 'users', userDoc.id),
          {
            subscriptionStatus: 'expired',
            has_active_pass: false,
            updatedAt: now.toISOString(),
          },
          { merge: true }
        )
        expiredUsers.push(userDoc.id)
      }
    }

    // Also check legacy has_active_pass == true users
    const legacyQ = query(usersRef, where('has_active_pass', '==', true))
    const legacySnap = await getDocs(legacyQ)

    for (const userDoc of legacySnap.docs) {
      if (expiredUsers.includes(userDoc.id)) continue

      const data = userDoc.data() || {}
      const rawExp = data.subscriptionExpiresAt || data.pass_expires_at
      const expDate = parseFirestoreTimestamp(rawExp)

      if (expDate && expDate.getTime() < now.getTime()) {
        await setDoc(
          doc(db, 'users', userDoc.id),
          {
            subscriptionStatus: 'expired',
            has_active_pass: false,
            updatedAt: now.toISOString(),
          },
          { merge: true }
        )
        expiredUsers.push(userDoc.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed expired subscriptions. Updated ${expiredUsers.length} user(s).`,
      timestamp: now.toISOString(),
      expiredCount: expiredUsers.length,
      expiredUsers,
    })
  } catch (err: any) {
    console.error('[Expire Subscriptions Cron Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to process subscription expiration' },
      { status: 500 }
    )
  }
}
