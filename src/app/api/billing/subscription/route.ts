import { NextRequest, NextResponse } from 'next/server'
import { getUserSubscriptionRecord } from '@/lib/services/subscriptionService'
import { getRazorpayClient } from '@/lib/razorpay/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
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

    // If subscription has a Razorpay subscription ID, poll live status
    if (subscription?.razorpaySubscriptionId) {
      try {
        const { razorpay } = getRazorpayClient()
        const liveSub: any = await razorpay.subscriptions.fetch(subscription.razorpaySubscriptionId)
        if (liveSub) {
          subscription.status = liveSub.status
          if (liveSub.current_end) {
            subscription.currentPeriodEnd = new Date(liveSub.current_end * 1000).toISOString()
            subscription.nextBillingDate = subscription.currentPeriodEnd
          }
          if (liveSub.cancel_at_cycle_end) {
            subscription.cancelAtCycleEnd = true
          }
        }
      } catch (rzpErr) {
        console.warn('[Live Razorpay Sync Warning]:', rzpErr)
      }
    }

    return NextResponse.json({
      success: true,
      subscription: subscription || {
        packageId: 'free_starter',
        packageName: 'Free Starter',
        status: 'active',
        billingFrequency: 'monthly',
        priceInr: 0,
        currency: 'INR',
        cancelAtCycleEnd: false,
      },
    })
  } catch (err: any) {
    console.error('[Get Subscription API Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}
