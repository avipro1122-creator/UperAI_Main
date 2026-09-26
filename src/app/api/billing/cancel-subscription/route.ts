import { NextRequest, NextResponse } from 'next/server'
import { getRazorpayClient } from '@/lib/razorpay/client'
import { getUserSubscriptionRecord, upsertUserSubscription } from '@/lib/services/subscriptionService'

export async function POST(req: NextRequest) {
  try {
    const xUid = req.headers.get('x-user-uid')
    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/uperai_auth=([^;]+)/)
    const userId = xUid || (match ? match[1] : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const googleSub = req.headers.get('x-google-sub')
    const subscription = await getUserSubscriptionRecord(userId, googleSub)

    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json({ error: 'No active subscription found to cancel' }, { status: 400 })
    }

    const { razorpay } = getRazorpayClient()
    const now = new Date()
    const activeUntil = subscription.currentPeriodEnd || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // 1. Call Razorpay Subscriptions Cancel with cancel_at_cycle_end: true
    if (subscription.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, true)
      } catch (rzpErr: any) {
        console.warn('[Razorpay API cancel warning]:', rzpErr?.error || rzpErr?.message)
      }
    }

    // 2. Securely update state in Supabase & Firestore
    await upsertUserSubscription({
      ...subscription,
      userId,
      status: 'active', // remains active until cycle end
      cancelAtCycleEnd: true,
      canceledAt: now.toISOString(),
      currentPeriodEnd: activeUntil,
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription scheduled for cancellation at cycle end.',
      cancelAtCycleEnd: true,
      accessActiveUntil: activeUntil,
    })
  } catch (err: any) {
    console.error('[Cancel Subscription API Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
