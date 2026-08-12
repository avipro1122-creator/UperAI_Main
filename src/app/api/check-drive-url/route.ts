import { NextResponse } from 'next/server'
import { parseDriveUrl, checkDrivePublicAccess } from '@/lib/gdrive'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

const checkDriveSchema = z.object({
  url: z.string().url().max(2000),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const limitCheck = rateLimit(ip, 20, 60000)
  if (!limitCheck.success) {
    return NextResponse.json({ isPublic: false, error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const jsonBody = await request.json()
    const parsedPayload = checkDriveSchema.safeParse(jsonBody)
    if (!parsedPayload.success) {
      return NextResponse.json({ isPublic: false, error: 'URL is required and must be a valid link' }, { status: 400 })
    }

    const { url } = parsedPayload.data
    const parsed = parseDriveUrl(url)
    if (!parsed) {
      return NextResponse.json({ isPublic: false, error: 'Invalid Google Drive link format' }, { status: 400 })
    }

    const result = await checkDrivePublicAccess(parsed.fileId)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      {
        isPublic: false,
        error: "This Drive link is private. Set sharing to 'Anyone with the link' so creators can watch it.",
      },
      { status: 400 }
    )
  }
}
