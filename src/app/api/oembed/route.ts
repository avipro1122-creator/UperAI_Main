import { NextResponse } from 'next/server'
import { parseYoutubeUrl, fetchYoutubeOEmbed } from '@/lib/youtube'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

const oembedSchema = z.object({
  url: z.string().url().max(2000),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const limitCheck = rateLimit(ip, 30, 60000)
  if (!limitCheck.success) {
    return NextResponse.json({ available: false, error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const jsonBody = await request.json()
    const parsedPayload = oembedSchema.safeParse(jsonBody)
    if (!parsedPayload.success) {
      return NextResponse.json({ available: false, error: 'missing or invalid url' }, { status: 400 })
    }

    const { url } = parsedPayload.data
    const parsed = parseYoutubeUrl(url)
    if (!parsed) {
      return NextResponse.json({ available: false, error: 'not a recognized YouTube URL' })
    }

    const result = await fetchYoutubeOEmbed(url, parsed.isShortsUrl)
    return NextResponse.json({ ...result, videoId: parsed.videoId })
  } catch {
    return NextResponse.json({ available: false, error: 'Failed to fetch oEmbed metadata' }, { status: 400 })
  }
}
