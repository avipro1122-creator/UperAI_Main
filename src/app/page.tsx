import { createAdminClient, createSessionClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import HeroSection from '@/components/HeroSection'
import BentoMarketplace, { BentoEditorItem } from '@/components/BentoMarketplace'
import RecentlyActiveEditors, { ExtendedEditorCardData } from '@/components/RecentlyActiveEditors'
import { Query } from 'node-appwrite'

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
        const rawVideoUrl = p.youtube_url || p.youtube_url1 || p.youtube_url2 || p.youtube_url3 || firstItem?.video_url || firstItem?.youtube_url
        const videoId = extractYouTubeId(rawVideoUrl)
        const previewImg = p.preview_img || firstItem?.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null)
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
        } satisfies ExtendedEditorCardData
      })

      bentoEditors = recentProfiles.map((doc: any) => {
        const editorId = doc.user_id || doc.$id
        const editorItems = itemsByEditor.get(editorId) ?? []
        const firstItem = editorItems[0]
        const rawVideoUrl = doc.youtube_url || doc.youtube_url1 || doc.youtube_url2 || doc.youtube_url3 || firstItem?.video_url || firstItem?.youtube_url
        const videoId = extractYouTubeId(rawVideoUrl) || ''

        const hasShort = editorItems.some((i) => i.is_short || i.format?.toLowerCase().includes('short'))
        const hasLong = editorItems.some((i) => !i.is_short || i.format?.toLowerCase().includes('long'))
        const category: 'shorts' | 'long' | 'vfx' =
          hasShort && !hasLong ? 'shorts' : hasLong && !hasShort ? 'long' : 'vfx'
        const minRate = Number(doc.base_rate || doc.min_rate || doc.rate_short || doc.rate_long || 1500)
        const editorName = doc.full_name || doc.display_name || doc.name || 'Editor'
        const googleAvatar =
          doc.avatar_url ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editorName)}`
        const previewImg = doc.preview_img || firstItem?.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null)
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
          videoId,
          previewImg: previewImg || '',
          softwareTags: doc.software || ['Premiere Pro', 'After Effects'],
        } satisfies BentoEditorItem
      })
    } catch (err) {
      console.error('Appwrite Fetch Error:', err)
    }
  }

  return (
    <div className="bg-[#09090b] text-zinc-100 min-h-screen selection:bg-lime-400 selection:text-black">
      {/* Hero Section */}
      <HeroSection
        featured={featured}
        userRole={userRole}
        userHandle={userHandle}
      />

      {/* Feature Highlight Cards ("Indian editors. Rates upfront.") */}
      <BentoMarketplace dbEditors={bentoEditors} />

      {/* Recently Active Editors Showcase Directory with Search */}
      <RecentlyActiveEditors editors={featured} />
    </div>
  )
}