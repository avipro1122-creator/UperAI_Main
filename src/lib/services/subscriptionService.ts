import { db } from '@/lib/firebase/client'
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { UserSubscription, SubscriptionStatus, PackageTier } from '@/lib/types/billing'

export async function getUserSubscriptionRecord(
  userId: string,
  googleSub?: string | null
): Promise<UserSubscription | null> {
  let sub: Partial<UserSubscription> | null = null

  // 1. Try Supabase first if configured
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
        sub = {
          id: data.id,
          userId: data.user_id || userId,
          googleSub: data.google_sub || googleSub,
          email: data.email,
          packageId: (data.package_id as PackageTier) || 'creator_monthly',
          packageName: data.package_name || 'Creator Pass',
          status: (data.status as SubscriptionStatus) || 'active',
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
    } catch (supaErr) {
      console.warn('[SubscriptionService] Supabase read fallback:', supaErr)
    }
  }

  // 2. Complement / fallback with Firestore
  try {
    const userDocRef = doc(db, 'users', userId)
    const userDocSnap = await getDoc(userDocRef)

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data()
      const hasPass = Boolean(userData.has_active_pass)
      const expiresAt = userData.pass_expires_at
      const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false

      if (hasPass && !isExpired && (!sub || sub.status !== 'active')) {
        const planName =
          userData.pass_plan === 'pro'
            ? 'Creator Pro'
            : userData.pass_plan === 'enterprise'
            ? 'Agency & Enterprise'
            : 'Creator Monthly Pass'

        const pkgId: PackageTier =
          userData.pass_plan === 'pro'
            ? 'creator_pro'
            : userData.pass_plan === 'enterprise'
            ? 'enterprise'
            : 'creator_monthly'

        const price = pkgId === 'enterprise' ? 1499 : pkgId === 'creator_pro' ? 499 : 199

        sub = {
          id: userData.subscription_id || `sub_${userId}`,
          userId,
          googleSub: userData.google_sub || googleSub,
          email: userData.email,
          packageId: pkgId,
          packageName: planName,
          status: (userData.subscription_status as SubscriptionStatus) || 'active',
          billingFrequency: 'monthly',
          priceInr: price,
          currency: 'INR',
          currentPeriodStart: userData.pass_purchased_at || new Date().toISOString(),
          currentPeriodEnd: expiresAt,
          nextBillingDate: expiresAt,
          cancelAtCycleEnd: Boolean(userData.cancel_at_cycle_end),
          canceledAt: userData.canceled_at,
          razorpaySubscriptionId: userData.subscription_id,
          razorpayCustomerId: userData.razorpay_customer_id,
        }
      }
    }
  } catch (fireErr) {
    console.warn('[SubscriptionService] Firestore read fallback:', fireErr)
  }

  return sub as UserSubscription | null
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
  const expiresAt =
    data.currentPeriodEnd ||
    new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Sync to Supabase if configured (Store only reference IDs, zero raw financial data)
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
        current_period_end: expiresAt,
        cancel_at_cycle_end: Boolean(data.cancelAtCycleEnd),
        canceled_at: data.canceledAt || null,
        updated_at: now.toISOString(),
      }

      await supabase.from('subscriptions').insert(payload)
    } catch (supaErr) {
      console.warn('[SubscriptionService] Supabase insert warning:', supaErr)
    }
  }

  // 2. Sync to Firestore (Users collection and Subscriptions collection)
  try {
    const userRef = doc(db, 'users', data.userId)
    const updateData: Record<string, any> = {
      has_active_pass: data.status === 'active' || data.cancelAtCycleEnd === true,
      pass_plan:
        data.packageId === 'creator_pro'
          ? 'pro'
          : data.packageId === 'enterprise'
          ? 'enterprise'
          : 'monthly',
      pass_purchased_at: data.currentPeriodStart || now.toISOString(),
      pass_expires_at: expiresAt,
      subscription_status: data.status,
      cancel_at_cycle_end: Boolean(data.cancelAtCycleEnd),
      canceled_at: data.canceledAt || null,
      updatedAt: now.toISOString(),
    }

    if (data.googleSub) updateData.google_sub = data.googleSub
    if (data.razorpaySubscriptionId) updateData.subscription_id = data.razorpaySubscriptionId
    if (data.razorpayCustomerId) updateData.razorpay_customer_id = data.razorpayCustomerId

    await setDoc(userRef, updateData, { merge: true })

    // Dedicated subscriptions collection
    const subRef = doc(db, 'subscriptions', data.razorpaySubscriptionId || `sub_${data.userId}`)
    await setDoc(
      subRef,
      {
        ...data,
        currentPeriodStart: data.currentPeriodStart || now.toISOString(),
        currentPeriodEnd: expiresAt,
        updatedAt: now.toISOString(),
      },
      { merge: true }
    )
  } catch (fireErr) {
    console.error('[SubscriptionService] Firestore sync error:', fireErr)
  }
}
