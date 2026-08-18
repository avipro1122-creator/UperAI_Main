import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

const BASE_VISITOR_COUNT = 1480
let inMemoryVisitorOffset = 0

export async function GET() {
  try {
    let currentCount = BASE_VISITOR_COUNT + inMemoryVisitorOffset
    try {
      if (adminDb) {
        const snap = await adminDb.collection('site_stats').doc('visitors').get()
        if (snap.exists) {
          const data = snap.data()
          const recorded = Number(data?.count || 0)
          currentCount = Math.max(BASE_VISITOR_COUNT, recorded)
        }
      }
    } catch (dbErr) {
      console.warn('adminDb visitor count fetch error:', dbErr)
    }

    return NextResponse.json({
      success: true,
      count: currentCount,
    })
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      count: BASE_VISITOR_COUNT + inMemoryVisitorOffset,
    })
  }
}

export async function POST() {
  try {
    inMemoryVisitorOffset += 1
    let currentCount = BASE_VISITOR_COUNT + inMemoryVisitorOffset

    try {
      if (adminDb) {
        const docRef = adminDb.collection('site_stats').doc('visitors')
        const snap = await docRef.get()
        if (!snap.exists) {
          currentCount = BASE_VISITOR_COUNT + 1
          await docRef.set({
            count: currentCount,
            lastVisitedAt: FieldValue.serverTimestamp(),
          })
        } else {
          const prev = Number(snap.data()?.count || BASE_VISITOR_COUNT)
          currentCount = Math.max(prev + 1, BASE_VISITOR_COUNT + inMemoryVisitorOffset)
          await docRef.set(
            {
              count: currentCount,
              lastVisitedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          )
        }
      }
    } catch (dbErr) {
      console.warn('adminDb visitor increment error:', dbErr)
    }

    return NextResponse.json({
      success: true,
      count: currentCount,
    })
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      count: BASE_VISITOR_COUNT + inMemoryVisitorOffset,
    })
  }
}
