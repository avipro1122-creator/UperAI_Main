import HeroSection from '@/components/HeroSection'
import BentoMarketplace, { BentoEditorItem } from '@/components/BentoMarketplace'
import RecentlyActiveEditors, { ExtendedEditorCardData } from '@/components/RecentlyActiveEditors'
import { getPublicEditors } from '@/lib/firebase/firestore'
import { parseVideoUrl } from '@/lib/video-parser'

export const revalidate = 15

export default async function HomePage() {
  let featured: ExtendedEditorCardData[] = []
  let bentoEditors: BentoEditorItem[] = []
  let isServerError = false

  try {
    const recentProfiles = await getPublicEditors(16)

    featured = recentProfiles.map((p: any) => {
      const editorId = p.user_id || p.id
      const rawVideoUrl = p.youtube_url || p.youtube_url1 || p.youtube_url2 || p.youtube_url3 || p.showreel_url || p.video_url || p.video_url1 || p.video_url2 || p.video_url3
      const parsedVideo = parseVideoUrl(rawVideoUrl)

      const categoryTag = (p.specialty_tag || p.headline || '').toLowerCase()
      const format_tag =
        categoryTag.includes('short') && categoryTag.includes('long')
          ? 'Both'
          : categoryTag.includes('short') || parsedVideo?.isShortsUrl
            ? 'Shorts'
            : 'Long-form'

      const name = p.full_name || p.display_name || p.name || 'Editor'
      const avatar =
        p.avatar_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
      const rawHandle = p.handle || p.instagram_handle || name.toLowerCase().replace(/[^a-z0-9]/g, '')
      const cleanHandle = rawHandle.replace(/@.+$/, '').replace(/^@/, '').trim()
      const videoThumb = parsedVideo?.thumbnailUrl || p.thumbnail_url1 || p.thumbnail_url2 || p.preview_img || null
      const minRate = p.min_rate ?? p.base_rate ?? p.rate_short ?? p.rate_long

      return {
        id: editorId,
        handle: cleanHandle,
        name,
        avatar_url: avatar,
        headline: p.headline || p.specialty_tag || 'Video Editor',
        min_rate: minRate,
        currency: p.currency ?? 'INR',
        thumbnail_url: videoThumb,
        format_tag,
        instagram_handle: cleanHandle,
        specialty: p.specialty_tag || p.headline || '',
        softwareTags: p.software || ['Premiere Pro', 'After Effects'],
        raw_video_url: rawVideoUrl || null,
      } satisfies ExtendedEditorCardData
    })

    bentoEditors = recentProfiles.map((doc: any) => {
      const editorId = doc.user_id || doc.id
      const rawVideoUrl = doc.youtube_url || doc.youtube_url1 || doc.youtube_url2 || doc.youtube_url3 || doc.showreel_url || doc.video_url || doc.video_url1 || doc.video_url2 || doc.video_url3
      const parsedVideo = parseVideoUrl(rawVideoUrl)

      const specText = (doc.specialty_tag || doc.headline || '').toLowerCase()
      const category: 'shorts' | 'long' | 'vfx' =
        specText.includes('vfx') || specText.includes('motion')
          ? 'vfx'
          : specText.includes('short') || parsedVideo?.isShortsUrl
            ? 'shorts'
            : 'long'

      const minRate = Number(doc.base_rate || doc.min_rate || doc.rate_short || doc.rate_long || 1500)
      const editorName = doc.full_name || doc.display_name || doc.name || 'Editor'
      const googleAvatar =
        doc.avatar_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editorName)}`
      const videoThumb = parsedVideo?.thumbnailUrl || doc.thumbnail_url1 || doc.thumbnail_url2 || doc.preview_img || null
      const badgeText = doc.specialty_tag || doc.headline || 'Verified Editor'

      return {
        id: editorId,
        name: editorName,
        avatar: googleAvatar,
        specialty: doc.specialty_tag || doc.headline || (category === 'shorts' ? 'Shorts / Reels Specialist' : '16:9 Long-Form Specialist'),
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
    console.error('Firestore Fetch Error:', err)
    isServerError = true
    featured = []
    bentoEditors = []
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
      <HeroSection featured={featured} />

      {/* Feature Highlight Cards ("Indian editors. Rates upfront.") */}
      <BentoMarketplace dbEditors={bentoEditors} isServerError={isServerError} />

      {/* Recently Active Editors Showcase Directory with Search */}
      <RecentlyActiveEditors editors={featured} isServerError={isServerError} />
    </div>
  )
}