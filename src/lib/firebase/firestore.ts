import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore'
import { db, firebaseConfig } from './client'

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

// In-Memory Micro Cache (15-second SWR for ultra-low TTFB under 5ms)
const memoryCache = new Map<string, { timestamp: number; data: any }>()
const CACHE_TTL_MS = 15_000

function parseFirestoreFields(doc: any) {
  const id = doc.name.split('/').pop()
  const fields: any = {}
  for (const key of Object.keys(doc.fields || {})) {
    const valObj = doc.fields[key]
    const type = Object.keys(valObj)[0]
    if (type === 'integerValue') {
      fields[key] = Number(valObj[type])
    } else if (type === 'booleanValue') {
      fields[key] = Boolean(valObj[type])
    } else if (type === 'arrayValue') {
      fields[key] = (valObj[type].values || []).map((v: any) => Object.values(v)[0])
    } else {
      fields[key] = valObj[type]
    }
  }
  return { id, ...fields }
}

/**
 * Fetch public editor profiles with limit + in-memory cache + robust REST fallback
 */
export async function getPublicEditors(limitCount = 30): Promise<FirestoreEditorProfile[]> {
  const cacheKey = `public_editors_${limitCount}`
  const cached = memoryCache.get(cacheKey)
  const now = Date.now()

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  let result: FirestoreEditorProfile[] = []

  try {
    const q = query(
      collection(db, 'editor_profiles'),
      where('is_hidden', '==', false),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      result = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FirestoreEditorProfile, 'id'>),
      }))
    }
  } catch (err) {
    console.warn('Firestore SDK query failed, switching to direct REST:', err)
  }

  // Guaranteed REST API fallback
  if (result.length === 0) {
    try {
      const key = firebaseConfig.apiKey
      const projectId = firebaseConfig.projectId
      const res = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/editor_profiles?key=${key}`,
        { cache: 'no-store' }
      )
      const data = await res.json()
      if (data.documents) {
        result = data.documents
          .map(parseFirestoreFields)
          .filter((p: any) => !p.is_hidden)
          .slice(0, limitCount)
      }
    } catch (restErr) {
      console.error('Firestore REST fetch failed:', restErr)
    }
  }

  if (result.length > 0) {
    memoryCache.set(cacheKey, { timestamp: now, data: result })
  }

  return result
}

/**
 * Fetch a single editor profile by handle, user_id, or document id
 */
export async function getEditorByHandleOrId(target: string): Promise<FirestoreEditorProfile | null> {
  if (!target) return null
  const cleanTarget = target.toLowerCase().trim()
  const cacheKey = `editor_${cleanTarget}`
  const cached = memoryCache.get(cacheKey)
  const now = Date.now()

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const all = await getPublicEditors(100)
    const found = all.find(
      (e) =>
        (e.handle && e.handle.toLowerCase() === cleanTarget) ||
        (e.user_id && e.user_id.toLowerCase() === cleanTarget) ||
        (e.id && e.id.toLowerCase() === cleanTarget) ||
        (e.full_name && e.full_name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTarget)
    )
    if (found) {
      memoryCache.set(cacheKey, { timestamp: now, data: found })
      return found
    }

    // Direct document ID lookup
    const docRef = doc(db, 'editor_profiles', target)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...(docSnap.data() as Omit<FirestoreEditorProfile, 'id'>) }
      memoryCache.set(cacheKey, { timestamp: now, data })
      return data
    }
  } catch (err) {
    console.error('Error fetching editor from Firestore:', err)
  }

  return null
}

/**
 * Fetch portfolio items for a specific editor
 */
export async function getEditorPortfolioItems(editorId: string, limitCount = 15): Promise<FirestorePortfolioItem[]> {
  if (!editorId) return []
  const cacheKey = `portfolio_${editorId}_${limitCount}`
  const cached = memoryCache.get(cacheKey)
  const now = Date.now()

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  let result: FirestorePortfolioItem[] = []

  try {
    const q = query(
      collection(db, 'portfolio_items'),
      where('editor_id', '==', editorId),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      result = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FirestorePortfolioItem, 'id'>),
      }))
    }
  } catch (err) {
    console.warn('Portfolio SDK query failed, trying REST:', err)
  }

  // REST fallback
  if (result.length === 0) {
    try {
      const key = firebaseConfig.apiKey
      const projectId = firebaseConfig.projectId
      const res = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/portfolio_items?key=${key}`,
        { cache: 'no-store' }
      )
      const data = await res.json()
      if (data.documents) {
        result = data.documents
          .map(parseFirestoreFields)
          .filter((item: any) => item.editor_id === editorId)
          .slice(0, limitCount)
      }
    } catch (restErr) {
      console.error('Portfolio REST fetch failed:', restErr)
    }
  }

  if (result.length > 0) {
    memoryCache.set(cacheKey, { timestamp: now, data: result })
  }

  return result
}
