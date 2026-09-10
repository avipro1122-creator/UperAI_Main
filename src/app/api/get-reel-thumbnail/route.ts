import { NextRequest, NextResponse } from 'next/server'
import { isInstagramUrl, extractInstagramCode } from '@/lib/thumbnail-resolver'

export const dynamic = 'force-dynamic'

const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80'

// In-memory cache to reduce duplicate outbound requests
const thumbnailCache = new Map<string, { url: string; timestamp: number }>()
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour

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

export async function GET(request: NextRequest) {
  const inputUrl = request.nextUrl.searchParams.get('url')

  if (!inputUrl || typeof inputUrl !== 'string') {
    return NextResponse.json(
      { thumbnailUrl: FALLBACK_THUMBNAIL, error: 'Missing or invalid "url" query parameter' },
      { status: 400 }
    )
  }

  const trimmed = inputUrl.trim()
  const code = extractInstagramCode(trimmed)

  if (!code && !isInstagramUrl(trimmed)) {
    return NextResponse.json(
      { thumbnailUrl: FALLBACK_THUMBNAIL, error: 'URL is not a recognized Instagram reel/post' },
      { status: 400 }
    )
  }

  // Check cache
  const cacheKey = code || trimmed
  const cached = thumbnailCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ thumbnailUrl: cached.url })
  }

  // Target Instagram Reel canonical URL
  const targetUrl = code
    ? `https://www.instagram.com/reel/${code}/`
    : trimmed.startsWith('http')
    ? trimmed
    : `https://${trimmed}`

  try {
    // 1. Primary: Instagram official public oEmbed endpoint (fastest and most reliable)
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
          return NextResponse.json({ thumbnailUrl: oembedData.thumbnail_url })
        }
      }
    } catch {
      // Fall through to HTML meta scraping
    }

    // 2. Secondary: Fetch Instagram Reel HTML using social crawler User-Agent
    // (Instagram serves complete OpenGraph og:image tags only to crawler agents)
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
        return NextResponse.json({ thumbnailUrl: coverImage })
      }
    }

    // Gracefully return fallback placeholder if fetch fails or account is private
    return NextResponse.json({ thumbnailUrl: FALLBACK_THUMBNAIL })
  } catch {
    // Graceful error fallback
    return NextResponse.json({ thumbnailUrl: FALLBACK_THUMBNAIL })
  }
}
