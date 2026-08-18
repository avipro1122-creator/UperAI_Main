import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { firebaseConfig } from '@/lib/firebase/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

let localFallbackCount = 0

async function getCountFromFirestore(): Promise<number | null> {
  try {
    if (adminDb) {
      const snap = await adminDb.collection('site_stats').doc('visitors').get()
      if (snap.exists) {
        return Number(snap.data()?.count || 0)
      }
    }
  } catch (err) {
    // Try Firestore REST API directly if admin SDK isn't initialized with credentials
    try {
      const key = firebaseConfig.apiKey
      const projectId = firebaseConfig.projectId
      const res = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/site_stats/visitors?key=${key}`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const data = await res.json()
        const countVal = data.fields?.count?.integerValue || data.fields?.count?.doubleValue || 0
        return Number(countVal)
      }
    } catch (restErr) {
      console.warn('Firestore REST read failed:', restErr)
    }
  }
  return null
}

async function incrementFirestoreCount(): Promise<number> {
  try {
    if (adminDb) {
      const docRef = adminDb.collection('site_stats').doc('visitors')
      const snap = await docRef.get()
      if (!snap.exists) {
        await docRef.set({
          count: 1,
          lastVisitedAt: FieldValue.serverTimestamp(),
        })
        return 1
      } else {
        await docRef.update({
          count: FieldValue.increment(1),
          lastVisitedAt: FieldValue.serverTimestamp(),
        })
        const updated = await docRef.get()
        return Number(updated.data()?.count || 1)
      }
    }
  } catch (adminErr) {
    console.warn('adminDb increment failed, falling back to REST/memory:', adminErr)
  }

  // Fallback: In-memory increment
  localFallbackCount += 1
  return localFallbackCount
}

export async function GET() {
  const count = await getCountFromFirestore()
  const result = count !== null ? count : localFallbackCount

  return NextResponse.json(
    {
      success: true,
      count: result,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    }
  )
}

export async function POST() {
  const newCount = await incrementFirestoreCount()

  return NextResponse.json(
    {
      success: true,
      count: newCount,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    }
  )
}
