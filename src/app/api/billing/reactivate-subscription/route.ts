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

    if (!subscription || !subscription.cancelAtCycleEnd) {
      return NextResponse.json(
        { error: 'No subscription pending cancellation found' },
        { status: 400 }
      )
    }

    const { razorpay } = getRazorpayClient()

    // 1. Resume in Razorpay if subscription ID exists
    if (subscription.razorpaySubscriptionId) {
      try {
        await (razorpay.subscriptions as any).resume(subscription.razorpaySubscriptionId, {
          resume_at: 'now',
        })
      } catch (rzpErr: any) {
        console.warn('[Razorpay API resume warning]:', rzpErr?.error || rzpErr?.message)
      }
    }

    // 2. Update Supabase and Firestore
    await upsertUserSubscription({
      ...subscription,
      userId,
      status: 'active',
      cancelAtCycleEnd: false,
      canceledAt: null,
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully!',
      cancelAtCycleEnd: false,
    })
  } catch (err: any) {
    console.error('[Reactivate Subscription API Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to reactivate subscription' },
      { status: 500 }
    )
  }
}
