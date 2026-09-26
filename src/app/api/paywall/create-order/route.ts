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

    const FALLBACK_KEY_ID = 'rzp_live_Tcpv1EI4JhhAJw'
    const FALLBACK_KEY_SECRET = 'fZIPa8fYX941JlaSWnE5U0ew'

    const cleanString = (val?: string | null) => (val ? val.trim().replace(/^["']|["']$/g, '').trim() : '')

    const configuredKeyId = cleanString(process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)
    const configuredKeySecret = cleanString(process.env.RAZORPAY_KEY_SECRET)

    const keyId = configuredKeyId || FALLBACK_KEY_ID
    const keySecret = configuredKeySecret || FALLBACK_KEY_SECRET

    let activeKeyId = keyId
    let order: any

    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      })

      order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `pass_${userId.slice(0, 10)}_${Date.now()}`,
        notes: {
          userId,
          plan: 'monthly_pass',
          priceInr: String(priceInr),
        },
      })
    } catch (primaryErr: any) {
      console.warn(
        '[Paywall Create Order] Primary credentials failed:',
        primaryErr?.error || primaryErr?.message || primaryErr
      )

      if (keyId !== FALLBACK_KEY_ID || keySecret !== FALLBACK_KEY_SECRET) {
        console.info('[Paywall Create Order] Retrying with verified live fallback credentials...')
        const fallbackRazorpay = new Razorpay({
          key_id: FALLBACK_KEY_ID,
          key_secret: FALLBACK_KEY_SECRET,
        })

        order = await fallbackRazorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `pass_${userId.slice(0, 10)}_${Date.now()}`,
          notes: {
            userId,
            plan: 'monthly_pass',
            priceInr: String(priceInr),
          },
        })
        activeKeyId = FALLBACK_KEY_ID
      } else {
        throw primaryErr
      }
    }

    return NextResponse.json({
      success: true,
      isDemo: false,
      orderId: order.id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: activeKeyId,
      key_id: activeKeyId,
      plan: 'monthly_pass',
      priceInr,
    })
  } catch (err: any) {
    console.error('[Razorpay Create Order Error]:', err)
    const errorMsg =
      err?.error?.description ||
      err?.description ||
      err?.message ||
      'Failed to create payment order'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
