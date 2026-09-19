export type FunnelEvent = 'showreel_play' | 'contact_click' | 'paywall_hit'

/**
 * Fires a lightweight non-blocking telemetry event to /api/telemetry.
 */
export function trackFunnelEvent(event: FunnelEvent, metadata?: Record<string, any>) {
  if (typeof window === 'undefined') return

  try {
    const payload = JSON.stringify({ event, metadata: metadata || {} })
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      const queued = navigator.sendBeacon('/api/telemetry', blob)
      if (queued) return
    }

    // Fallback to fetch
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Non-blocking quiet fail
    })
  } catch {
    // Non-blocking quiet fail
  }
}
