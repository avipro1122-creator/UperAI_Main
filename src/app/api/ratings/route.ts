import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { db } from '@/lib/firebase/client'
import {
  doc,
  getDoc,
  runTransaction,
} from 'firebase/firestore'
import { EditorReview, RatingResult } from '@/lib/firebase/ratings'

export async function POST(req: NextRequest) {
  try {
    // -------------------------------------------------------------------------
    // 1. Authenticate strictly via Firebase Admin SDK Token Verification
    //    User identity is NEVER trusted from request body.
    // -------------------------------------------------------------------------
    const authHeader = req.headers.get('authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: Missing or invalid Authorization Bearer token' },
        { status: 401 }
      )
    }

    const idToken = authHeader.split('Bearer ')[1].trim()
    if (!idToken) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: Empty token' },
        { status: 401 }
      )
    }

    let decodedToken: any
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken)
    } catch (authErr: any) {
      console.error('[API /api/ratings] Token verification failed:', authErr.message)
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: Token verification failed or expired' },
        { status: 401 }
      )
    }

    // Verified identities from cryptographically verified Google Firebase token
    const userId = decodedToken.uid
    const userName = decodedToken.name || decodedToken.email?.split('@')[0] || 'Anonymous Creator'
    const userPhoto = decodedToken.picture || null

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: Could not determine valid user UID from token' },
        { status: 401 }
      )
    }

    // -------------------------------------------------------------------------
    // 2. Validate Request Body (Only editorId and rating are read from client)
    // -------------------------------------------------------------------------
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
    }

    const { editorId, rating } = body || {}

    if (!editorId || typeof editorId !== 'string') {
      return NextResponse.json({ ok: false, error: 'Valid editorId is required' }, { status: 400 })
    }

    const cleanRating = Math.round(Number(rating))
    if (isNaN(cleanRating) || cleanRating < 1 || cleanRating > 5) {
      return NextResponse.json(
        { ok: false, error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // 3. Prevent Self-Rating
    // -------------------------------------------------------------------------
    if (editorId.trim() === userId.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Editors cannot rate their own profile' },
        { status: 400 }
      )
    }

    const editorRef = doc(db, 'editor_profiles', editorId)
    const editorSnap = await getDoc(editorRef)
    if (editorSnap.exists()) {
      const editorData = editorSnap.data()
      if (editorData?.user_id && editorData.user_id === userId) {
        return NextResponse.json(
          { ok: false, error: 'Editors cannot rate their own profile' },
          { status: 400 }
        )
      }
    }

    // -------------------------------------------------------------------------
    // 4. Server-Side Atomic Transaction
    //    Calculates rating_avg and rating_count server-side.
    // -------------------------------------------------------------------------
    const result: RatingResult = await runTransaction(db, async (transaction) => {
      const reviewRef = doc(db, 'editor_reviews', `${editorId}_${userId}`)
      const reviewSnap = await transaction.get(reviewRef)
      const currentEditorSnap = await transaction.get(editorRef)

      const isUpdate = reviewSnap.exists()
      const now = new Date().toISOString()

      const reviewPayload: EditorReview = {
        editorId,
        userId,
        userName,
        userPhoto,
        rating: cleanRating,
        createdAt: isUpdate ? (reviewSnap.data().createdAt || now) : now,
        updatedAt: now,
      }

      const editorData = currentEditorSnap.exists() ? currentEditorSnap.data() : {}
      let newAvg: number
      let newCount: number

      if (isUpdate) {
        const oldReview = reviewSnap.data() as EditorReview
        const oldUserRating = Math.min(Math.max(Number(oldReview.rating) || 1, 1), 5)
        const currentCount = Math.max(Number(editorData.rating_count) || 1, 1)
        const currentAvg = Number(editorData.rating_avg) || oldUserRating
        const currentSum = currentAvg * currentCount

        const newSum = currentSum - oldUserRating + cleanRating
        newCount = currentCount
        newAvg = Math.round((newSum / newCount) * 10) / 10
      } else {
        const currentCount = Math.max(Number(editorData.rating_count) || 0, 0)
        const currentAvg = Number(editorData.rating_avg) || 0
        const currentSum = currentCount > 0 ? currentAvg * currentCount : 0

        const newSum = currentSum + cleanRating
        newCount = currentCount + 1
        newAvg = Math.round((newSum / newCount) * 10) / 10
      }

      transaction.set(reviewRef, reviewPayload)
      transaction.set(
        editorRef,
        {
          rating_avg: newAvg,
          rating_count: newCount,
          updatedAt: now,
        },
        { merge: true }
      )

      return {
        review: reviewPayload,
        rating_avg: newAvg,
        rating_count: newCount,
        isUpdate,
      }
    })

    return NextResponse.json({ ok: true, data: result })
  } catch (err: any) {
    console.error('[API /api/ratings] Error:', err)
    return NextResponse.json(
      { ok: false, error: err?.message || 'Internal server error processing rating' },
      { status: 500 }
    )
  }
}
