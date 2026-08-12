import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { ID } from 'node-appwrite'
import { z } from 'zod'

const sendBriefSchema = z.object({
  editorId: z.string().max(255).optional(),
  editorName: z.string().max(255).optional(),
  channelUrl: z.string().url('Please enter a valid URL (e.g. https://youtube.com/@channel)').max(2000),
  format: z.string().max(255).optional(),
  notes: z.string().min(20, 'Project notes must be at least 20 characters long').max(5000),
})

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const limitCheck = rateLimit(ip, 10, 60000)
    if (!limitCheck.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
    }

    let jsonBody: any
    try {
      jsonBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const parsed = sendBriefSchema.safeParse(jsonBody)
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || 'Invalid input'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const { editorId, editorName, channelUrl, notes } = parsed.data

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
