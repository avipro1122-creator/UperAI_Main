import { Client, Account, Databases, Storage } from 'appwrite'
import { APPWRITE_CONFIG } from './config'

export const client = new Client()

client
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

export function createBrowserClient() {
  return { client, account, databases, storage }
}
