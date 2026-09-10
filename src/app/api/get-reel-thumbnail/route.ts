import { NextRequest, NextResponse } from 'next/server'
import { isInstagramUrl, extractInstagramCode } from '@/lib/thumbnail-resolver'

export const dynamic = 'force-dynamic'

const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80'

// In-memory cache to reduce duplicate outbound requests
const thumbnailCache = new Map<string, { url: string; timestamp: number }>()
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 // 24 hours

function unescapeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function extractMetaCoverImage(html: string): string | null {
  if (!html) return null

  // 1. Standard og:image or twitter:image: <meta property="og:image" content="..." />
  const ogRegex =
    /<meta\s+[^>]*?(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*?content=["']([^"']+)["']/i
  const ogMatch = html.match(ogRegex)
  if (ogMatch && ogMatch[1]) {
    return unescapeHtml(ogMatch[1])
  }

  // 2. Reversed attribute order: <meta content="..." property="og:image" />
  const revRegex =
    /<meta\s+[^>]*?content=["']([^"']+)["'][^>]*?(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["']/i
  const revMatch = html.match(revRegex)
  if (revMatch && revMatch[1]) {
    return unescapeHtml(revMatch[1])
  }

  // 3. Embedded JSON / display_url / thumbnail_src
  const displayUrlMatch =
    html.match(/"display_url":\s*"([^"]+)"/) || html.match(/"thumbnail_src":\s*"([^"]+)"/)
  if (displayUrlMatch && displayUrlMatch[1]) {
    return displayUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '')
  }

  return null
}

async function resolveReelCoverUrl(targetUrl: string, cacheKey: string): Promise<string | null> {
  const cached = thumbnailCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.url
  }

  // 1. Primary: Instagram official public oEmbed endpoint
  try {
    const oembedRes = await fetch(
      `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(targetUrl)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        },
        cache: 'no-store',
      }
    )
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json()
      if (oembedData?.thumbnail_url) {
        thumbnailCache.set(cacheKey, { url: oembedData.thumbnail_url, timestamp: Date.now() })
        return oembedData.thumbnail_url
      }
    }
  } catch {
    // Fall through
  }

  // 2. Secondary: Fetch Instagram Reel HTML using social crawler User-Agent
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const html = await response.text()
      const coverImage = extractMetaCoverImage(html)
      if (coverImage) {
        thumbnailCache.set(cacheKey, { url: coverImage, timestamp: Date.now() })
        return coverImage
      }
    }
  } catch {
    // Fall through
  }

  return null
}

export async function GET(request: NextRequest) {
  const inputUrl = request.nextUrl.searchParams.get('url')
  const wantsJson =
    request.nextUrl.searchParams.get('format') === 'json' ||
    request.headers.get('accept')?.includes('application/json')

  if (!inputUrl || typeof inputUrl !== 'string') {
    if (wantsJson) {
      return NextResponse.json(
        { thumbnailUrl: FALLBACK_THUMBNAIL, error: 'Missing or invalid "url" query parameter' },
        { status: 400 }
      )
    }
    return NextResponse.redirect(FALLBACK_THUMBNAIL, 302)
  }

  const trimmed = inputUrl.trim()
  const code = extractInstagramCode(trimmed)

  if (!code && !isInstagramUrl(trimmed)) {
    if (wantsJson) {
      return NextResponse.json(
        { thumbnailUrl: FALLBACK_THUMBNAIL, error: 'URL is not a recognized Instagram reel/post' },
        { status: 400 }
      )
    }
    return NextResponse.redirect(FALLBACK_THUMBNAIL, 302)
  }

  const cacheKey = code || trimmed
  const targetUrl = code
    ? `https://www.instagram.com/reel/${code}/`
    : trimmed.startsWith('http')
    ? trimmed
    : `https://${trimmed}`

  const coverUrl = await resolveReelCoverUrl(targetUrl, cacheKey)

  // If JSON is explicitly requested, return the CDN URL
  if (wantsJson) {
    return NextResponse.json({ thumbnailUrl: coverUrl || FALLBACK_THUMBNAIL })
  }

  // If used directly as <img src="/api/get-reel-thumbnail?url=..." />:
  // Proxy image binary data to bypass Instagram CDN Cross-Origin-Resource-Policy restrictions
  if (coverUrl) {
    try {
      const imgRes = await fetch(coverUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
        cache: 'no-store',
      })

      if (imgRes.ok && imgRes.body) {
        return new NextResponse(imgRes.body, {
          headers: {
            'Content-Type': imgRes.headers.get('content-type') || 'image/jpeg',
            'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
    } catch {
      // Fallback
    }
  }

  return NextResponse.redirect(FALLBACK_THUMBNAIL, 302)
}
