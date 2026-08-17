import React from 'react'
import type { Metadata } from 'next'
import DirectoryView, { DirectoryEditor } from '@/components/DirectoryView'
import { EditorCardData } from '@/components/EditorCard'
import JsonLd from '@/components/JsonLd'
import { getPublicEditors } from '@/lib/firebase/firestore'

export const revalidate = 15

export const metadata: Metadata = {
  title: 'Browse Verified Video Editors in India | Upfront Pricing',
  description:
    'Explore India’s curated directory of freelance video editors for YouTube Shorts, Reels, Documentaries, and Gaming. Compare upfront rates in INR and audition portfolios.',
  alternates: {
    canonical: 'https://www.uperai.in/editors',
  },
  openGraph: {
    title: 'Browse Verified Video Editors in India | UperAI Directory',
    description:
      'Compare rates, filter by format (Shorts vs Long-form), and audition verified Indian video editor showreels.',
    url: 'https://www.uperai.in/editors',
  },
}

export default async function DirectoryPage() {
  let mapped: DirectoryEditor[] = []
  let isServerError = false

  try {
    const validDocs = await getPublicEditors(30)

    mapped = validDocs.map((doc: any) => {
      const rawUrl = doc.youtube_url || doc.youtube_url1 || doc.youtube_url2 || doc.youtube_url3 || ''
      const match = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/)
      const videoId = match ? match[1] : ''
      const editorId = doc.user_id || doc.id
      const editorName = doc.full_name || doc.display_name || doc.name || 'Editor'

      const category = (doc.specialty_tag || '').toLowerCase().includes('short')
        ? 'shorts'
        : (doc.specialty_tag || '').toLowerCase().includes('vfx')
        ? 'vfx'
        : 'long'

      const formatTag = category === 'shorts' ? 'Shorts' : category === 'vfx' ? 'Both' : 'Long-form'

      const rawHandle = doc.handle || doc.instagram_handle || editorName.toLowerCase().replace(/[^a-z0-9]/g, '') || editorId
      const cleanHandle = rawHandle.replace(/@.+$/, '').replace(/^@/, '').trim()

      const thumbnailUrl =
        (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null) ||
        doc.thumbnail_url1 ||
        doc.thumbnail_url2 ||
        doc.preview_img

      const cardData: EditorCardData = {
        id: editorId,
        handle: cleanHandle,
        name: editorName,
        avatar_url: doc.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editorName)}`,
        headline: doc.specialty_tag || doc.headline || 'Video Editor',
        min_rate: Number(doc.base_rate || doc.min_rate || 1500),
        currency: doc.currency || 'INR',
        thumbnail_url: thumbnailUrl,
        format_tag: formatTag,
        instagram_handle: cleanHandle,
        specialty: doc.specialty_tag || doc.headline || '',
        softwareTags: doc.software || ['Premiere Pro', 'After Effects'],
        raw_video_url: rawUrl || null,
      }

      return {
        id: editorId,
        name: editorName,
        specialty: doc.specialty_tag || 'Video Editor',
        category,
        cardData,
      }
    })
  } catch (err) {
    console.error('Failed to load directory from Firestore:', err)
    isServerError = true
    mapped = []
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.uperai.in',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Video Editors Directory',
        item: 'https://www.uperai.in/editors',
      },
    ],
  }

  const directorySchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Browse Verified Video Editors in India',
    description: 'Curated list of professional video editors in India with upfront pricing in INR.',
    url: 'https://www.uperai.in/editors',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: mapped.length,
      itemListElement: mapped.slice(0, 20).map((editor, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: editor.name,
        url: `https://www.uperai.in/editors/${editor.cardData.handle}`,
        description: editor.cardData.headline,
        image: editor.cardData.avatar_url,
      })),
    },
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} id="editors-breadcrumb-schema" />
      <JsonLd data={directorySchema} id="editors-directory-schema" />
      <DirectoryView initialEditors={mapped} isServerError={isServerError} />
    </>
  )
}
