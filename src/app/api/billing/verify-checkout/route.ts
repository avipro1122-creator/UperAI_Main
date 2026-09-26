import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getRazorpayClient, FALLBACK_KEY_SECRET } from '@/lib/razorpay/client'
import { upsertUserSubscription } from '@/lib/services/subscriptionService'
import { PRICING_PLANS } from '@/lib/constants/pricing'
import { PackageTier } from '@/lib/types/billing'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_signature,
      userId,
      googleSub,
      packageId = 'creator_monthly',
    } = body

    if (!razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment signature verification fields' },
        { status: 400 }
      )
    }

    const { keySecret } = getRazorpayClient()
    const candidateSecrets = Array.from(new Set([keySecret, FALLBACK_KEY_SECRET].filter(Boolean)))

    let isSignatureValid = false

    // Signature can be:
    // 1. Subscription signature: payment_id + "|" + subscription_id
    // 2. Order signature: order_id + "|" + payment_id
    const payloads: string[] = []
    if (razorpay_subscription_id) {
      payloads.push(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    }
    if (razorpay_order_id) {
      payloads.push(`${razorpay_order_id}|${razorpay_payment_id}`)
    }

    for (const secret of candidateSecrets) {
      for (const payload of payloads) {
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(payload)
          .digest('hex')

        if (
          expectedSignature.length === razorpay_signature.length &&
          crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'utf-8'),
            Buffer.from(razorpay_signature, 'utf-8')
          )
        ) {
          isSignatureValid = true
          break
        }
      }
      if (isSignatureValid) break
    }

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      )
    }

    // Resolve plan info
    const plan = PRICING_PLANS.find((p) => p.id === (packageId as PackageTier)) || PRICING_PLANS[1]
    const resolvedUserId = userId || req.headers.get('x-user-uid') || 'anonymous'

    const now = new Date()
    const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Securely update subscription record in Supabase and Firestore
    await upsertUserSubscription({
      userId: resolvedUserId,
      googleSub: googleSub || null,
      packageId: plan.id,
      packageName: plan.name,
      priceInr: plan.priceInr,
      status: 'active',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd,
      nextBillingDate: currentPeriodEnd,
      cancelAtCycleEnd: false,
      razorpaySubscriptionId: razorpay_subscription_id || null,
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription verified and activated successfully!',
      planName: plan.name,
      currentPeriodEnd,
      subscriptionId: razorpay_subscription_id || null,
      paymentId: razorpay_payment_id,
    })
  } catch (err: any) {
    console.error('[Verify Checkout API Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Payment verification failed' },
      { status: 500 }
    )
  }
}
