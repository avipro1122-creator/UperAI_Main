import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// In-memory active session tracking (IP/session -> last active timestamp)
const activeSessions = new Map<string, number>()
let totalVisitCounter = 1420 // Baseline realistic total visit count

// Clean up stale sessions older than 2.5 minutes
function pruneStaleSessions() {
  const cutoff = Date.now() - 150000
  for (const [key, lastSeen] of activeSessions.entries()) {
    if (lastSeen < cutoff) {
      activeSessions.delete(key)
    }
  }
}

// Calculate realistic active creator/editor presence based on hour of the day in IST
function getBaseActiveCount(): number {
  const now = new Date()
  const utcHours = now.getUTCHours()
  const utcMinutes = now.getUTCMinutes()
  const istHour = (utcHours + 5.5 + utcMinutes / 60) % 24

  // Peak activity in Indian time zone is afternoon to night (12 PM - 11 PM)
  if (istHour >= 11 && istHour <= 23) {
    const variation = Math.sin((istHour - 11) * (Math.PI / 12)) * 10
    return Math.floor(18 + variation)
  }
  // Off-peak hours (late night / early morning)
  return Math.floor(9 + Math.sin(istHour * (Math.PI / 6)) * 4)
}

async function getStoredTotalCount(): Promise<number | null> {
  try {
    if (adminDb) {
      const snap = await adminDb.collection('site_stats').doc('visitors').get()
      if (snap.exists) {
        const stored = Number(snap.data()?.count || 0)
        if (stored > 0) return stored
      }
    }
  } catch {
    // Ignore errors
  }
  return null
}

async function incrementStoredTotalCount(): Promise<number> {
  try {
    if (adminDb) {
      const docRef = adminDb.collection('site_stats').doc('visitors')
      const snap = await docRef.get()
      if (!snap.exists) {
        await docRef.set({
          count: totalVisitCounter + 1,
          lastVisitedAt: FieldValue.serverTimestamp(),
        })
        return totalVisitCounter + 1
      } else {
        await docRef.update({
          count: FieldValue.increment(1),
          lastVisitedAt: FieldValue.serverTimestamp(),
        })
        const updated = await docRef.get()
        return Number(updated.data()?.count || totalVisitCounter)
      }
    }
  } catch {
    // Ignore errors
  }

  totalVisitCounter += 1
  return totalVisitCounter
}

export async function GET(request: Request) {
  pruneStaleSessions()
  const baseActive = getBaseActiveCount()
  const activeNow = baseActive + activeSessions.size
  const storedTotal = await getStoredTotalCount()
  const total = storedTotal !== null ? storedTotal : totalVisitCounter

  return NextResponse.json(
    {
      success: true,
      count: activeNow,
      activeNow,
      totalVisited: total,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    }
  )
}

export async function POST(request: Request) {
  pruneStaleSessions()
  const ip = getClientIp(request)
  activeSessions.set(ip, Date.now())

  const baseActive = getBaseActiveCount()
  const activeNow = baseActive + activeSessions.size
  const newTotal = await incrementStoredTotalCount()

  return NextResponse.json(
    {
      success: true,
      count: activeNow,
      activeNow,
      totalVisited: newTotal,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    }
  )
}

