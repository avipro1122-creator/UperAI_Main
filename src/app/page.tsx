import { createAdminClient, createSessionClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import HeroSection from '@/components/HeroSection'
import BentoMarketplace, { BentoEditorItem } from '@/components/BentoMarketplace'
import RecentlyActiveEditors, { ExtendedEditorCardData } from '@/components/RecentlyActiveEditors'
import { Query } from 'node-appwrite'
import { parseVideoUrl } from '@/lib/video-parser'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const extractYouTubeId = (url?: string | null) => {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/)
  return match ? match[1] : null
}

export default async function HomePage() {
  let featured: ExtendedEditorCardData[] = []
  let bentoEditors: BentoEditorItem[] = []
  let userRole: string | null = null
  let userHandle: string | null = null
  let isServerError = false

  if (isAppwriteConfigured()) {
    try {
      const admin = await createAdminClient()

      // Safely try fetching auth user
      try {
        const { account, databases } = await createSessionClient()
        const user = await account.get()
        if (user) {
          const userDocs = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.users,
            [Query.equal('$id', user.$id)]
          )
          const dbUser = userDocs.documents[0]
          userRole = dbUser?.role ?? null
          userHandle = dbUser?.handle ?? null
        }
      } catch {
        // Auth check optional
      }

      // Fetch editor profiles from Appwrite Databases
      let response: any
      const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId
      try {
        response = await admin.databases.listDocuments(
          dbId,
          APPWRITE_CONFIG.collections.editor_profiles,
          [Query.limit(100), Query.orderDesc('$createdAt')]
        )
      } catch {
        response = await admin.databases.listDocuments(
          dbId,
          APPWRITE_CONFIG.collections.editor_profiles,
          [Query.limit(100)]
        )
      }

      const recentProfiles = (response?.documents || []).filter((p: any) => !p.is_hidden)

      const editorIds = recentProfiles.map((p: any) => p.user_id || p.$id).filter(Boolean)

      let items: any[] = []
      if (editorIds.length > 0) {
        try {
          const itemsRes = await admin.databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.portfolio_items,
            [Query.limit(100)]
          )
          items = itemsRes.documents || []
        } catch {
          items = []
        }
      }

      const itemsByEditor = new Map<string, any[]>()
      for (const item of items) {
        const key = item.editor_id
        const list = itemsByEditor.get(key) ?? []
        list.push(item)
        itemsByEditor.set(key, list)
      }

      featured = recentProfiles.map((p: any) => {
        const editorId = p.user_id || p.$id
        const editorItems = itemsByEditor.get(editorId) ?? []
        const hasShort = editorItems.some((i) => i.is_short || i.format?.toLowerCase().includes('short'))
        const hasLong = editorItems.some((i) => !i.is_short || i.format?.toLowerCase().includes('long'))
        const format_tag =
          editorItems.length === 0
            ? null
            : hasShort && hasLong
              ? 'Both'
              : hasShort
                ? 'Shorts'
                : 'Long-form'
        const name = p.full_name || p.display_name || p.name || 'Editor'
        const avatar =
          p.avatar_url ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
        const handle = p.handle || name.toLowerCase().replace(/[^a-z0-9]/g, '')
        const firstItem = editorItems[0]
        const rawVideoUrl = p.youtube_url || p.youtube_url1 || p.youtube_url2 || p.youtube_url3 || p.showreel_url || p.video_url || p.video_url1 || p.video_url2 || p.video_url3 || firstItem?.video_url || firstItem?.youtube_url
        const parsedVideo = parseVideoUrl(rawVideoUrl)
        // Thumbnail priority: custom (video #1, then #2) > saved preview_img
        // (already custom-first if set via the dashboard) > portfolio item >
        // auto-detected YouTube/Drive/Vimeo thumbnail. Canvas frame-capture and
        // the placeholder fallback are handled at render time in EditorCard.tsx.
        const previewImg = p.thumbnail_url1 || p.thumbnail_url2 || p.preview_img || firstItem?.thumbnail_url || parsedVideo?.thumbnailUrl || null
        const minRate = p.min_rate ?? p.base_rate ?? p.rate_short ?? p.rate_long

        return {
          id: editorId,
          handle,
          name,
          avatar_url: avatar,
          headline: p.headline || p.specialty_tag,
          min_rate: minRate,
          currency: p.currency ?? 'INR',
          thumbnail_url: previewImg,
          format_tag,
          instagram_handle: p.instagram_handle || p.instagram || null,
          specialty: p.specialty_tag || p.headline || '',
          softwareTags: p.software || ['Premiere Pro', 'After Effects'],
          raw_video_url: rawVideoUrl || null,
        } satisfies ExtendedEditorCardData
      })

      bentoEditors = recentProfiles.map((doc: any) => {
        const editorId = doc.user_id || doc.$id
        const editorItems = itemsByEditor.get(editorId) ?? []
        const firstItem = editorItems[0]
        const rawVideoUrl = doc.youtube_url || doc.youtube_url1 || doc.youtube_url2 || doc.youtube_url3 || doc.showreel_url || doc.video_url || doc.video_url1 || doc.video_url2 || doc.video_url3 || firstItem?.video_url || firstItem?.youtube_url
        const parsedVideo = parseVideoUrl(rawVideoUrl)

        const hasShort = editorItems.some((i) => i.is_short || i.format?.toLowerCase().includes('short')) || parsedVideo?.sourceType === 'instagram' || parsedVideo?.isShortsUrl
        const hasLong = editorItems.some((i) => !i.is_short || i.format?.toLowerCase().includes('long'))
        const category: 'shorts' | 'long' | 'vfx' =
          hasShort && !hasLong ? 'shorts' : hasLong && !hasShort ? 'long' : 'vfx'
        const minRate = Number(doc.base_rate || doc.min_rate || doc.rate_short || doc.rate_long || 1500)
        const editorName = doc.full_name || doc.display_name || doc.name || 'Editor'
        const googleAvatar =
          doc.avatar_url ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editorName)}`
        const previewImg = doc.thumbnail_url1 || doc.thumbnail_url2 || doc.preview_img || firstItem?.thumbnail_url || parsedVideo?.thumbnailUrl || null
        const badgeText = firstItem?.role_explanation || firstItem?.role_description || doc.specialty_tag || doc.headline || 'Verified Editor'

        return {
          id: editorId,
          name: editorName,
          avatar: googleAvatar,
          specialty: doc.specialty_tag || doc.headline || (hasShort ? 'Shorts / Reels Specialist' : '16:9 Long-Form Specialist'),
          category,
          headline: doc.headline || doc.specialty_tag || 'Video Editor & Motion Specialist',
          rate: minRate,
          rateLabel: `₹${Number(doc.base_rate || minRate).toLocaleString()} / Video`,
          turnaround: doc.turnaround_time || (doc.turnaround_days ? `${doc.turnaround_days} Days Turnaround` : '2 Days'),
          badgeText,
          videoId: parsedVideo?.videoId || '',
          previewImg: previewImg || '',
          softwareTags: doc.software || ['Premiere Pro', 'After Effects'],
        } satisfies BentoEditorItem
      })
    } catch (err) {
      console.error('Appwrite Fetch Error (Downtime/Network):', err)
      isServerError = true
      featured = []
      bentoEditors = []
    }
  }

  return (
    <div className="bg-[#0E1017] text-gray-100 min-h-screen selection:bg-lime-400 selection:text-black">
      {/* Soft Server Maintenance Banner Notice */}
      {isServerError && (
        <div className="bg-amber-950/80 border-b border-amber-800/60 py-3 px-4 text-center text-amber-200 text-xs font-semibold flex items-center justify-center gap-2">
          <span>⚡</span>
          <span>We are currently undergoing brief backend maintenance. Please refresh in a few minutes.</span>
        </div>
      )}

      {/* Hero Section */}
      <HeroSection
        featured={featured}
        userRole={userRole}
        userHandle={userHandle}
      />

      {/* Feature Highlight Cards ("Indian editors. Rates upfront.") */}
      <BentoMarketplace dbEditors={bentoEditors} isServerError={isServerError} />

      {/* Recently Active Editors Showcase Directory with Search */}
      <RecentlyActiveEditors editors={featured} isServerError={isServerError} />
    </div>
  )
}