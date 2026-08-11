import { NextResponse } from 'next/server'
import { parseYoutubeUrl, fetchYoutubeOEmbed } from '@/lib/youtube'

// Server-side proxy for live preview while onboarding. Keeps the oEmbed
// call off the client so we don't depend on YouTube's CORS behavior.
export async function POST(request: Request) {
  const { url } = await request.json()

  if (typeof url !== 'string') {
    return NextResponse.json({ available: false, error: 'missing url' }, { status: 400 })
  }

  const parsed = parseYoutubeUrl(url)
  if (!parsed) {
    return NextResponse.json({ available: false, error: 'not a recognized YouTube URL' })
  }

  const result = await fetchYoutubeOEmbed(url, parsed.isShortsUrl)
  return NextResponse.json({ ...result, videoId: parsed.videoId })
}
