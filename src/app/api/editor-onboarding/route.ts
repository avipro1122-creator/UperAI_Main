import { NextResponse } from 'next/server'
import { createAdminClient, createSessionClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { parseVideoUrl } from '@/lib/video-parser'
import { fetchYoutubeOEmbed } from '@/lib/youtube'
import { checkDrivePublicAccess } from '@/lib/gdrive'
import { normalizeIndianPhone } from '@/lib/phone'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { ID, Query, Permission, Role } from 'node-appwrite'
import { z } from 'zod'

const portfolioItemSchema = z.object({
  youtubeUrl: z.string().min(1),
  roleDescription: z.string().max(2000),
})

const editorOnboardingSchema = z.object({
  name: z.string().min(1).max(255),
  bio: z.string().max(2000).nullable().optional(),
  city: z.string().max(255).nullable().optional(),
  headline: z.string().max(500).nullable().optional(),
  rateLong: z.number().int().nonnegative().max(1000000).nullable().optional(),
  rateShort: z.number().int().nonnegative().max(1000000).nullable().optional(),
  currency: z.string().max(10).optional().default('INR'),
  turnaroundDays: z.number().int().nonnegative().max(365).nullable().optional(),
  whatsapp: z.string().max(50).nullable().optional(),
  instagramHandle: z.string().max(100).nullable().optional(),
  portfolio: z.array(portfolioItemSchema).min(3).max(6),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const limitCheck = rateLimit(ip, 10, 60000)
  if (!limitCheck.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  if (!isAppwriteConfigured()) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 })
  }

  let user: any = null
  try {
    const { account } = await createSessionClient(request)
    user = await account.get()
  } catch {
    return NextResponse.json({ error: 'Please sign in to save your editor profile' }, { status: 401 })
  }

  if (!user) {
    return NextResponse.json({ error: 'Please sign in to save your editor profile' }, { status: 401 })
  }

  let jsonBody: any
  try {
    jsonBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsedPayload = editorOnboardingSchema.safeParse(jsonBody)
  if (!parsedPayload.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsedPayload.error.format() },
      { status: 400 }
    )
  }

  const body = parsedPayload.data

  let normalizedWhatsapp = '919016047119'
  if (body.whatsapp?.trim()) {
    const waCheck = normalizeIndianPhone(body.whatsapp)
    if (waCheck.normalized) {
      normalizedWhatsapp = waCheck.normalized
    } else {
      const cleanDigits = body.whatsapp.replace(/\D/g, '')
      if (cleanDigits.length >= 10) {
        normalizedWhatsapp = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits
      }
    }
  }

  const normalizedInstagram = body.instagramHandle?.trim().replace(/^@/, '') || null

  const validRateLong = body.rateLong != null && !isNaN(Number(body.rateLong)) ? Number(body.rateLong) : null
  const validRateShort = body.rateShort != null && !isNaN(Number(body.rateShort)) ? Number(body.rateShort) : null

  if (validRateLong === null && validRateShort === null) {
    return NextResponse.json({ error: 'Please set at least one rate (Long-form or Shorts)' }, { status: 400 })
  }

  let driveErrorMsg: string | null = null

  const items = await Promise.all(
    body.portfolio.map(async (item, index) => {
      const parsed = parseVideoUrl(item.youtubeUrl)
      if (!parsed) return null

      if (parsed.sourceType === 'youtube') {
        const oembed = await fetchYoutubeOEmbed(item.youtubeUrl, !!parsed.isShortsUrl)
        return {
          editor_id: user.$id,
          youtube_url: item.youtubeUrl.trim(),
          video_id: parsed.videoId,
          title: oembed.title ?? null,
          role_description: item.roleDescription?.trim() || '',
          position: index,
          thumbnail_url: oembed.thumbnailUrl ?? null,
          is_short: !!oembed.isShort,
          is_available: oembed.available,
        }
      }

      if (parsed.sourceType === 'drive') {
        const check = await checkDrivePublicAccess(parsed.videoId)
        if (!check.isPublic) {
          driveErrorMsg = check.error || "This Drive link is private. Set sharing to 'Anyone with the link' so creators can watch it."
          return null
        }
        return {
          editor_id: user.$id,
          youtube_url: item.youtubeUrl.trim(),
          video_id: parsed.videoId,
          title: null,
          role_description: item.roleDescription?.trim() || '',
          position: index,
          thumbnail_url: null,
          is_short: false,
          is_available: true,
        }
      }

      return null
    })
  )

  if (driveErrorMsg) {
    return NextResponse.json({ error: driveErrorMsg }, { status: 400 })
  }

  const validItems = items.filter(
    (i): i is NonNullable<typeof i> => i !== null && i.role_description.length > 0
  )

  if (validItems.length < 3) {
    return NextResponse.json(
      { error: 'Please provide at least 3 valid video links, each with a role description' },
      { status: 400 }
    )
  }

  const admin = await createAdminClient()
  const documentPermissions = [
    Permission.read(Role.any()),
    Permission.update(Role.user(user.$id)),
    Permission.delete(Role.user(user.$id)),
  ]

  const handle = body.name.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30) || user.$id

  try {
    await admin.databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.users,
      user.$id,
      {
        name: body.name.trim(),
        handle,
        bio: body.bio?.trim() || null,
        city: body.city?.trim() || null,
        role: 'editor',
        last_active_at: new Date().toISOString(),
      }
    )
  } catch {
    await admin.databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.users,
      user.$id,
      {
        name: body.name.trim(),
        handle,
        bio: body.bio?.trim() || null,
        city: body.city?.trim() || null,
        role: 'editor',
        last_active_at: new Date().toISOString(),
      },
      documentPermissions
    )
  }

  const rates = [validRateLong, validRateShort].filter((r): r is number => r != null)
  const minRate = rates.length > 0 ? Math.min(...rates) : null
  const maxRate = rates.length > 0 ? Math.max(...rates) : null

  const profilePayload = {
    user_id: user.$id,
    full_name: body.name.trim(),
    headline: body.headline?.trim() || null,
    specialty_tag: body.headline?.trim() || 'Video Editor & Motion Graphics',
    base_rate: minRate || 1500,
    rate_long: validRateLong,
    rate_short: validRateShort,
    min_rate: minRate,
    max_rate: maxRate,
    currency: body.currency || 'INR',
    turnaround_time: `${body.turnaroundDays || 2} Days`,
    turnaround_days: body.turnaroundDays ? Number(body.turnaroundDays) : null,
    whatsapp: normalizedWhatsapp,
    whatsapp_number: normalizedWhatsapp,
    instagram_handle: normalizedInstagram,
    bio: body.bio?.trim() || null,
    open_to_work: true,
    is_hidden: false,
  }

  try {
    await admin.databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.editor_profiles,
      user.$id,
      profilePayload,
      documentPermissions
    )
  } catch {
    await admin.databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.editor_profiles,
      user.$id,
      profilePayload
    )
  }

  try {
    const existing = await admin.databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.portfolio_items,
      [Query.equal('editor_id', user.$id)]
    )
    for (const doc of existing.documents) {
      await admin.databases.deleteDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.portfolio_items,
        doc.$id
      )
    }
  } catch {
    // Ignore cleanup error
  }

  for (let index = 0; index < validItems.length; index++) {
    const item = validItems[index]
    await admin.databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.portfolio_items,
      ID.unique(),
      {
        editor_id: user.$id,
        title: item.title || item.role_description || `Portfolio Video ${index + 1}`,
        video_url: item.youtube_url,
        youtube_url: item.youtube_url,
        video_id: item.video_id,
        role_description: item.role_description,
        position: index,
        thumbnail_url: item.thumbnail_url,
        is_short: item.is_short,
        is_available: item.is_available,
      },
      documentPermissions
    )
  }

  return NextResponse.json({ handle })
}
