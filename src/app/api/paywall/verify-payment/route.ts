import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { DEFAULT_EDITORS } from '@/lib/firebase/firestore'

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

async function findEditorPhone(editorId: string): Promise<{ phone: string; name: string } | null> {
  try {
    const docRef = adminDb.collection('editor_profiles').doc(editorId)
    const docSnap = await docRef.get()
    if (docSnap.exists) {
      const data = docSnap.data() || {}
      const phone = data.whatsapp_number || data.whatsapp
      if (phone) return { phone, name: data.full_name || data.name || 'Editor' }
    }

    const qSnap = await adminDb
      .collection('editor_profiles')
      .where('user_id', '==', editorId)
      .limit(1)
      .get()

    if (!qSnap.empty) {
      const data = qSnap.docs[0].data()
      const phone = data.whatsapp_number || data.whatsapp
      if (phone) return { phone, name: data.full_name || data.name || 'Editor' }
    }
  } catch (err) {
    console.warn('[Verify Payment] Find editor phone error:', err)
  }

  const defaultFound = DEFAULT_EDITORS.find(
    (e) => e.id === editorId || e.user_id === editorId || e.handle === editorId
  )
  if (defaultFound) {
    const phone = defaultFound.whatsapp_number || defaultFound.whatsapp || '919016047119'
    return { phone, name: defaultFound.full_name || defaultFound.name || 'Editor' }
  }

  return { phone: '919016047119', name: 'Editor' }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      editorIdToUnlock,
      isDemo,
    } = body

    const FALLBACK_KEY_SECRET = 'fZIPa8fYX941JlaSWnE5U0ew'
    const cleanString = (val?: string | null) => (val ? val.trim().replace(/^["']|["']$/g, '').trim() : '')
    const configuredSecret = cleanString(process.env.RAZORPAY_KEY_SECRET)
    const candidateSecrets = Array.from(new Set([configuredSecret, FALLBACK_KEY_SECRET].filter(Boolean)))

    // Signature verification
    if (!isDemo) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ error: 'Missing payment signature details' }, { status: 400 })
      }

      const payload = `${razorpay_order_id}|${razorpay_payment_id}`
      let isSignatureValid = false

      for (const secret of candidateSecrets) {
        const generatedSignature = crypto
          .createHmac('sha256', secret)
          .update(payload)
          .digest('hex')

        if (
          generatedSignature.length === razorpay_signature.length &&
          crypto.timingSafeEqual(
            Buffer.from(generatedSignature, 'utf-8'),
            Buffer.from(razorpay_signature, 'utf-8')
          )
        ) {
          isSignatureValid = true
          break
        }
      }

      if (!isSignatureValid) {
        return NextResponse.json({ error: 'Invalid payment signature. Verification failed.' }, { status: 400 })
      }
    }

    // 30 Days Pass Expiry
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const userRef = adminDb.collection('users').doc(userId)
    const updatePayload: Record<string, any> = {
      has_active_pass: true,
      pass_plan: 'monthly',
      pass_purchased_at: now.toISOString(),
      pass_expires_at: expiresAt,
      last_payment_id: razorpay_payment_id || 'demo_payment',
      updatedAt: now.toISOString(),
    }

    if (editorIdToUnlock) {
      updatePayload.unlocked_editors = FieldValue.arrayUnion(editorIdToUnlock)
    }

    await userRef.set(updatePayload, { merge: true })

    // Record audit in payments collection
    try {
      await adminDb.collection('payments').add({
        userId,
        orderId: razorpay_order_id || 'demo_order',
        paymentId: razorpay_payment_id || 'demo_payment',
        plan: 'monthly_pass',
        amountInr: Number(process.env.MONTHLY_PASS_PRICE_INR || 199),
        currency: 'INR',
        expiresAt,
        createdAt: now.toISOString(),
      })
    } catch (paymentLogErr) {
      console.warn('[Payments audit log failed]:', paymentLogErr)
    }

    let phone: string | undefined
    let editorName: string | undefined

    if (editorIdToUnlock) {
      const editorData = await findEditorPhone(editorIdToUnlock)
      phone = editorData?.phone
      editorName = editorData?.name
    }

    return NextResponse.json({
      success: true,
      message: 'Monthly pass activated successfully!',
      pass_expires_at: expiresAt,
      phone,
      editorName,
    })
  } catch (err: any) {
    console.error('[Verify Payment Error]:', err)
    return NextResponse.json({ error: err.message || 'Payment verification failed' }, { status: 500 })
  }
}
