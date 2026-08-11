// YouTube URL parsing + free oEmbed lookup. No API key required.

export interface ParsedYoutubeUrl {
  videoId: string
  isShortsUrl: boolean
}

/**
 * Parses a video ID out of any of:
 *   youtube.com/watch?v=ID
 *   youtu.be/ID
 *   youtube.com/shorts/ID
 *   youtube.com/embed/ID
 * Returns null if the URL doesn't look like a YouTube video URL.
 */
export function parseYoutubeUrl(rawUrl: string): ParsedYoutubeUrl | null {
  try {
    let trimmed = rawUrl.trim()
    if (!trimmed) return null
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`
    }
    const url = new URL(trimmed)
    const host = url.hostname.replace(/^www\.|^m\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id ? { videoId: id, isShortsUrl: false } : null
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v')
        return id ? { videoId: id, isShortsUrl: false } : null
      }

      const shortsMatch = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/)
      if (shortsMatch) return { videoId: shortsMatch[1], isShortsUrl: true }

      const embedMatch = url.pathname.match(/^\/embed\/([a-zA-Z0-9_-]+)/)
      if (embedMatch) return { videoId: embedMatch[1], isShortsUrl: false }
    }

    return null
  } catch {
    return null
  }
}

export function parseYouTubeVideoId(url: string): string | null {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.trim().match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export function getYouTubeThumbnail(url: string): string {
  const videoId = parseYouTubeVideoId(url)
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  }
  return 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=600&auto=format&fit=crop'
}

export interface OEmbedResult {
  available: boolean
  title?: string
  thumbnailUrl?: string
  isShort?: boolean
}

/**
 * Fetches title + thumbnail via the free YouTube oEmbed endpoint.
 * Returns { available: false } for private/deleted videos or any
 * fetch failure — callers should render an "unavailable" state, not
 * a broken frame.
 */
export async function fetchYoutubeOEmbed(
  videoUrl: string,
  hintIsShort: boolean
): Promise<OEmbedResult> {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      videoUrl
    )}&format=json`
    const res = await fetch(endpoint, { cache: 'no-store' })
    if (!res.ok) return { available: false }

    const data = await res.json()
    const width: number | undefined = data.thumbnail_width
    const height: number | undefined = data.thumbnail_height
    const looksVertical = !!(width && height && height > width)

    return {
      available: true,
      title: data.title ?? undefined,
      thumbnailUrl: data.thumbnail_url ?? undefined,
      isShort: hintIsShort || looksVertical,
    }
  } catch {
    return { available: false }
  }
}

/** Builds a nocookie embed URL for click-to-play. */
export function youtubeEmbedUrl(videoId: string, autoplay = true) {
  return `https://www.youtube-nocookie.com/embed/${videoId}${
    autoplay ? '?autoplay=1' : ''
  }`
}
