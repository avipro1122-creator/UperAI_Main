import { getApps, initializeApp, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import * as fs from 'fs'
import * as path from 'path'

function formatPrivateKey(key?: string) {
  if (!key) return undefined
  return key.replace(/\\n/g, '\n')
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'uperai-ed941'
let app: App

if (!getApps().length) {
  const localKeyPath = path.join(process.cwd(), 'serviceAccountKey.json')
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (fs.existsSync(localKeyPath)) {
    try {
      const keyData = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'))
      app = initializeApp({
        credential: cert(keyData),
        projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      })
    } catch (e) {
      console.error('Error reading serviceAccountKey.json:', e)
      app = initializeApp({ projectId })
    }
  } else if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson)
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      })
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', e)
      app = initializeApp({ projectId })
    }
  } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  } else {
    app = initializeApp({ projectId })
  }
} else {
  app = getApps()[0]
}

export const adminAuth = getAuth(app)
export const adminDb = getFirestore(app)
export const adminStorage = getStorage(app)
export default app
