import Link from 'next/link'
import { createAdminClient, createSessionClient } from '@/lib/appwrite/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'
import EditorCard, { EditorCardData } from '@/components/EditorCard'
import HeroSection from '@/components/HeroSection'
import BentoMarketplace, { BentoEditorItem } from '@/components/BentoMarketplace'
import MarketplaceRoleHeader from '@/components/MarketplaceRoleHeader'
import { Query } from 'node-appwrite'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const extractYouTubeId = (url?: string) => {
  if (!url) return 'L_LUpnjgPso'
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/)
  return match ? match[1] : 'L_LUpnjgPso'
}

export default async function HomePage() {
  let featured: EditorCardData[] = []
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
      const response = await admin.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.editor_profiles,
        [Query.orderDesc('$createdAt')]
      )
      const recentProfiles = response.documents || []

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

      featured = recentProfiles.slice(0, 3).map((p: any) => {
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
        const videoId = extractYouTubeId(p.youtube_url || firstItem?.video_url || firstItem?.youtube_url)
        const previewImg = firstItem?.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
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
        } satisfies EditorCardData
      })

      bentoEditors = recentProfiles.map((doc: any) => {
        const editorId = doc.user_id || doc.$id
        const editorItems = itemsByEditor.get(editorId) ?? []
        const firstItem = editorItems[0]
        const videoId = extractYouTubeId(doc.youtube_url || firstItem?.video_url || firstItem?.youtube_url)

        const hasShort = editorItems.some((i) => i.is_short || i.format?.toLowerCase().includes('short'))
        const hasLong = editorItems.some((i) => !i.is_short || i.format?.toLowerCase().includes('long'))
        const category: 'shorts' | 'long' | 'vfx' =
          hasShort && !hasLong ? 'shorts' : hasLong && !hasShort ? 'long' : 'vfx'
        const minRate = Number(doc.base_rate || doc.min_rate || doc.rate_short || doc.rate_long || 1500)
        const editorName = doc.full_name || doc.display_name || doc.name || 'Editor'
        const googleAvatar =
          doc.avatar_url ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editorName)}`
        const previewImg = firstItem?.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
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
          previewImg,
          softwareTags: doc.software || ['Premiere Pro', 'After Effects'],
        } satisfies BentoEditorItem
      })
    } catch (err) {
      console.error('Appwrite Fetch Error:', err)
    }
  }

  return (
    <div className="bg-[#09090b] text-zinc-100 min-h-screen">
      {/* Hero Section */}
      <HeroSection
        featured={featured}
        userRole={userRole}
        userHandle={userHandle}
      />

      {/* Role-based marketplace header bar */}
      <MarketplaceRoleHeader />

      {/* Dynamic Bento Marketplace Grid */}
      <BentoMarketplace dbEditors={bentoEditors} />

      {/* Featured editors — only render if real editors exist */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              Recently active editors
            </h2>
            <Link href="/editors" className="text-xs font-semibold text-zinc-300 hover:text-white underline underline-offset-4">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {featured.map((editor) => (
              <EditorCard key={editor.handle} editor={editor} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}