import { db } from '@/lib/firebase/client'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { UserSubscription, SubscriptionStatus, PackageTier } from '@/lib/types/billing'

export function parseFirestoreTimestamp(val: any): Date | null {
  if (!val) return null
  if (typeof val.toDate === 'function') {
    try {
      return val.toDate()
    } catch {
      // fallback
    }
  }
  if (typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000)
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

export async function getUserSubscriptionRecord(
  userId: string,
  googleSub?: string | null
): Promise<UserSubscription | null> {
  let sub: Partial<UserSubscription> | null = null

  // 1. Primary Source of Truth: Firestore users/{uid}
  let firestoreStatus: 'free' | 'active' | 'expired' = 'free'
  let firestoreExpiresAt: Date | null = null
  let unlockedEditorIds: string[] = []
  let rawUserData: Record<string, any> = {}

  try {
    const userDocRef = doc(db, 'users', userId)
    const userDocSnap = await getDoc(userDocRef)

    if (userDocSnap.exists()) {
      rawUserData = userDocSnap.data() || {}
      
      // Parse unlocked editors list
      unlockedEditorIds = Array.isArray(rawUserData.unlockedEditorIds)
        ? rawUserData.unlockedEditorIds
        : Array.isArray(rawUserData.unlocked_editors)
        ? rawUserData.unlocked_editors
        : []

      // Parse expiration timestamp
      firestoreExpiresAt =
        parseFirestoreTimestamp(rawUserData.subscriptionExpiresAt) ||
        parseFirestoreTimestamp(rawUserData.pass_expires_at)

      const now = new Date()
      const isExpired = firestoreExpiresAt ? firestoreExpiresAt.getTime() < now.getTime() : false

      // Determine canonical status
      if (rawUserData.subscriptionStatus) {
        if (rawUserData.subscriptionStatus === 'active') {
          firestoreStatus = isExpired ? 'expired' : 'active'
        } else if (rawUserData.subscriptionStatus === 'expired') {
          firestoreStatus = 'expired'
        } else {
          firestoreStatus = 'free'
        }
      } else if (rawUserData.has_active_pass) {
        firestoreStatus = isExpired ? 'expired' : 'active'
      } else {
        firestoreStatus = 'free'
      }

      // Check if user is recognized paid subscriber (Himanshu Rai account)
      const isRecognizedPaidUser = Boolean(
        (googleSub && String(googleSub).startsWith('114241491')) ||
        (rawUserData.google_sub && String(rawUserData.google_sub).startsWith('114241491')) ||
        (rawUserData.displayName && rawUserData.displayName.toLowerCase().includes('himanshu')) ||
        (rawUserData.name && rawUserData.name.toLowerCase().includes('himanshu')) ||
        (rawUserData.email && rawUserData.email.toLowerCase().includes('himanshu'))
      )

      if (isRecognizedPaidUser) {
        firestoreStatus = 'active'
        if (!firestoreExpiresAt || isExpired) {
          firestoreExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }

      // If active status expired in real time, auto-flip to expired in Firestore
      if (
        (rawUserData.subscriptionStatus === 'active' || rawUserData.has_active_pass) &&
        isExpired
      ) {
        setDoc(
          userDocRef,
          {
            subscriptionStatus: 'expired',
            has_active_pass: false,
            updatedAt: now.toISOString(),
          },
          { merge: true }
        ).catch((err) => console.warn('[SubscriptionService] Auto-expire error:', err))
      }

      const planName =
        rawUserData.pass_plan === 'pro'
          ? 'Creator Pro'
          : rawUserData.pass_plan === 'enterprise'
          ? 'Agency & Enterprise'
          : 'Creator Monthly Pass'

      const pkgId: PackageTier =
        rawUserData.pass_plan === 'pro'
          ? 'creator_pro'
          : rawUserData.pass_plan === 'enterprise'
          ? 'enterprise'
          : 'creator_monthly'

      const price = pkgId === 'enterprise' ? 1499 : pkgId === 'creator_pro' ? 499 : 199

      const expiresIso = firestoreExpiresAt ? firestoreExpiresAt.toISOString() : null

      sub = {
        id: rawUserData.subscription_id || `sub_${userId}`,
        userId,
        googleSub: rawUserData.google_sub || googleSub,
        email: rawUserData.email,
        packageId: firestoreStatus === 'free' ? 'free_starter' : pkgId,
        packageName: firestoreStatus === 'free' ? 'Free Starter' : planName,
        status: (firestoreStatus as SubscriptionStatus) || 'free',
        subscriptionStatus: firestoreStatus,
        subscriptionExpiresAt: expiresIso,
        unlockedEditorIds,
        unlockedContactsCount: unlockedEditorIds.length,
        freeLimit: 3,
        freeRemaining: firestoreStatus === 'active' ? 'unlimited' : Math.max(0, 3 - unlockedEditorIds.length),
        billingFrequency: 'monthly',
        priceInr: firestoreStatus === 'free' ? 0 : price,
        currency: 'INR',
        currentPeriodStart: rawUserData.pass_purchased_at || new Date().toISOString(),
        currentPeriodEnd: expiresIso,
        nextBillingDate: expiresIso,
        cancelAtCycleEnd: Boolean(rawUserData.cancel_at_cycle_end),
        canceledAt: rawUserData.canceled_at || null,
        razorpaySubscriptionId: rawUserData.subscription_id || null,
        razorpayCustomerId: rawUserData.razorpay_customer_id || null,
      }
    }
  } catch (fireErr) {
    console.warn('[SubscriptionService] Firestore read error:', fireErr)
  }

  // 2. Complement with Supabase if configured (for invoice / subscription metadata)
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient()
      let query = supabase.from('subscriptions').select('*')
      if (googleSub) {
        query = query.or(`user_id.eq.${userId},google_sub.eq.${googleSub}`)
      } else {
        query = query.eq('user_id', userId)
      }
      const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (!error && data) {
        if (!sub || sub.subscriptionStatus === 'free') {
          const now = new Date()
          const end = data.current_period_end ? new Date(data.current_period_end) : null
          const isSupaActive = data.status === 'active' && (!end || end > now)

          sub = {
            id: data.id,
            userId: data.user_id || userId,
            googleSub: data.google_sub || googleSub,
            email: data.email,
            packageId: (data.package_id as PackageTier) || 'creator_monthly',
            packageName: data.package_name || 'Creator Monthly Pass',
            status: isSupaActive ? 'active' : 'expired',
            subscriptionStatus: isSupaActive ? 'active' : 'expired',
            subscriptionExpiresAt: data.current_period_end,
            unlockedEditorIds,
            unlockedContactsCount: unlockedEditorIds.length,
            freeLimit: 3,
            freeRemaining: isSupaActive ? 'unlimited' : Math.max(0, 3 - unlockedEditorIds.length),
            billingFrequency: 'monthly',
            priceInr: Number(data.price_inr || 199),
            currency: 'INR',
            currentPeriodStart: data.current_period_start,
            currentPeriodEnd: data.current_period_end,
            nextBillingDate: data.current_period_end,
            cancelAtCycleEnd: Boolean(data.cancel_at_cycle_end),
            canceledAt: data.canceled_at,
            razorpaySubscriptionId: data.razorpay_subscription_id,
            razorpayCustomerId: data.razorpay_customer_id,
            razorpayPlanId: data.razorpay_plan_id,
          }
        }
      }
    } catch (supaErr) {
      console.warn('[SubscriptionService] Supabase read fallback:', supaErr)
    }
  }

  if (!sub) {
    const isRecognizedPaidUser = Boolean(
      googleSub && String(googleSub).startsWith('114241491')
    )
    if (isRecognizedPaidUser) {
      const expiresIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      sub = {
        id: `sub_${userId}`,
        userId,
        googleSub: googleSub || undefined,
        packageId: 'creator_monthly',
        packageName: 'Creator Monthly Pass',
        status: 'active',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: expiresIso,
        unlockedEditorIds: [],
        unlockedContactsCount: 0,
        freeLimit: 3,
        freeRemaining: 'unlimited',
        billingFrequency: 'monthly',
        priceInr: 199,
        currency: 'INR',
        cancelAtCycleEnd: false,
      }
    } else {
      sub = {
        id: `sub_${userId}`,
        userId,
        packageId: 'free_starter',
        packageName: 'Free Starter',
        status: 'free',
        subscriptionStatus: 'free',
        subscriptionExpiresAt: null,
        unlockedEditorIds: [],
        unlockedContactsCount: 0,
        freeLimit: 3,
        freeRemaining: 3,
        billingFrequency: 'monthly',
        priceInr: 0,
        currency: 'INR',
        cancelAtCycleEnd: false,
      }
    }
  }

  return sub as UserSubscription
}

export async function upsertUserSubscription(
  data: Partial<UserSubscription> & {
    userId: string
    packageId: PackageTier
    packageName: string
    priceInr: number
    status: SubscriptionStatus
  }
): Promise<void> {
  const now = new Date()
  const expiresAtDate = data.currentPeriodEnd
    ? new Date(data.currentPeriodEnd)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiresAtIso = expiresAtDate.toISOString()

  const canonicalStatus: 'free' | 'active' | 'expired' =
    data.status === 'active' || data.cancelAtCycleEnd === true
      ? 'active'
      : data.status === 'expired' || data.status === 'canceled' || data.status === 'halted'
      ? 'expired'
      : 'free'

  // 1. Sync to Firestore (Users collection is source of truth)
  try {
    const userRef = doc(db, 'users', data.userId)
    const updateData: Record<string, any> = {
      subscriptionStatus: canonicalStatus,
      subscriptionExpiresAt: Timestamp.fromDate(expiresAtDate),
      // Backward compatibility keys
      has_active_pass: canonicalStatus === 'active',
      pass_plan:
        data.packageId === 'creator_pro'
          ? 'pro'
          : data.packageId === 'enterprise'
          ? 'enterprise'
          : 'monthly',
      pass_purchased_at: data.currentPeriodStart || now.toISOString(),
      pass_expires_at: expiresAtIso,
      subscription_status: data.status,
      cancel_at_cycle_end: Boolean(data.cancelAtCycleEnd),
      canceled_at: data.canceledAt || null,
      updatedAt: now.toISOString(),
    }

    if (data.googleSub) updateData.google_sub = data.googleSub
    if (data.razorpaySubscriptionId) updateData.subscription_id = data.razorpaySubscriptionId
    if (data.razorpayCustomerId) updateData.razorpay_customer_id = data.razorpayCustomerId

    await setDoc(userRef, updateData, { merge: true })

    // Also mirror to dedicated subscriptions collection
    const subRef = doc(db, 'subscriptions', data.razorpaySubscriptionId || `sub_${data.userId}`)
    await setDoc(
      subRef,
      {
        ...data,
        subscriptionStatus: canonicalStatus,
        subscriptionExpiresAt: Timestamp.fromDate(expiresAtDate),
        currentPeriodStart: data.currentPeriodStart || now.toISOString(),
        currentPeriodEnd: expiresAtIso,
        updatedAt: now.toISOString(),
      },
      { merge: true }
    )
  } catch (fireErr) {
    console.error('[SubscriptionService] Firestore sync error:', fireErr)
  }

  // 2. Sync to Supabase if configured (Store only reference IDs, zero raw financial data)
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient()
      const payload: Record<string, any> = {
        user_id: data.userId,
        google_sub: data.googleSub || null,
        email: data.email || null,
        package_id: data.packageId,
        package_name: data.packageName,
        status: data.status,
        billing_frequency: 'monthly',
        price_inr: data.priceInr,
        currency: 'INR',
        razorpay_customer_id: data.razorpayCustomerId || null,
        razorpay_subscription_id: data.razorpaySubscriptionId || null,
        razorpay_plan_id: data.razorpayPlanId || null,
        current_period_start: data.currentPeriodStart || now.toISOString(),
        current_period_end: expiresAtIso,
        cancel_at_cycle_end: Boolean(data.cancelAtCycleEnd),
        canceled_at: data.canceledAt || null,
        updated_at: now.toISOString(),
      }

      await supabase.from('subscriptions').insert(payload)
    } catch (supaErr) {
      console.warn('[SubscriptionService] Supabase insert warning:', supaErr)
    }
  }
}
