import { parseYoutubeUrl } from '@/lib/youtube'
import { parseDriveUrl } from '@/lib/gdrive'

export type VideoSourceType = 'youtube' | 'instagram' | 'drive' | 'vimeo' | 'other'

export interface ParsedVideoUrl {
  sourceType: VideoSourceType
  videoId: string
  embedUrl: string
  isShortsUrl?: boolean
  isReel?: boolean
  thumbnailUrl?: string | null
  rawUrl: string
}

export function parseInstagramUrl(rawUrl: string): { code: string; embedUrl: string; isReel: boolean } | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null
  const trimmed = rawUrl.trim()
  const match = trimmed.match(/(?:instagram\.com|instagr\.am)\/(?:reel|reels|p|tv|share\/reel)\/([A-Za-z0-9_-]+)/i)
  if (match && match[1]) {
    const code = match[1]
    const isReel = /\/(?:reel|reels|share\/reel)\//i.test(trimmed)
    return {
      code,
      embedUrl: `https://www.instagram.com/reel/${code}/embed/captioned/`,
      isReel: true,
    }
  }
  return null
}

export function parseVimeoUrl(rawUrl: string): { videoId: string; embedUrl: string } | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null
  const match = rawUrl.trim().match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+)/i)
  if (match && match[1]) {
    return {
      videoId: match[1],
      embedUrl: `https://player.vimeo.com/video/${match[1]}`,
    }
  }
  return null
}

export function parseVideoUrl(rawUrl: string | null | undefined): ParsedVideoUrl | null {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return null
  const url = rawUrl.trim()

  // 1. Try YouTube first
  const yt = parseYoutubeUrl(url)
  if (yt) {
    return {
      sourceType: 'youtube',
      videoId: yt.videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt.videoId}`,
      isShortsUrl: yt.isShortsUrl,
      thumbnailUrl: `https://img.youtube.com/vi/${yt.videoId}/hqdefault.jpg`,
      rawUrl: url,
    }
  }

  // 2. Try Instagram Reel / Post
  const insta = parseInstagramUrl(url)
  if (insta) {
    return {
      sourceType: 'instagram',
      videoId: insta.code,
      embedUrl: insta.embedUrl,
      isReel: insta.isReel,
      isShortsUrl: true,
      thumbnailUrl: `/api/get-reel-thumbnail?url=${encodeURIComponent(url)}`,
      rawUrl: url,
    }
  }

  // 3. Try Google Drive (files & folders)
  if (url.includes('drive.google.com') && url.includes('/folders/')) {
    return {
      sourceType: 'drive',
      videoId: url,
      embedUrl: url,
      isShortsUrl: false,
      thumbnailUrl: `/api/get-drive-thumbnail?url=${encodeURIComponent(url)}`,
      rawUrl: url,
    }
  }

  const drive = parseDriveUrl(url)
  if (drive) {
    return {
      sourceType: 'drive',
      videoId: drive.fileId,
      embedUrl: drive.previewUrl,
      isShortsUrl: false,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${drive.fileId}&sz=w800`,
      rawUrl: url,
    }
  }

  // 4. Try Vimeo
  const vimeo = parseVimeoUrl(url)
  if (vimeo) {
    return {
      sourceType: 'vimeo',
      videoId: vimeo.videoId,
      embedUrl: vimeo.embedUrl,
      isShortsUrl: false,
      thumbnailUrl: `https://vumbnail.com/${vimeo.videoId}.jpg`,
      rawUrl: url,
    }
  }

  // 5. Fallback for valid URLs
  if (/^https?:\/\//i.test(url)) {
    return {
      sourceType: 'other',
      videoId: url,
      embedUrl: url,
      isShortsUrl: false,
      thumbnailUrl: null,
      rawUrl: url,
    }
  }

  return null
}

