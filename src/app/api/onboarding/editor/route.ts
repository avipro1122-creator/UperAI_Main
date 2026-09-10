import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/firebase/client'
import { doc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore'
import { parseVideoUrl } from '@/lib/video-parser'
import { resolveThumbnailUrl } from '@/lib/thumbnail-resolver'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

const portfolioItemSchema = z.object({
  youtubeUrl: z.string().optional(),
  url: z.string().optional(),
  roleDescription: z.string().max(2000).optional(),
  roleExplanation: z.string().max(2000).optional(),
})

const onboardingSchema = z.object({
  userId: z.string().optional(),
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

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = onboardingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.format() },
      { status: 400 }
    )
  }

  const userId = body.userId || body.user_id || 'editor-' + Date.now()

  const rawPortfolio = Array.isArray(body.portfolio)
    ? body.portfolio
    : Array.isArray(body.clips)
    ? body.clips
    : []

  const processedItems = []
  let primaryYoutubeUrl = body.youtubeUrl || body.youtube_url || null

  for (let idx = 0; idx < rawPortfolio.length; idx++) {
    const item = rawPortfolio[idx]
    const rawUrl = (item.youtubeUrl || item.url || '').trim()
    if (!rawUrl) continue

    if (!primaryYoutubeUrl) {
      primaryYoutubeUrl = rawUrl
    }

    const parsedVideo = parseVideoUrl(rawUrl)
    const isShort = parsedVideo?.isShortsUrl || parsedVideo?.sourceType === 'instagram'

    processedItems.push({
      editor_id: userId,
      title: item.roleDescription || item.roleExplanation || `Project #${idx + 1}`,
      video_url: rawUrl,
      youtube_url: rawUrl,
      video_id: parsedVideo?.videoId || '',
      role_description: item.roleDescription || item.roleExplanation || '',
      role_explanation: item.roleExplanation || item.roleDescription || '',
      position: idx,
      thumbnail_url: resolveThumbnailUrl(rawUrl) || parsedVideo?.thumbnailUrl || '',
      is_short: isShort,
      is_available: true,
      createdAt: new Date().toISOString(),
    })
  }

  const nameVal = (body.fullName || body.name || 'Editor').trim()
  const handle = nameVal.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30) || userId
  const instagramRaw = (body.instagram || body.instagramHandle || body.instagram_handle || '').trim().replace(/^@/, '')
  const whatsappRaw = (body.whatsapp || body.whatsappNumber || body.whatsapp_number || '').trim().replace(/[^0-9+]/g, '')
  const whatsappVal = whatsappRaw && whatsappRaw.length >= 10 ? (whatsappRaw.length === 10 ? `91${whatsappRaw}` : whatsappRaw) : '919016047119'

  const firstThumb = processedItems[0]?.thumbnail_url || resolveThumbnailUrl(primaryYoutubeUrl) || ''

  const profilePayload = {
    user_id: userId,
    full_name: nameVal,
    display_name: nameVal,
    name: nameVal,
    handle,
    avatar_url: body.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameVal)}`,
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
    instagram: instagramRaw || null,
    instagram_handle: instagramRaw || null,
    turnaround_time: body.turnaroundTime || (body.turnaroundDays ? `${body.turnaroundDays} Days` : '2 Days'),
    turnaround_days: body.turnaroundDays ? Number(body.turnaroundDays) : 2,
    youtube_url: primaryYoutubeUrl,
    thumbnail_url: firstThumb || null,
    preview_img: firstThumb || null,
    thumbnail_url1: processedItems[0]?.thumbnail_url || null,
    thumbnail_url2: processedItems[1]?.thumbnail_url || null,
    thumbnail_url3: processedItems[2]?.thumbnail_url || null,
    open_to_work: true,
    is_hidden: false,
    updatedAt: new Date().toISOString(),
  }

  // Save to Firestore editor_profiles
  const editorRef = doc(db, 'editor_profiles', userId)
  await setDoc(editorRef, profilePayload, { merge: true })

  // Also update user role to EDITOR in users/{userId}
  const userRef = doc(db, 'users', userId)
  await setDoc(userRef, { role: 'EDITOR', handle, name: nameVal, updatedAt: new Date().toISOString() }, { merge: true })

  // Save portfolio items
  if (processedItems.length > 0) {
    try {
      const q = query(collection(db, 'portfolio_items'), where('editor_id', '==', userId))
      const oldDocs = await getDocs(q)
      for (const d of oldDocs.docs) {
        await deleteDoc(d.ref)
      }
    } catch {
      // ignore
    }

    for (const pItem of processedItems) {
      await addDoc(collection(db, 'portfolio_items'), pItem)
    }
  }

  try {
    revalidatePath('/')
    revalidatePath('/editors')
  } catch {
    // ignore
  }

  return NextResponse.json({ success: true, document: profilePayload })
}
