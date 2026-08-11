import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { ID } from 'node-appwrite'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { editorId, editorName, channelUrl, format, notes } = body

    if (!channelUrl || typeof channelUrl !== 'string') {
      return NextResponse.json({ error: 'Valid channel URL is required' }, { status: 400 })
    }

    try {
      new URL(channelUrl)
    } catch {
      return NextResponse.json({ error: 'Please enter a valid URL (e.g. https://youtube.com/@channel)' }, { status: 400 })
    }

    if (!notes || typeof notes !== 'string' || notes.trim().length < 20) {
      return NextResponse.json({ error: 'Project notes must be at least 20 characters long' }, { status: 400 })
    }

    if (isAppwriteConfigured() && editorId) {
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
        console.error('Contact click insert error:', err)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Brief sent to ${editorName || 'Editor'}! They will review your project and reply soon.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to send brief' }, { status: 500 })
  }
}
