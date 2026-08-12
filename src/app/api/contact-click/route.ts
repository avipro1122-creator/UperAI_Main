import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { ID } from 'node-appwrite'
import { z } from 'zod'

const contactClickSchema = z.object({
  editor_id: z.string().min(1).max(255),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const limitCheck = rateLimit(ip, 15, 60000)
  if (!limitCheck.success) {
    return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 })
  }

  if (!isAppwriteConfigured()) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable' }, { status: 503 })
  }

  let jsonBody: any
  try {
    jsonBody = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = contactClickSchema.safeParse(jsonBody)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Validation error' }, { status: 400 })
  }

  const editorId = parsed.data.editor_id

  try {
    const admin = await createAdminClient()
    await admin.databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.contact_clicks,
      ID.unique(),
      {
        editor_id: editorId,
        clicked_at: new Date().toISOString(),
      }
    )
  } catch (err) {
    console.error('Contact click error:', err)
  }

  return NextResponse.json({ ok: true })
}
