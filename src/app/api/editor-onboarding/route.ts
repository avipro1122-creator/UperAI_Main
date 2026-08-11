import { NextResponse } from 'next/server'
import { createAdminClient, createSessionClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { parseVideoUrl } from '@/lib/video-parser'
import { fetchYoutubeOEmbed } from '@/lib/youtube'
import { checkDrivePublicAccess } from '@/lib/gdrive'
import { normalizeIndianPhone } from '@/lib/phone'
import { ID, Query } from 'node-appwrite'

interface PortfolioInput {
  youtubeUrl: string
  roleDescription: string
}

interface Body {
  name: string
  bio: string | null
  city: string | null
  headline: string | null
  rateLong: number | null
  rateShort: number | null
  currency: string
  turnaroundDays: number | null
  whatsapp: string | null
  instagramHandle: string | null
  portfolio: PortfolioInput[]
}

export async function POST(request: Request) {
  if (!isAppwriteConfigured()) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 })
  }

  let user: any = null
  try {
    const { account } = await createSessionClient()
    user = await account.get()
  } catch {
    return NextResponse.json({ error: 'Please sign in to save your editor profile' }, { status: 401 })
  }

  if (!user) {
    return NextResponse.json({ error: 'Please sign in to save your editor profile' }, { status: 401 })
  }

  const body: Body = await request.json()

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Display name is required' }, { status: 400 })
  }

  let normalizedWhatsapp: string | null = null
  if (body.whatsapp?.trim()) {
    const waCheck = normalizeIndianPhone(body.whatsapp)
    if (waCheck.error || !waCheck.normalized) {
      return NextResponse.json({ error: waCheck.error || 'Invalid WhatsApp number' }, { status: 400 })
    }
    normalizedWhatsapp = waCheck.normalized
  }

  const normalizedInstagram = body.instagramHandle?.trim().replace(/^@/, '') || null

  if (!normalizedWhatsapp && !normalizedInstagram) {
    return NextResponse.json({ error: 'Please provide at least one contact method (WhatsApp or Instagram)' }, { status: 400 })
  }

  if (body.rateLong !== null && body.rateLong !== undefined && Number(body.rateLong) < 1) {
    return NextResponse.json({ error: 'Long-form rate must be at least ₹1 (or leave blank)' }, { status: 400 })
  }

  if (body.rateShort !== null && body.rateShort !== undefined && Number(body.rateShort) < 1) {
    return NextResponse.json({ error: 'Shorts rate must be at least ₹1 (or leave blank)' }, { status: 400 })
  }

  const validRateLong = body.rateLong != null && !isNaN(Number(body.rateLong)) ? Number(body.rateLong) : null
  const validRateShort = body.rateShort != null && !isNaN(Number(body.rateShort)) ? Number(body.rateShort) : null

  if (validRateLong === null && validRateShort === null) {
    return NextResponse.json({ error: 'Please set at least one rate (Long-form or Shorts)' }, { status: 400 })
  }

  if (!Array.isArray(body.portfolio) || body.portfolio.length < 3 || body.portfolio.length > 6) {
    return NextResponse.json({ error: 'Please add between 3 and 6 video links' }, { status: 400 })
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

  // Update user document
  const handle = body.name.toLowerCase().replace(/[^a-z0-9]/g, '')
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
      }
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
      profilePayload
    )
  } catch {
    await admin.databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.editor_profiles,
      user.$id,
      profilePayload
    )
  }

  // Delete old portfolio items for this editor in Appwrite
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

  // Insert portfolio items
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
      }
    )
  }

  return NextResponse.json({ handle })
}
