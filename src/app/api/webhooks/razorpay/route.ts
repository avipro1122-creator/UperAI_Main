import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/razorpay/client'
import { upsertUserSubscription } from '@/lib/services/subscriptionService'
import { PackageTier, SubscriptionStatus } from '@/lib/types/billing'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    // 1. Mandatory HMAC SHA-256 Signature Verification
    if (!signature) {
      console.warn('[Razorpay Webhook] Missing X-Razorpay-Signature header')
      return NextResponse.json({ error: 'Missing signature header' }, { status: 400 })
    }

    const isValid = verifyWebhookSignature(rawBody, signature)
    if (!isValid) {
      console.error('[Razorpay Webhook] Invalid HMAC SHA-256 signature')
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    const eventType = event.event
    console.info(`[Razorpay Webhook] Received verified event: ${eventType}`)

    const payload = event.payload || {}

    // Handle Subscription Events
    if (
      eventType === 'subscription.charged' ||
      eventType === 'subscription.activated' ||
      eventType === 'subscription.renewed'
    ) {
      const sub = payload.subscription?.entity || {}
      const payment = payload.payment?.entity || {}
      const notes = sub.notes || payment.notes || {}

      const userId = notes.userId || notes.user_id
      const googleSub = notes.google_sub || notes.googleSub
      const packageId: PackageTier = notes.packageId || 'creator_pro'
      const packageName = notes.packageName || 'Creator Pro'
      const priceInr = Number(notes.priceInr || 499)

      const currentPeriodEnd = sub.current_end
        ? new Date(sub.current_end * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      if (userId) {
        await upsertUserSubscription({
          userId,
          googleSub,
          packageId,
          packageName,
          priceInr,
          status: 'active',
          currentPeriodStart: sub.current_start ? new Date(sub.current_start * 1000).toISOString() : new Date().toISOString(),
          currentPeriodEnd,
          cancelAtCycleEnd: Boolean(sub.cancel_at_cycle_end),
          razorpaySubscriptionId: sub.id,
          razorpayCustomerId: sub.customer_id || payment.customer_id,
        })
      }
    } else if (eventType === 'subscription.cancelled') {
      const sub = payload.subscription?.entity || {}
      const notes = sub.notes || {}
      const userId = notes.userId || notes.user_id

      if (userId) {
        await upsertUserSubscription({
          userId,
          packageId: notes.packageId || 'creator_pro',
          packageName: notes.packageName || 'Creator Pro',
          priceInr: Number(notes.priceInr || 499),
          status: 'canceled',
          cancelAtCycleEnd: false,
          canceledAt: new Date().toISOString(),
          razorpaySubscriptionId: sub.id,
        })
      }
    } else if (eventType === 'subscription.halted') {
      const sub = payload.subscription?.entity || {}
      const notes = sub.notes || {}
      const userId = notes.userId || notes.user_id

      if (userId) {
        await upsertUserSubscription({
          userId,
          packageId: notes.packageId || 'creator_pro',
          packageName: notes.packageName || 'Creator Pro',
          priceInr: Number(notes.priceInr || 499),
          status: 'halted',
          razorpaySubscriptionId: sub.id,
        })
      }
    } else if (eventType === 'payment.failed') {
      const payment = payload.payment?.entity || {}
      const notes = payment.notes || {}
      const userId = notes.userId || notes.user_id

      if (userId && notes.subscriptionId) {
        await upsertUserSubscription({
          userId,
          packageId: notes.packageId || 'creator_pro',
          packageName: notes.packageName || 'Creator Pro',
          priceInr: Number(notes.priceInr || 499),
          status: 'past_due',
          razorpaySubscriptionId: notes.subscriptionId,
        })
      }
    } else if (eventType === 'payment.captured') {
      const payment = payload.payment?.entity || {}
      const notes = payment.notes || {}
      const userId = notes.userId || notes.user_id

      if (userId) {
        const pkgId: PackageTier = notes.packageId || 'creator_monthly'
        const pkgName = notes.packageName || 'Creator Monthly Pass'
        const price = Number(notes.priceInr || 199)

        await upsertUserSubscription({
          userId,
          googleSub: notes.google_sub,
          packageId: pkgId,
          packageName: pkgName,
          priceInr: price,
          status: 'active',
          razorpaySubscriptionId: notes.subscriptionId || null,
          razorpayCustomerId: payment.customer_id || null,
        })
      }
    }

    return NextResponse.json({ received: true, event: eventType })
  } catch (err: any) {
    console.error('[Razorpay Webhook Handler Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
