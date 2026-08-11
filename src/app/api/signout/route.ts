import { createSessionClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured } from '@/lib/appwrite/config'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin
  const response = NextResponse.redirect(`${origin}/`, { status: 303 })

  if (isAppwriteConfigured()) {
    try {
      const { account } = await createSessionClient()
      await account.deleteSession('current')
    } catch {
      // Ignore error if session is already invalid
    }
  }

  response.cookies.delete('a_session')
  response.cookies.delete('appwrite-session')

  return response
}
