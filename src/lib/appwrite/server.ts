import { Client, Databases, Account, Users, Storage } from 'node-appwrite'
import { cookies } from 'next/headers'
import { APPWRITE_CONFIG } from './config'

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || APPWRITE_CONFIG.endpoint)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || APPWRITE_CONFIG.projectId)

  const apiKey = process.env.APPWRITE_API_KEY || APPWRITE_CONFIG.apiKey
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

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || APPWRITE_CONFIG.endpoint)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || APPWRITE_CONFIG.projectId)

  const cookieStore = cookies()
  const session = cookieStore.get('appwrite-session')?.value || cookieStore.get('a_session')?.value
  if (session) {
    client.setSession(session)
  }

  return {
    get account() { return new Account(client) },
    get databases() { return new Databases(client) },
    get storage() { return new Storage(client) },
  }
}
