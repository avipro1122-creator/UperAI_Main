import { NextRequest, NextResponse } from 'next/server'
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
      // Fall through to cookie / header
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
    // 1. Direct doc ID lookup
    const docRef = adminDb.collection('editor_profiles').doc(editorId)
    const docSnap = await docRef.get()
    if (docSnap.exists) {
      const data = docSnap.data() || {}
      const phone = data.whatsapp_number || data.whatsapp
      if (phone) {
        return { phone, name: data.full_name || data.name || 'Editor' }
      }
    }

    // 2. Query by user_id or handle
    const qSnap = await adminDb
      .collection('editor_profiles')
      .where('user_id', '==', editorId)
      .limit(1)
      .get()

    if (!qSnap.empty) {
      const data = qSnap.docs[0].data()
      const phone = data.whatsapp_number || data.whatsapp
      if (phone) {
        return { phone, name: data.full_name || data.name || 'Editor' }
      }
    }
  } catch (err) {
    console.warn('[Unlock API] Firestore query error:', err)
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
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const editorId = body.editorId

    if (!editorId) {
      return NextResponse.json({ error: 'editorId is required' }, { status: 400 })
    }

    // Fetch user profile from Firestore
    const userRef = adminDb.collection('users').doc(userId)
    const userSnap = await userRef.get()
    const userData = userSnap.data() || {}

    const unlockedEditors: string[] = Array.isArray(userData.unlocked_editors)
      ? userData.unlocked_editors
      : []

    const isAlreadyUnlocked = unlockedEditors.includes(editorId)
    const hasActivePass = Boolean(
      userData.has_active_pass &&
        userData.pass_expires_at &&
        new Date(userData.pass_expires_at).getTime() > Date.now()
    )
    const canUnlockForFree = unlockedEditors.length < 1

    // 1. If already unlocked in the past, return phone directly
    if (isAlreadyUnlocked) {
      const editorData = await findEditorPhone(editorId)
      return NextResponse.json({
        success: true,
        status: 'already_unlocked',
        phone: editorData?.phone,
        editorName: editorData?.name,
        hasActivePass,
        unlockedCount: unlockedEditors.length,
      })
    }

    // 2. If user has active Monthly Pass, unlock immediately
    if (hasActivePass) {
      await userRef.set(
        {
          unlocked_editors: FieldValue.arrayUnion(editorId),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )

      const editorData = await findEditorPhone(editorId)
      return NextResponse.json({
        success: true,
        status: 'pass_unlocked',
        phone: editorData?.phone,
        editorName: editorData?.name,
        hasActivePass: true,
        unlockedCount: unlockedEditors.length + 1,
      })
    }

    // 3. If first free unlock, grant without charge
    if (canUnlockForFree) {
      await userRef.set(
        {
          unlocked_editors: FieldValue.arrayUnion(editorId),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )

      const editorData = await findEditorPhone(editorId)
      return NextResponse.json({
        success: true,
        status: 'free_unlocked',
        phone: editorData?.phone,
        editorName: editorData?.name,
        hasActivePass: false,
        unlockedCount: 1,
        message: 'First editor unlocked for free!',
      })
    }

    // 4. Free unlock used & no active pass -> Trigger Paywall (HTTP 402)
    return NextResponse.json(
      {
        error: 'PAYWALL_REQUIRED',
        freeUsed: true,
        message: 'You have used your 1 free contact. Get the Monthly Pass for unlimited access.',
        unlockedCount: unlockedEditors.length,
        hasActivePass: false,
      },
      { status: 402 }
    )
  } catch (err: any) {
    console.error('[Unlock Contact Error]:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
