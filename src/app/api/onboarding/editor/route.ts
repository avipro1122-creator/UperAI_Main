import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient, createSessionClient } from '@/lib/appwrite/server'
import { APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { parseVideoUrl } from '@/lib/video-parser'
import { fetchYoutubeOEmbed, parseYouTubeVideoId, getYouTubeThumbnail } from '@/lib/youtube'
import { ID, Query } from 'node-appwrite'

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

    // Extract portfolio items from body
    const rawPortfolio: Array<{ youtubeUrl?: string; url?: string; roleDescription?: string; roleExplanation?: string }> =
      Array.isArray(body.portfolio) && body.portfolio.length > 0
        ? body.portfolio
        : Array.isArray(body.clips)
          ? body.clips
          : []

    const processedItems: Array<{
      editor_id: string
      title: string
      video_url: string
      youtube_url: string
      video_id: string
      role_description: string
      position: number
      thumbnail_url: string | null
      is_short: boolean
      is_available: boolean
    }> = []

    for (let i = 0; i < rawPortfolio.length; i++) {
      const item = rawPortfolio[i]
      const url = (item.youtubeUrl || item.url || '').trim()
      const roleDesc = (item.roleDescription || item.roleExplanation || '').trim()
      if (!url) continue

      const parsed = parseVideoUrl(url)
      const videoId = parsed?.videoId || parseYouTubeVideoId(url) || ''
      let title: string | null = null
      let thumbnailUrl: string | null = getYouTubeThumbnail(url)
      let isShort = false

      if (parsed?.sourceType === 'youtube' || url.includes('youtu')) {
        try {
          const oembed = await fetchYoutubeOEmbed(url, !!parsed?.isShortsUrl)
          if (oembed.available) {
            title = oembed.title ?? null
            thumbnailUrl = oembed.thumbnailUrl ?? thumbnailUrl
            isShort = !!oembed.isShort
          }
        } catch {
          // Fallback title & thumbnail
        }
      }

      processedItems.push({
        editor_id: userId,
        title: title || roleDesc || `Portfolio Video ${i + 1}`,
        video_url: url,
        youtube_url: url,
        video_id: videoId,
        role_description: roleDesc,
        position: i,
        thumbnail_url: thumbnailUrl,
        is_short: isShort,
        is_available: true,
      })
    }

    const firstRawUrl = (rawPortfolio[0]?.youtubeUrl || rawPortfolio[0]?.url || body.youtubeUrl || body.youtube_url || '').trim()
    const primaryYoutubeUrl = processedItems.length > 0 ? processedItems[0].youtube_url : firstRawUrl
    const instagramVal = (body.instagramHandle || body.instagram || body.instagram_handle || '').trim().replace(/^@/, '') || null
    const whatsappVal = (body.whatsapp || body.whatsappNumber || body.whatsapp_number || '').trim() || null

    const payload = {
      user_id: userId,
      full_name: body.fullName || body.name || 'Editor',
      display_name: body.fullName || body.name || 'Editor',
      name: body.fullName || body.name || 'Editor',
      avatar_url: body.avatarUrl || '',
      specialty_tag: body.specialtyTag || body.headline || 'Video Editor',
      base_rate: Number(body.baseRate) || Number(body.rateShort) || Number(body.rateLong) || 1500,
      rate_short: body.rateShort ? Number(body.rateShort) : null,
      rate_long: body.rateLong ? Number(body.rateLong) : null,
      min_rate: Number(body.baseRate) || Number(body.rateShort) || Number(body.rateLong) || 1500,
      max_rate: Number(body.rateLong) || Number(body.baseRate) || 1500,
      headline: body.headline || body.specialtyTag || 'Video Editor',
      bio: body.bio || null,
      whatsapp: whatsappVal,
      whatsapp_number: whatsappVal,
      instagram: instagramVal,
      instagram_handle: instagramVal,
      turnaround_time: body.turnaroundTime || (body.turnaroundDays ? `${body.turnaroundDays} Days` : '2 Days'),
      turnaround_days: body.turnaroundDays ? Number(body.turnaroundDays) : 2,
      youtube_url: primaryYoutubeUrl,
      open_to_work: true,
      is_hidden: false,
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

    // Save portfolio items to portfolio_items collection
    if (processedItems.length > 0) {
      try {
        const existing = await admin.databases.listDocuments(
          dbId,
          APPWRITE_CONFIG.collections.portfolio_items,
          [Query.equal('editor_id', userId)]
        )
        for (const doc of existing.documents) {
          await admin.databases.deleteDocument(
            dbId,
            APPWRITE_CONFIG.collections.portfolio_items,
            doc.$id
          )
        }
      } catch {
        // Cleanup optional
      }

      for (const pItem of processedItems) {
        try {
          await admin.databases.createDocument(
            dbId,
            APPWRITE_CONFIG.collections.portfolio_items,
            ID.unique(),
            pItem
          )
        } catch (pErr) {
          console.error('Error creating portfolio item document:', pErr)
        }
      }
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
