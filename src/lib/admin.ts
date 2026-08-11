import { createSessionClient, createAdminClient } from '@/lib/appwrite/server'
import { APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { Query } from 'node-appwrite'

export function getAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  )
}

export async function requireAdmin() {
  try {
    const { account } = await createSessionClient()
    const user = await account.get()

    if (!user) {
      return { user: null, isAdmin: false as const }
    }

    const adminEmails = getAdminEmails()
    const isAdminByEmail = adminEmails.has((user.email || '').toLowerCase())

    const admin = await createAdminClient()
    const userDocs = await admin.databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.users,
      [Query.equal('$id', user.$id)]
    )
    const userDoc = userDocs.documents[0]
    const isAdminByDoc = Boolean(userDoc?.is_admin)

    return { user, isAdmin: isAdminByEmail || isAdminByDoc }
  } catch {
    return { user: null, isAdmin: false as const }
  }
}
