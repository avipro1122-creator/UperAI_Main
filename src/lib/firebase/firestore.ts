import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from './client'

export interface FirestoreEditorProfile {
  id: string
  user_id: string
  full_name: string
  display_name?: string
  name?: string
  handle: string
  headline?: string
  specialty_tag?: string
  base_rate?: number
  rate_short?: number
  rate_long?: number
  min_rate?: number
  max_rate?: number
  currency?: string
  turnaround_time?: string
  turnaround_days?: number
  whatsapp?: string
  whatsapp_number?: string
  instagram?: string
  instagram_handle?: string
  youtube_url?: string
  youtube_url1?: string
  youtube_url2?: string
  youtube_url3?: string
  showreel_url?: string
  video_url?: string
  video_url1?: string
  video_url2?: string
  video_url3?: string
  avatar_url?: string
  preview_img?: string
  thumbnail_url1?: string
  thumbnail_url2?: string
  bio?: string
  software?: string[]
  open_to_work?: boolean
  is_hidden?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface FirestorePortfolioItem {
  id: string
  editor_id: string
  title: string
  video_url: string
  youtube_url?: string
  video_id?: string
  role_description?: string
  position?: number
  thumbnail_url?: string
  is_short?: boolean
  is_available?: boolean
  createdAt?: string
}

/**
 * Fetch public editor profiles with limit
 */
export async function getPublicEditors(limitCount = 30): Promise<FirestoreEditorProfile[]> {
  try {
    const q = query(
      collection(db, 'editor_profiles'),
      where('is_hidden', '==', false),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<FirestoreEditorProfile, 'id'>),
    }))
  } catch (err) {
    console.error('Error fetching editor profiles from Firestore:', err)
    return []
  }
}

/**
 * Fetch a single editor profile by handle, user_id, or document id
 */
export async function getEditorByHandleOrId(target: string): Promise<FirestoreEditorProfile | null> {
  if (!target) return null
  const cleanTarget = target.toLowerCase().trim()

  try {
    // 1. Try finding by handle
    const handleQ = query(
      collection(db, 'editor_profiles'),
      where('handle', '==', cleanTarget),
      limit(1)
    )
    const handleSnap = await getDocs(handleQ)

    if (!handleSnap.empty) {
      const d = handleSnap.docs[0]
      return { id: d.id, ...(d.data() as Omit<FirestoreEditorProfile, 'id'>) }
    }

    // 2. Try finding by user_id
    const userQ = query(
      collection(db, 'editor_profiles'),
      where('user_id', '==', target),
      limit(1)
    )
    const userSnap = await getDocs(userQ)

    if (!userSnap.empty) {
      const d = userSnap.docs[0]
      return { id: d.id, ...(d.data() as Omit<FirestoreEditorProfile, 'id'>) }
    }

    // 3. Try direct document ID lookup
    const docRef = doc(db, 'editor_profiles', target)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Omit<FirestoreEditorProfile, 'id'>) }
    }

    return null
  } catch (err) {
    console.error('Error fetching editor by handle from Firestore:', err)
    return null
  }
}

/**
 * Fetch portfolio items for a specific editor
 */
export async function getEditorPortfolioItems(editorId: string, limitCount = 15): Promise<FirestorePortfolioItem[]> {
  if (!editorId) return []
  try {
    const q = query(
      collection(db, 'portfolio_items'),
      where('editor_id', '==', editorId),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<FirestorePortfolioItem, 'id'>),
    }))
  } catch (err) {
    console.error('Error fetching portfolio items from Firestore:', err)
    return []
  }
}
