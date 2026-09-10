import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80'

const folderCache = new Map<string, { fileId: string; timestamp: number }>()
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 // 24 hours

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url || typeof url !== 'string') {
    return NextResponse.redirect(FALLBACK_THUMBNAIL, 302)
  }

  const trimmed = url.trim()

  // 1. If it's a single file ID link, redirect directly to Google Drive's thumbnail service
  const fileIdMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (fileIdMatch && !trimmed.includes('/folders/')) {
    return NextResponse.redirect(`https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w800`, 302)
  }

  // 2. If it's a folder link, extract the folder ID and find the first file inside
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  const folderId = folderMatch ? folderMatch[1] : trimmed

  const cached = folderCache.get(folderId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.redirect(`https://drive.google.com/thumbnail?id=${cached.fileId}&sz=w800`, 302)
  }

  try {
    const folderUrl = `https://drive.google.com/drive/folders/${folderId}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const res = await fetch(folderUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      cache: 'no-store',
    })

    clearTimeout(timeoutId)

    if (res.ok) {
      const html = await res.text()
      // Extract file IDs from folder page HTML
      const matches =
        html.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || html.match(/\\\/file\\\/d\\\/([a-zA-Z0-9_-]+)/)
      if (matches && matches[1]) {
        const firstFileId = matches[1]
        folderCache.set(folderId, { fileId: firstFileId, timestamp: Date.now() })
        return NextResponse.redirect(`https://drive.google.com/thumbnail?id=${firstFileId}&sz=w800`, 302)
      }
    }
  } catch {
    // Ignore and fallback
  }

  return NextResponse.redirect(FALLBACK_THUMBNAIL, 302)
}
