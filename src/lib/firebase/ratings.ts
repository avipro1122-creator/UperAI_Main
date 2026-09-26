import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
} from 'firebase/firestore'
import { db, auth } from './client'

export interface EditorReview {
  editorId: string
  userId: string
  userName: string
  userPhoto?: string | null
  rating: number // integer 1-5
  createdAt: string
  updatedAt: string
}

export interface RatingResult {
  review: EditorReview
  rating_avg: number
  rating_count: number
  isUpdate: boolean
}

/**
 * Fetch all ratings for a given editor (Read-only)
 */
export async function getEditorRatings(editorId: string): Promise<EditorReview[]> {
  if (!editorId) return []
  try {
    const q = query(
      collection(db, 'editor_reviews'),
      where('editorId', '==', editorId)
    )
    const snapshot = await getDocs(q)
    const reviews: EditorReview[] = snapshot.docs.map((d) => d.data() as EditorReview)
    // Sort in memory to avoid requiring a composite index in Firestore
    return reviews.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch (err) {
    console.error('[getEditorRatings] Failed to fetch editor ratings:', err)
    return []
  }
}

/**
 * Fetch a specific user's rating for an editor if already submitted (Read-only)
 */
export async function getUserRating(
  editorId: string,
  userId: string
): Promise<EditorReview | null> {
  if (!editorId || !userId) return null
  try {
    const reviewRef = doc(db, 'editor_reviews', `${editorId}_${userId}`)
    const reviewSnap = await getDoc(reviewRef)
    if (reviewSnap.exists()) {
      return reviewSnap.data() as EditorReview
    }
    return null
  } catch (err) {
    console.error('[getUserRating] Failed to fetch user rating:', err)
    return null
  }
}

/**
 * Submit or update an editor rating directly on Firestore.
 *
 * Runs an atomic client-side transaction authenticated by Firebase Auth.
 * Adheres strictly to Firestore Security Rules:
 * - Creates/updates editor_reviews/${editorId}_${userId}
 * - Updates rating_avg, rating_count, and updatedAt on editor_profiles/${editorId}
 */
export async function submitEditorRating(
  editorId: string,
  rating: number
): Promise<RatingResult> {
  if (!editorId || typeof editorId !== 'string') {
    throw new Error('Valid editorId is required')
  }

  const cleanRating = Math.round(Number(rating))
  if (isNaN(cleanRating) || cleanRating < 1 || cleanRating > 5) {
    throw new Error('Rating must be an integer between 1 and 5')
  }

  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('You must be signed in with Google to rate this editor.')
  }

  const userId = currentUser.uid
  const userName =
    currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous Creator'
  const userPhoto = currentUser.photoURL || null

  // 1. Prevent self-rating
  if (editorId.trim() === userId.trim()) {
    throw new Error('Editors cannot rate their own profile.')
  }

  // 2. Execute atomic transaction directly on Firestore
  const result: RatingResult = await runTransaction(db, async (transaction) => {
    const editorRef = doc(db, 'editor_profiles', editorId)
    const reviewRef = doc(db, 'editor_reviews', `${editorId}_${userId}`)

    // All reads must occur before any writes
    const [editorSnap, reviewSnap] = await Promise.all([
      transaction.get(editorRef),
      transaction.get(reviewRef),
    ])

    if (!editorSnap.exists()) {
      throw new Error('Editor profile not found in database.')
    }

    const editorData = editorSnap.data() || {}
    if (editorData?.user_id && editorData.user_id === userId) {
      throw new Error('Editors cannot rate their own profile.')
    }

    const isUpdate = reviewSnap.exists()
    const now = new Date().toISOString()

    const reviewPayload: EditorReview = {
      editorId,
      userId,
      userName: userName.trim(),
      userPhoto,
      rating: cleanRating,
      createdAt: isUpdate ? (reviewSnap.data()?.createdAt || now) : now,
      updatedAt: now,
    }

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

    // Writes after all reads
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

  return result
}
