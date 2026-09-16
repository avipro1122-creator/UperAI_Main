import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { adminAuth } from '@/lib/firebase/admin'

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]
    try {
      const decoded = await adminAuth.verifyIdToken(token)
      if (decoded?.uid) return decoded.uid
    } catch {
      // Fall through
    }
  }

  const xUid = req.headers.get('x-user-uid')
  if (xUid) return xUid

  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(/uperai_auth=([^;]+)/)
  if (match) return match[1]

  return null
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    const priceInr = Number(process.env.MONTHLY_PASS_PRICE_INR || 199)
    const amountInPaise = Math.round(priceInr * 100)

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    // Check if Razorpay keys are configured
    if (!keyId || !keySecret) {
      // Return a simulated order for local dev / preview testing if keys not yet set
      console.warn('[Razorpay] Keys not configured in environment. Using demo order response.')
      return NextResponse.json({
        success: true,
        isDemo: true,
        orderId: `order_demo_${Date.now()}`,
        amount: amountInPaise,
        currency: 'INR',
        keyId: keyId || 'rzp_test_placeholder',
        plan: 'monthly_pass',
        priceInr,
      })
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `pass_${userId.slice(0, 10)}_${Date.now()}`,
      notes: {
        userId,
        plan: 'monthly_pass',
        priceInr: String(priceInr),
      },
    })

    return NextResponse.json({
      success: true,
      isDemo: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      plan: 'monthly_pass',
      priceInr,
    })
  } catch (err: any) {
    console.error('[Razorpay Create Order Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to create payment order' }, { status: 500 })
  }
}
