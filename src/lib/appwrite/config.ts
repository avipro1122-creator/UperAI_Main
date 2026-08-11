export const APPWRITE_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a79eb7d0027a520fe58',
  projectName: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_NAME || 'UperAI',
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a79f6b70038d98dca2c',
  apiKey: process.env.APPWRITE_API_KEY || '',
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
