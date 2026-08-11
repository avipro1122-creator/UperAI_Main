import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient, createSessionClient } from '@/lib/appwrite/server'
import { APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { ID } from 'node-appwrite'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let userId: string = body.userId || body.user_id || ''

    if (!userId) {
      try {
        const { account } = await createSessionClient()
        const user = await account.get()
        if (user) userId = user.$id
      } catch {
        // User session check fallback
      }
    }

    if (!userId) {
      userId = ID.unique()
    }

    const admin = await createAdminClient()
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId

    const payload = {
      user_id: userId,
      full_name: body.fullName || body.name || 'Editor',
      avatar_url: body.avatarUrl || '',
      specialty_tag: body.specialtyTag || body.headline || 'Video Editor',
      base_rate: Number(body.baseRate) || 1500,
      turnaround_time: body.turnaroundTime || '2 Days',
      youtube_url: body.youtubeUrl || '',
      whatsapp_number: body.whatsappNumber || body.whatsapp || '',
    }

    let document
    try {
      document = await admin.databases.createDocument(
        dbId,
        APPWRITE_CONFIG.collections.editor_profiles,
        userId,
        payload
      )
    } catch {
      document = await admin.databases.updateDocument(
        dbId,
        APPWRITE_CONFIG.collections.editor_profiles,
        userId,
        payload
      )
    }

    try {
      revalidatePath('/')
      revalidatePath('/editors')
    } catch {
      // Revalidation skip
    }

    return NextResponse.json({ success: true, document })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
