const defaultEndpoint = 'https://api.uperai.in/v1'
const rawEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim()
const safeEndpoint = rawEndpoint && (rawEndpoint.startsWith('http://') || rawEndpoint.startsWith('https://')) ? rawEndpoint : defaultEndpoint

export const APPWRITE_CONFIG = {
  endpoint: safeEndpoint,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim() || '6a79eb7d0027a520fe58',
  projectName: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_NAME || 'UperAI',
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID?.trim() || '6a79f6b70038d98dca2c',
  apiKey: process.env.APPWRITE_API_KEY?.trim() || 'standard_cb7a45f0e589918899234a298eee3bdf983a82bacbab72c74cea3b832eb4a6fcc0326d9cec5785297564b2c415fb5fa7220202611367cb6344c5d6d705e50dc25c8d10a0a376c2d32f6af2c438ec19a5cc3cd09a2ed5125873de3a1c8271322bec4aa62f1c9d8ba03e4846f5832540dc0779ab937c080d65c81d4f5f33a709c7',
  collections: {
    users: 'users',
    editor_profiles: 'editor_profiles',
    portfolio_items: 'portfolio_items',
    creator_profiles: 'creator_profiles',
    jobs: 'jobs',
    applications: 'applications',
    messages: 'messages',
    contact_clicks: 'contact_clicks',
  },
  buckets: {
    editor_thumbnails: 'editor_thumbnails',
  },
}

export function isAppwriteConfigured(): boolean {
  return Boolean(APPWRITE_CONFIG.projectId && APPWRITE_CONFIG.endpoint)
}

export function getAuthRedirectOrigin(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || 'https://www.uperai.in'
  }

  const origin = window.location.origin
  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return origin
  }

  const isRegisteredDomain =
    hostname === 'www.uperai.in' ||
    hostname === 'uperai.in' ||
    hostname === 'uper-ai.vercel.app' ||
    hostname === 'uperai.vercel.app'

  if (isRegisteredDomain) {
    return origin
  }

  return 'https://www.uperai.in'
}

