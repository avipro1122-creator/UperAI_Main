import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/appwrite/server'
import { APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { ID } from 'node-appwrite'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { databases } = await createAdminClient()

    const document = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.editor_profiles,
      ID.unique(),
      {
        full_name: body.fullName || body.name || 'Editor',
        avatar_url: body.avatarUrl || '',
        specialty_tag: body.specialtyTag || body.headline || 'Video Editor',
        base_rate: Number(body.baseRate) || 1500,
        turnaround_time: body.turnaroundTime || '2 Days',
        youtube_url: body.youtubeUrl || '',
        whatsapp_number: body.whatsappNumber || body.whatsapp || '',
      }
    )

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
