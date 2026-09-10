/**
 * Utility for resolving media and video links into direct thumbnail image URLs.
 */

/**
 * Extract Google Drive file ID from various Drive URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 */
export function extractDriveFileId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null
  const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (dMatch && dMatch[1]) return dMatch[1]
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch && idMatch[1]) return idMatch[1]
  return null
}

/**
 * Check if the URL is already a direct image format (.jpg, .jpeg, .png, .webp).
 */
export function isDirectImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  return /\.(jpe?g|png|webp)(\?.*)?$/i.test(url.trim())
}

/**
 * Check if the URL is an Instagram Reel or post URL.
 */
export function isInstagramUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  return /(?:instagram\.com|instagr\.am)\/(?:reel|reels|p|tv|share\/reel)\/([A-Za-z0-9_-]+)/i.test(url.trim())
}

/**
 * Extract Instagram shortcode from Reel/Post URL.
 */
export function extractInstagramCode(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null
  const match = url.trim().match(/(?:instagram\.com|instagr\.am)\/(?:reel|reels|p|tv|share\/reel)\/([A-Za-z0-9_-]+)/i)
  return match && match[1] ? match[1] : null
}

/**
 * Resolve user-provided link into an image thumbnail URL:
 * 1. Check if already a direct image link (.jpg, .jpeg, .png, .webp) -> return inputUrl as-is.
 * 2. Check if inputUrl contains drive.google.com -> return https://drive.google.com/thumbnail?id=${fileId}&sz=w800.
 * 3. Supports YouTube links -> https://img.youtube.com/vi/${videoId}/hqdefault.jpg.
 * 4. Otherwise returns inputUrl as-is.
 */
export function resolveThumbnailUrl(inputUrl: string | null | undefined): string | null {
  if (!inputUrl || typeof inputUrl !== 'string') return null
  const trimmed = inputUrl.trim()
  if (!trimmed) return null

  // 1. Direct image link (.jpg, .jpeg, .png, .webp)
  if (isDirectImageUrl(trimmed)) {
    return trimmed
  }

  // 2. Google Drive link
  if (trimmed.includes('drive.google.com')) {
    if (trimmed.includes('/folders/')) {
      return `/api/get-drive-thumbnail?url=${encodeURIComponent(trimmed)}`
    }
    const fileId = extractDriveFileId(trimmed)
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`
    }
  }

  // 3. Instagram Reel / Post link
  if (isInstagramUrl(trimmed)) {
    return `/api/get-reel-thumbnail?url=${encodeURIComponent(trimmed)}`
  }

  // 3. YouTube link
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i
  )
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
  }

  // 4. Vimeo link
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://vumbnail.com/${vimeoMatch[1]}.jpg`
  }

  return null
}
