import { NextResponse } from 'next/server'
import { doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export async function GET() {
  try {
    const statsRef = doc(db, 'site_stats', 'visitors')
    const snap = await getDoc(statsRef)
    const count = snap.exists() ? Number(snap.data()?.count || 0) : 0
    return NextResponse.json({
      success: true,
      count,
    })
  } catch (err: any) {
    console.error('Error fetching visitor count:', err)
    return NextResponse.json({
      success: true,
      count: 0,
    })
  }
}

export async function POST() {
  try {
    const statsRef = doc(db, 'site_stats', 'visitors')
    await setDoc(
      statsRef,
      {
        count: increment(1),
        lastVisitedAt: serverTimestamp(),
      },
      { merge: true }
    )
    const snap = await getDoc(statsRef)
    const count = snap.exists() ? Number(snap.data()?.count || 1) : 1

    return NextResponse.json({
      success: true,
      count,
    })
  } catch (err: any) {
    console.error('Error updating visitor count:', err)
    return NextResponse.json({
      success: true,
      count: 1,
    })
  }
}
