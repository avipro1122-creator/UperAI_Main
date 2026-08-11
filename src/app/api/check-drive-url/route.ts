import { NextResponse } from 'next/server'
import { parseDriveUrl, checkDrivePublicAccess } from '@/lib/gdrive'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ isPublic: false, error: 'URL is required' }, { status: 400 })
    }

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
