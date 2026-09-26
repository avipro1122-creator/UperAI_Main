import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/firebase/client'
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  arrayUnion,
} from 'firebase/firestore'
import { DEFAULT_EDITORS } from '@/lib/firebase/firestore'

const FALLBACK_KEY_SECRET = 'fZIPa8fYX941JlaSWnE5U0ew'

function sanitizeKey(val?: string | null): string {
  if (!val) return ''
  return val.trim().replace(/^["']|["']$/g, '').trim()
}

async function findEditorPhone(editorId: string): Promise<{ phone: string; name: string } | null> {
  try {
    // 1. Direct doc ID lookup
    const docRef = doc(db, 'editor_profiles', editorId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = docSnap.data() || {}
      const phone = data.whatsapp_number || data.whatsapp
      if (phone) {
        return { phone, name: data.full_name || data.name || 'Editor' }
      }
    }

    // 2. Query by user_id
    const q = query(collection(db, 'editor_profiles'), where('user_id', '==', editorId), limit(1))
    const qSnap = await getDocs(q)
    if (!qSnap.empty) {
      const data = qSnap.docs[0].data()
      const phone = data.whatsapp_number || data.whatsapp
      if (phone) {
        return { phone, name: data.full_name || data.name || 'Editor' }
      }
    }
  } catch (err) {
    console.warn('[Verify Payment] Firestore query editor error:', err)
  }

  // 3. Fallback to default verified editors
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
    const configuredSecret = sanitizeKey(process.env.RAZORPAY_KEY_SECRET)
    const candidateSecrets = Array.from(
      new Set([configuredSecret, FALLBACK_KEY_SECRET].filter(Boolean))
    )

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

    // 2. Compute and verify HMAC-SHA256(order_id + "|" + payment_id, secret)
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`
    let isSignatureValid = false

    for (const secret of candidateSecrets) {
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

    if (!isSignatureValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment signature. Verification failed.',
        },
        { status: 400 }
      )
    }

    // 3. Update user's pass in Firestore if userId or auth cookie is present
    const resolvedUserId = userId || req.headers.get('x-user-uid')
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

    if (resolvedUserId) {
      try {
        const userRef = doc(db, 'users', resolvedUserId)
        const updateData: Record<string, any> = {
          subscriptionStatus: 'active',
          subscriptionExpiresAt: expiresAt,
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

    // 4. Resolve editor phone if unlocking a specific editor
    let phone: string | undefined
    let editorName: string | undefined
    if (editorIdToUnlock) {
      const editorData = await findEditorPhone(editorIdToUnlock)
      phone = editorData?.phone
      editorName = editorData?.name
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      pass_expires_at: expiresAt,
      phone,
      editorName,
    })
  } catch (err: any) {
    console.error('[Verify Payment Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Payment verification failed' },
      { status: 500 }
    )
  }
}

