import { NextRequest, NextResponse } from 'next/server'
import { getRazorpayClient, createOrGetRazorpayPlan } from '@/lib/razorpay/client'
import { PRICING_PLANS } from '@/lib/constants/pricing'
import { PackageTier } from '@/lib/types/billing'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const packageId: PackageTier = body.packageId || 'creator_pro'
    const googleSub: string = body.googleSub || ''
    const userId: string = body.userId || req.headers.get('x-user-uid') || ''

    const plan = PRICING_PLANS.find((p) => p.id === packageId)
    if (!plan || plan.priceInr <= 0) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    const { razorpay, keyId } = getRazorpayClient()
    const amountInPaise = Math.round(plan.priceInr * 100)

    let subscriptionId: string | null = null
    let orderId: string | null = null

    // 1. Attempt Razorpay Subscription creation
    try {
      let razorpayPlanId = plan.razorpayPlanId
      if (!razorpayPlanId) {
        razorpayPlanId = await createOrGetRazorpayPlan(plan.id, plan.priceInr, plan.name)
      }

      if (razorpayPlanId) {
        const sub: any = await razorpay.subscriptions.create({
          plan_id: razorpayPlanId,
          total_count: 12,
          quantity: 1,
          customer_notify: 1,
          notes: {
            userId,
            google_sub: googleSub,
            packageId: plan.id,
            packageName: plan.name,
            priceInr: String(plan.priceInr),
          },
        })
        subscriptionId = sub.id
      }
    } catch (subErr: any) {
      console.warn('[Razorpay Subscription Init Failed, falling back to direct pass order]:', subErr?.error || subErr?.message)
    }

    // 2. Fallback / supplementary Order creation
    // Guaranteed to work even if the Razorpay merchant account has not yet activated e-Mandate cards
    try {
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `sub_${(userId || 'usr').slice(0, 8)}_${Date.now().toString().slice(-6)}`,
        notes: {
          userId,
          google_sub: googleSub,
          packageId: plan.id,
          packageName: plan.name,
          priceInr: String(plan.priceInr),
          subscriptionId: subscriptionId || '',
        },
      })
      orderId = order.id
    } catch (orderErr: any) {
      console.error('[Razorpay Order Fallback Error]:', orderErr)
      if (!subscriptionId) {
        const errMsg = orderErr?.error?.description || orderErr?.message || 'Failed to initialize payment'
        return NextResponse.json({ error: errMsg }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      subscriptionId,
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId,
      packageId: plan.id,
      packageName: plan.name,
      priceInr: plan.priceInr,
    })
  } catch (err: any) {
    console.error('[Billing Checkout API Error]:', err)
    return NextResponse.json(
      { error: err?.error?.description || err?.message || 'Failed to initialize checkout' },
      { status: 500 }
    )
  }
}
