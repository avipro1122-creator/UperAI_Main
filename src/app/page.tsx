import type { Metadata } from 'next'
import HeroSection from '@/components/HeroSection'
import HowItWorksSection from '@/components/HowItWorksSection'
import MarketplaceFeed from '@/components/MarketplaceFeed'
import JsonLd from '@/components/JsonLd'
import { getPublicEditors } from '@/lib/firebase/firestore'
import { parseVideoUrl } from '@/lib/video-parser'
import { ExtendedEditorCardData } from '@/components/RecentlyActiveEditors'

export const revalidate = 15

export const metadata: Metadata = {
  title: 'Hire Verified Indian Video Editors | Rates Upfront in INR',
  description:
    'Stop hiring in Instagram DMs. Audition real showreels, filter by vertical Shorts or 16:9 Long-Form, and hire top Indian video editors directly with transparent INR rates.',
  alternates: {
    canonical: 'https://www.uperai.in',
  },
  openGraph: {
    title: 'Hire Verified Indian Video Editors | Rates Upfront in INR — UperAI',
    description:
      'Audition real portfolio clips and hire verified Indian video editors with upfront rates in INR. Direct WhatsApp connection.',
    url: 'https://www.uperai.in',
  },
}

export default async function HomePage() {
  let featured: ExtendedEditorCardData[] = []
  let isServerError = false

  try {
    const recentProfiles = await getPublicEditors(18)

    featured = recentProfiles.map((p: any) => {
      const editorId = p.user_id || p.id
      const rawVideoUrl =
        p.youtube_url ||
        p.youtube_url1 ||
        p.youtube_url2 ||
        p.youtube_url3 ||
        p.showreel_url ||
        p.video_url ||
        p.video_url1 ||
        p.video_url2 ||
        p.video_url3
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
  } catch (err) {
    console.error('Firestore Fetch Error:', err)
    isServerError = true
    featured = []
  }

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Featured Video Editors in India',
    description: 'Top verified Indian freelance video editors on UperAI',
    numberOfItems: featured.length,
    itemListElement: featured.slice(0, 10).map((editor, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: editor.name,
      url: `https://www.uperai.in/editors/${editor.handle}`,
      description: editor.headline,
      image: editor.avatar_url || editor.thumbnail_url,
    })),
  }

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen selection:bg-lime-400 selection:text-black pb-16 sm:pb-0">
      <JsonLd data={itemListSchema} id="featured-editors-schema" />

      {/* Soft Server Maintenance Banner Notice */}
      {isServerError && (
        <div className="bg-amber-950/80 border-b border-amber-800/60 py-3 px-4 text-center text-amber-200 text-xs font-semibold flex items-center justify-center gap-2">
          <span>⚡</span>
          <span>We are currently undergoing brief backend maintenance. Please refresh in a few minutes.</span>
        </div>
      )}

      {/* 1. Hero Section with Audience Switcher, Bold Headline, Distinct CTAs, 9:16 Floating Cards */}
      <HeroSection featured={featured} />

      {/* 2. Educational How It Works Section (Cards 01–03) */}
      <HowItWorksSection />

      {/* 3. Dedicated Sticky Filter Bar & Editor Directory Feed */}
      <MarketplaceFeed editors={featured} isServerError={isServerError} />
    </div>
  )
}