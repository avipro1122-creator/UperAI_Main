import { parseYoutubeUrl } from '@/lib/youtube'
import { parseDriveUrl } from '@/lib/gdrive'

export type VideoSourceType = 'youtube' | 'drive'

export interface ParsedVideoUrl {
  sourceType: VideoSourceType
  videoId: string
  embedUrl: string
  isShortsUrl?: boolean
}

export function parseVideoUrl(rawUrl: string): ParsedVideoUrl | null {
  if (!rawUrl || !rawUrl.trim()) return null

  // 1. Try YouTube first
  const yt = parseYoutubeUrl(rawUrl)
  if (yt) {
    return {
      sourceType: 'youtube',
      videoId: yt.videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt.videoId}`,
      isShortsUrl: yt.isShortsUrl,
    }
  }

  // 2. Try Google Drive
  const drive = parseDriveUrl(rawUrl)
  if (drive) {
    return {
      sourceType: 'drive',
      videoId: drive.fileId,
      embedUrl: drive.previewUrl,
      isShortsUrl: false,
    }
  }

  return null
}
