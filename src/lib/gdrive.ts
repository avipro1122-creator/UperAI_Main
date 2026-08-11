export interface ParsedDriveUrl {
  fileId: string
  previewUrl: string
}

/**
 * Parses Google Drive File ID out of common link formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/file/d/FILE_ID/preview
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/file/d/FILE_ID/edit?usp=sharing
 * - https://drive.google.com/uc?id=FILE_ID
 */
export function parseDriveUrl(rawUrl: string): ParsedDriveUrl | null {
  try {
    let trimmed = rawUrl.trim()
    if (!trimmed) return null
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`
    }
    const url = new URL(trimmed)
    const host = url.hostname.replace(/^www\.|^m\./, '')

    if (host !== 'drive.google.com' && host !== 'docs.google.com') return null

    // Pattern 1: /file/d/<FILE_ID>/...
    const fileMatch = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (fileMatch && fileMatch[1]) {
      return {
        fileId: fileMatch[1],
        previewUrl: `https://drive.google.com/file/d/${fileMatch[1]}/preview`,
      }
    }

    // Pattern 2: ?id=<FILE_ID>
    const idParam = url.searchParams.get('id')
    if (idParam) {
      return {
        fileId: idParam,
        previewUrl: `https://drive.google.com/file/d/${idParam}/preview`,
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Checks if a Google Drive link is publicly viewable.
 * Returns { isPublic: true } if accessible, or { isPublic: false, error: "..." } if private/restricted.
 */
export async function checkDrivePublicAccess(fileId: string): Promise<{ isPublic: boolean; error?: string }> {
  try {
    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`
    const res = await fetch(previewUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
      redirect: 'follow',
    })

    const finalUrl = res.url
    if (finalUrl.includes('accounts.google.com') || res.status === 403 || res.status === 401 || res.status === 404) {
      return {
        isPublic: false,
        error: "This Drive link is private. Set sharing to 'Anyone with the link' so creators can watch it.",
      }
    }

    const html = await res.text()
    if (
      html.includes('You need access') ||
      html.includes('Request access') ||
      html.includes('Sign in to continue') ||
      html.includes('accounts.google.com/ServiceLogin')
    ) {
      return {
        isPublic: false,
        error: "This Drive link is private. Set sharing to 'Anyone with the link' so creators can watch it.",
      }
    }

    return { isPublic: true }
  } catch {
    return {
      isPublic: false,
      error: "Could not verify Drive link access. Please check 'Anyone with the link' permissions.",
    }
  }
}
