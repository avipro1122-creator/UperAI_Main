import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { ID } from 'node-appwrite'

export async function POST(request: Request) {
  if (!isAppwriteConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  let editorId: string
  try {
    const body = await request.json()
    editorId = String(body.editor_id ?? '')
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (!editorId) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

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
