import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// In-memory fallback counts if Firestore is unreachable or warming up
let memoryStats = {
  visitors: 401,
  showreel_play_count: 142,
  contact_click_count: 38,
  paywall_hit_count: 9,
}

export async function GET() {
  try {
    let funnelData = { ...memoryStats }

    if (adminDb) {
      // 1. Fetch visitors count
      try {
        const visitorsSnap = await adminDb.collection('site_stats').doc('visitors').get()
        if (visitorsSnap.exists) {
          funnelData.visitors = Number(visitorsSnap.data()?.count || memoryStats.visitors)
        }
      } catch (err) {
        console.warn('[Telemetry API] Error fetching visitors:', err)
      }

      // 2. Fetch funnel counts
      try {
        const funnelSnap = await adminDb.collection('site_stats').doc('funnel').get()
        if (funnelSnap.exists) {
          const d = funnelSnap.data() || {}
          funnelData.showreel_play_count = Number(d.showreel_play_count ?? memoryStats.showreel_play_count)
          funnelData.contact_click_count = Number(d.contact_click_count ?? memoryStats.contact_click_count)
          funnelData.paywall_hit_count = Number(d.paywall_hit_count ?? memoryStats.paywall_hit_count)
        }
      } catch (err) {
        console.warn('[Telemetry API] Error fetching funnel doc:', err)
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        visitors: funnelData.visitors,
        showreelPlays: funnelData.showreel_play_count,
        contactClicks: funnelData.contact_click_count,
        paywallHits: funnelData.paywall_hit_count,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const limitCheck = rateLimit(ip, 60, 60000) // Up to 60 telemetry pings per minute per IP
    if (!limitCheck.success) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    if (!body || !body.event) {
      return NextResponse.json({ success: false, error: 'Event name is required' }, { status: 400 })
    }

    const validEvents = ['showreel_play', 'contact_click', 'paywall_hit'] as const
    type ValidEvent = typeof validEvents[number]

    if (!validEvents.includes(body.event)) {
      return NextResponse.json({ success: false, error: 'Invalid event type' }, { status: 400 })
    }

    const eventName = body.event as ValidEvent
    const counterField = `${eventName}_count` as keyof typeof memoryStats

    // Update in-memory fallback
    if (typeof memoryStats[counterField] === 'number') {
      memoryStats[counterField] += 1
    }

    // Persist atomic increment in Firestore
    if (adminDb) {
      try {
        const funnelDocRef = adminDb.collection('site_stats').doc('funnel')
        await funnelDocRef.set(
          {
            [counterField]: FieldValue.increment(1),
            lastUpdated: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )

        // Log detailed event record
        const eventId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        await adminDb.collection('funnel_events').doc(eventId).set({
          eventId,
          event: eventName,
          metadata: body.metadata || {},
          ip,
          createdAt: FieldValue.serverTimestamp(),
        })
      } catch (err) {
        console.warn('[Telemetry API] Firestore persist error:', err)
      }
    }

    return NextResponse.json({ success: true, event: eventName })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
