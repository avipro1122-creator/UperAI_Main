import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient, createSessionClient } from '@/lib/appwrite/server'
import { APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { parseVideoUrl } from '@/lib/video-parser'
import { fetchYoutubeOEmbed, parseYouTubeVideoId, getYouTubeThumbnail } from '@/lib/youtube'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { ID, Query, Permission, Role } from 'node-appwrite'
import { z } from 'zod'

const portfolioItemSchema = z.object({
  youtubeUrl: z.string().optional(),
  url: z.string().optional(),
  roleDescription: z.string().max(2000).optional(),
  roleExplanation: z.string().max(2000).optional(),
})

const onboardingSchema = z.object({
  fullName: z.string().max(255).optional(),
  name: z.string().max(255).optional(),
  headline: z.string().max(500).nullable().optional(),
  specialtyTag: z.string().max(255).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  baseRate: z.number().int().nonnegative().max(1000000).nullable().optional(),
  rateShort: z.number().int().nonnegative().max(1000000).nullable().optional(),
  rateLong: z.number().int().nonnegative().max(1000000).nullable().optional(),
  turnaroundTime: z.string().max(100).optional(),
  turnaroundDays: z.number().int().nonnegative().max(365).nullable().optional(),
  whatsapp: z.string().max(50).nullable().optional(),
  whatsappNumber: z.string().max(50).nullable().optional(),
  whatsapp_number: z.string().max(50).nullable().optional(),
  instagram: z.string().max(100).nullable().optional(),
  instagramHandle: z.string().max(100).nullable().optional(),
  instagram_handle: z.string().max(100).nullable().optional(),
  avatarUrl: z.string().url().or(z.literal('')).nullable().optional(),
  youtubeUrl: z.string().url().or(z.literal('')).nullable().optional(),
  youtube_url: z.string().url().or(z.literal('')).nullable().optional(),
  portfolio: z.array(portfolioItemSchema).optional(),
  clips: z.array(portfolioItemSchema).optional(),
})

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limitCheck = rateLimit(ip, 10, 60000)
  if (!limitCheck.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let userId: string = ''
  try {
    const { account } = await createSessionClient(req)
    const user = await account.get()
    if (user) userId = user.$id
  } catch {
    return NextResponse.json({ error: 'Please sign in to complete onboarding' }, { status: 401 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'Please sign in to complete onboarding' }, { status: 401 })
  }

  let jsonBody: any
  try {
    jsonBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const parsed = onboardingSchema.safeParse(jsonBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.format() }, { status: 400 })
  }

  const body = parsed.data

  const admin = await createAdminClient()
  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId

  const documentPermissions = [
    Permission.read(Role.any()),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]

  const rawPortfolio = Array.isArray(body.portfolio) && body.portfolio.length > 0
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

    const parsedVideo = parseVideoUrl(url)
    const videoId = parsedVideo?.videoId || parseYouTubeVideoId(url) || ''
    let title: string | null = null
    let thumbnailUrl: string | null = getYouTubeThumbnail(url)
    let isShort = false

    if (parsedVideo?.sourceType === 'youtube' || url.includes('youtu')) {
      try {
        const oembed = await fetchYoutubeOEmbed(url, !!parsedVideo?.isShortsUrl)
        if (oembed.available) {
          title = oembed.title ?? null
          thumbnailUrl = oembed.thumbnailUrl ?? thumbnailUrl
          isShort = !!oembed.isShort
        }
      } catch {
        // Fallback
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
  const instagramRaw = (body.instagramHandle || body.instagram || body.instagram_handle || '').trim().replace(/^@/, '')
  const instagramVal = instagramRaw || null

  const whatsappRaw = (body.whatsapp || body.whatsappNumber || body.whatsapp_number || '').trim()
  const whatsappVal = whatsappRaw ? whatsappRaw.replace(/[^0-9+]/g, '') || null : null

  const nameVal = (body.fullName || body.name || 'Editor').trim()
  const handle = nameVal.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30) || userId

  const payload = {
    user_id: userId,
    full_name: nameVal,
    display_name: nameVal,
    name: nameVal,
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
      payload,
      documentPermissions
    )
  } catch {
    document = await admin.databases.updateDocument(
      dbId,
      APPWRITE_CONFIG.collections.editor_profiles,
      userId,
      payload
    )
  }

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
      // Cleanup error ignore
    }

    for (const pItem of processedItems) {
      try {
        await admin.databases.createDocument(
          dbId,
          APPWRITE_CONFIG.collections.portfolio_items,
          ID.unique(),
          pItem,
          documentPermissions
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
    // Revalidation
  }

  return NextResponse.json({ success: true, document })
}
