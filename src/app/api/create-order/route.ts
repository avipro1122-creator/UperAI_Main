import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export async function POST(req: NextRequest) {
  try {
    const keyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      'rzp_test_TcpjRCNlqDperL'

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET ||
      'TJj0c3r54qlS8aDzGDW5UxTH'

    const body = await req.json().catch(() => ({}))
    let amount = Number(body.amount)

    // Default amount if not passed (e.g. 19900 paise = ₹199)
    if (!amount || isNaN(amount)) {
      const priceInr = Number(process.env.MONTHLY_PASS_PRICE_INR || 199)
      amount = Math.round(priceInr * 100)
    }

    // Minimum amount validation (100 paise = ₹1.00)
    if (amount < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least 100 paise (₹1.00)' },
        { status: 400 }
      )
    }

    const currency = (body.currency || 'INR').toUpperCase()
    const receipt = body.receipt || `rcpt_${Date.now().toString().slice(-8)}`
    const notes = body.notes || {}

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes,
    })

    return NextResponse.json({
      success: true,
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
    })
  } catch (err: any) {
    console.error('[Razorpay Create Order Error]:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create Razorpay order' },
      { status: 500 }
    )
  }
}
