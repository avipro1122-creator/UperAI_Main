const defaultEndpoint = 'https://sgp.cloud.appwrite.io/v1'
const rawEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim()
const safeEndpoint = rawEndpoint && (rawEndpoint.startsWith('http://') || rawEndpoint.startsWith('https://')) ? rawEndpoint : defaultEndpoint

export const APPWRITE_CONFIG = {
  endpoint: safeEndpoint,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim() || '6a79eb7d0027a520fe58',
  projectName: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_NAME || 'UperAI',
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID?.trim() || '6a79f6b70038d98dca2c',
  apiKey: process.env.APPWRITE_API_KEY?.trim() || '',
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
}

export function isAppwriteConfigured(): boolean {
  return Boolean(APPWRITE_CONFIG.projectId && APPWRITE_CONFIG.endpoint)
}
