import { Client, Account, Databases, Storage } from 'appwrite'

export const client = new Client()

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58')

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

export function createBrowserClient() {
  return { client, account, databases, storage }
}
