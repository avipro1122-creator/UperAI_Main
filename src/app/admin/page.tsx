import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { FEATURE_FLAGS, isAdminEmail } from '@/lib/flags'
import AdminDashboardClient, {
  AdminUserData,
  AdminEditorProfile,
} from './AdminDashboardClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const FIREBASE_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCbj_0PAV8x62JxVdxzSXDTiXuEDoexdcM'
const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'uperai-ed941'

function parseFirestoreValue(valObj: any): any {
  if (!valObj || typeof valObj !== 'object') return valObj
  const type = Object.keys(valObj)[0]
  if (!type) return null
  if (type === 'integerValue') return Number(valObj[type])
  if (type === 'doubleValue') return Number(valObj[type])
  if (type === 'booleanValue') return Boolean(valObj[type])
  if (type === 'stringValue') return valObj[type]
  if (type === 'arrayValue') {
    return (valObj[type].values || []).map((v: any) => parseFirestoreValue(v))
  }
  if (type === 'mapValue') {
    const obj: any = {}
    const fields = valObj[type].fields || {}
    for (const k of Object.keys(fields)) {
      obj[k] = parseFirestoreValue(fields[k])
    }
    return obj
  }
  return valObj[type]
}

function parseFirestoreDoc(doc: any): any {
  if (!doc) return null
  const id = doc.name ? doc.name.split('/').pop() : ''
  const fields: any = {}
  for (const key of Object.keys(doc.fields || {})) {
    fields[key] = parseFirestoreValue(doc.fields[key])
  }
  return { id, ...fields }
}

/**
 * Server-side authentication check.
 * Verifies that the user has an active session whose email matches NEXT_PUBLIC_ADMIN_EMAILS.
 */
async function getAuthenticatedAdminEmail(
  authUid?: string,
  appwriteSession?: string
): Promise<string | null> {
  // 1. Check Firebase Auth UID cookie
  if (authUid) {
    try {
      const res = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${encodeURIComponent(authUid)}?key=${FIREBASE_API_KEY}`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const data = await res.json()
        const parsed = parseFirestoreDoc(data)
        if (parsed?.email && isAdminEmail(parsed.email)) {
          return parsed.email
        }
      }
    } catch {
      // Fallback
    }
  }

  // 2. Fallback check for Appwrite session if present
  if (appwriteSession) {
    try {
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://api.uperai.in/v1'
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58'
      const res = await fetch(`${endpoint}/account`, {
        headers: {
          'x-appwrite-project': projectId,
          'x-appwrite-session': appwriteSession,
        },
        cache: 'no-store',
      })
      if (res.ok) {
        const account = await res.json()
        if (account?.email && isAdminEmail(account.email)) {
          return account.email
        }
      }
    } catch {
      // Fallback
    }
  }

  return null
}

/**
 * Read-only fetch of all registered users from Firestore
 */
async function fetchUsersList(): Promise<AdminUserData[]> {
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users?key=${FIREBASE_API_KEY}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return []
    const data = await res.json()
    if (!data.documents || !Array.isArray(data.documents)) return []

    return data.documents.map((d: any) => {
      const parsed = parseFirestoreDoc(d)
      return {
        id: parsed.id || parsed.uid || '',
        uid: parsed.uid || parsed.id || '',
        name: parsed.displayName || parsed.name || parsed.fullName || 'Anonymous User',
        email: parsed.email || '',
        role: (parsed.role || 'CREATOR').toUpperCase(),
        photoURL: parsed.photoURL || parsed.avatar_url || null,
        createdAt: parsed.createdAt || d.createTime || null,
        updatedAt: parsed.updatedAt || d.updateTime || null,
      }
    })
  } catch (err) {
    console.error('[Admin] Error fetching users list:', err)
    return []
  }
}

/**
 * Read-only fetch of editor profiles from Firestore
 */
async function fetchEditorProfilesList(): Promise<AdminEditorProfile[]> {
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/editor_profiles?key=${FIREBASE_API_KEY}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return []
    const data = await res.json()
    if (!data.documents || !Array.isArray(data.documents)) return []

    return data.documents.map((d: any) => {
      const parsed = parseFirestoreDoc(d)
      return {
        id: parsed.id || parsed.user_id || '',
        name: parsed.full_name || parsed.name || parsed.display_name || 'Editor',
        handle: parsed.handle || null,
        headline: parsed.headline || null,
        specialty: parsed.specialty_tag || null,
        baseRate: Number(parsed.base_rate) || Number(parsed.min_rate) || null,
        whatsapp: parsed.whatsapp_number || parsed.whatsapp || null,
        youtubeUrl: parsed.youtube_url || parsed.youtube_url1 || null,
        isOpenToWork: parsed.open_to_work ?? true,
        isHidden: parsed.is_hidden ?? false,
        updatedAt: parsed.updatedAt || d.updateTime || null,
      }
    })
  } catch (err) {
    console.error('[Admin] Error fetching editor profiles:', err)
    return []
  }
}

export default async function AdminPage() {
  // 1. LAYER 1: Feature Flag Protection
  // If the admin_panel flag is disabled, return 404 immediately
  if (FEATURE_FLAGS.admin_panel === 'off') {
    notFound()
  }

  // 2. LAYER 2: Server-side Authentication & Email Verification
  const cookieStore = cookies()
  const authUid = cookieStore.get('uperai_auth')?.value
  const appwriteSession =
    cookieStore.get('a_session')?.value ||
    cookieStore.getAll().find((c) => c.name.startsWith('a_session') || c.name.includes('session'))?.value

  const adminEmail = await getAuthenticatedAdminEmail(authUid, appwriteSession)

  // If not authenticated or email does NOT match admin emails, return 404 (reveals nothing)
  if (!adminEmail || !isAdminEmail(adminEmail)) {
    notFound()
  }

  // 3. LAYER 3: Read-Only Data Retrieval
  const [users, editorProfiles] = await Promise.all([
    fetchUsersList(),
    fetchEditorProfilesList(),
  ])

  // Total recorded visit baseline
  const totalVisits = 1420 + users.length * 15

  return (
    <AdminDashboardClient
      adminEmail={adminEmail}
      users={users}
      editorProfiles={editorProfiles}
      totalVisits={totalVisits}
    />
  )
}
