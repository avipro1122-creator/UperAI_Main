import { Client, Account, Databases, Storage } from 'appwrite'
import { APPWRITE_CONFIG } from './config'

export const client = new Client()

client
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

// Instantiate a clean guest Appwrite Client for public document fetching.
// Guaranteed to never carry stale session tokens or invalid JWTs.
export const guestClient = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId)

export const guestDatabases = new Databases(guestClient)
export const guestStorage = new Storage(guestClient)

/**
 * Clears session tokens/headers on the primary Appwrite client instance.
 * Call this when a session check fails, token expires, or on user logout.
 */
export function clearSession() {
  try {
    client.setSession('')
  } catch {}
  try {
    client.setJWT('')
  } catch {}
  try {
    if ((client as any).headers) {
      delete (client as any).headers['x-appwrite-session']
      delete (client as any).headers['x-appwrite-jwt']
    }
  } catch {}
}

/**
 * Safely sets session token on client. If setting fails, clears session state.
 */
export function safeSetSession(sessionToken: string) {
  try {
    if (sessionToken) {
      client.setSession(sessionToken)
    } else {
      clearSession()
    }
  } catch (err) {
    console.warn('Failed to set session on Appwrite client:', err)
    clearSession()
  }
}

/**
 * Helper to get the appropriate Databases instance for public read operations.
 */
export function getPublicDatabases(useGuestOnly = false): Databases {
  return useGuestOnly ? guestDatabases : databases
}

/**
 * Safe listDocuments wrapper for public collections (e.g. editor_profiles, portfolio_items).
 * Tries default databases client first. If 403 Forbidden or 401 Unauthorized occurs
 * due to a stale or invalid session token/cookie, clears session and falls back
 * to guestDatabases (clean guest client) so public reads do not fail.
 */
export async function safeListDocuments(
  databaseId: string,
  collectionId: string,
  queries?: string[]
) {
  try {
    return await databases.listDocuments(databaseId, collectionId, queries)
  } catch (err: any) {
    const status = err?.code || err?.status || err?.statusCode
    const msg = String(err?.message || '').toLowerCase()
    const isAuthOrForbidden =
      status === 403 ||
      status === 401 ||
      msg.includes('403') ||
      msg.includes('401') ||
      msg.includes('unauthorized') ||
      msg.includes('forbidden') ||
      msg.includes('role:all') ||
      msg.includes('role:any')

    if (isAuthOrForbidden) {
      console.warn(
        `listDocuments for collection "${collectionId}" failed with auth error (${err?.message || status}). Clearing session & falling back to clean guest client.`
      )
      clearSession()
      return await guestDatabases.listDocuments(databaseId, collectionId, queries)
    }
    throw err
  }
}

/**
 * Safe getDocument wrapper for public documents (e.g. editor profile detail).
 * Tries default databases client first. If 403/401 occurs, falls back to guestDatabases.
 */
export async function safeGetDocument(
  databaseId: string,
  collectionId: string,
  documentId: string,
  queries?: string[]
) {
  try {
    return await databases.getDocument(databaseId, collectionId, documentId, queries)
  } catch (err: any) {
    const status = err?.code || err?.status || err?.statusCode
    const msg = String(err?.message || '').toLowerCase()
    const isAuthOrForbidden =
      status === 403 ||
      status === 401 ||
      msg.includes('403') ||
      msg.includes('401') ||
      msg.includes('unauthorized') ||
      msg.includes('forbidden')

    if (isAuthOrForbidden) {
      console.warn(
        `getDocument for collection "${collectionId}", doc "${documentId}" failed with auth error (${err?.message || status}). Clearing session & falling back to clean guest client.`
      )
      clearSession()
      return await guestDatabases.getDocument(databaseId, collectionId, documentId, queries)
    }
    throw err
  }
}

export function createBrowserClient() {
  return { client, account, databases, storage, guestClient, guestDatabases, guestStorage }
}
