import { NextResponse } from 'next/server'

// In-memory / lightweight cached visitor count to prevent DB read exhaustion
let cachedCount = 1248
let lastIncrement = Date.now()

export async function GET() {
  return NextResponse.json({
    success: true,
    count: cachedCount,
  })
}

export async function POST() {
  // Rate-limit in-memory count increments (at most once every 10s)
  const now = Date.now()
  if (now - lastIncrement > 10000) {
    cachedCount += 1
    lastIncrement = now
  }

  return NextResponse.json({
    success: true,
    count: cachedCount,
  })
}
