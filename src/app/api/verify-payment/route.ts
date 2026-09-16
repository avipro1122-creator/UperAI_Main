import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/firebase/client'
import { doc, setDoc, addDoc, collection, arrayUnion } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '5rmyTxBjcwSPbhIAPwtVzdrH'

    const body = await req.json().catch(() => ({}))
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      editorIdToUnlock,
    } = body

    // 1. Validate required signature fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          error: 'Missing required payment verification fields',
          details: {
            razorpay_order_id: !razorpay_order_id ? 'missing' : 'present',
            razorpay_payment_id: !razorpay_payment_id ? 'missing' : 'present',
            razorpay_signature: !razorpay_signature ? 'missing' : 'present',
          },
        },
        { status: 400 }
      )
    }

    // 2. Compute HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex')

    // 3. Compare signatures
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(razorpay_signature, 'utf-8')
    )

    if (!isSignatureValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment signature. Verification failed.',
        },
        { status: 400 }
      )
    }

    // 4. Update user's pass in Firestore if userId or auth cookie is present
    const resolvedUserId = userId || req.headers.get('x-user-uid')
    if (resolvedUserId) {
      try {
        const now = new Date()
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

        const userRef = doc(db, 'users', resolvedUserId)
        const updateData: Record<string, any> = {
          has_active_pass: true,
          pass_plan: 'monthly',
          pass_purchased_at: now.toISOString(),
          pass_expires_at: expiresAt,
          last_payment_id: razorpay_payment_id,
          updatedAt: now.toISOString(),
        }

        if (editorIdToUnlock) {
          updateData.unlocked_editors = arrayUnion(editorIdToUnlock)
        }

        await setDoc(userRef, updateData, { merge: true })

        // Log payment in payments collection
        await addDoc(collection(db, 'payments'), {
          userId: resolvedUserId,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          status: 'verified',
          createdAt: now.toISOString(),
        })
      } catch (dbErr) {
        console.warn('[Verify Payment DB update warning]:', dbErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    })
  } catch (err: any) {
    console.error('[Verify Payment Error]:', err)
    return NextResponse.json(
      { error: err.message || 'Payment verification failed' },
      { status: 500 }
    )
  }
}
