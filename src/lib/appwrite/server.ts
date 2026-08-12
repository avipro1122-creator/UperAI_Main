import { Client, Databases, Account, Users, Storage } from 'node-appwrite'
import { cookies } from 'next/headers'
import { APPWRITE_CONFIG } from './config'

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId)

  const apiKey = APPWRITE_CONFIG.apiKey
  if (apiKey) {
    client.setKey(apiKey)
  }

  return {
    get account() { return new Account(client) },
    get databases() { return new Databases(client) },
    get storage() { return new Storage(client) },
    get users() { return new Users(client) },
  }
}

export async function createSessionClient(req?: Request) {
  const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId)

  let sessionSecret: string | undefined

  if (req) {
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionSecret = authHeader.substring(7).trim()
    }
    if (!sessionSecret) {
      sessionSecret = req.headers.get('x-appwrite-session') || undefined
    }
  }

  if (!sessionSecret) {
    try {
      const cookieStore = cookies()
      const allCookies = cookieStore.getAll()
      const sessionCookie = allCookies.find(
        (c) => c.name === 'appwrite-session' || c.name === 'a_session' || c.name.startsWith('a_session_')
      )
      sessionSecret = sessionCookie?.value
    } catch {
      // Ignore cookieStore error during static page prerendering
    }
  }

  if (sessionSecret) {
    client.setSession(sessionSecret)
  }

  return {
    get account() { return new Account(client) },
    get databases() { return new Databases(client) },
    get storage() { return new Storage(client) },
  }
}
