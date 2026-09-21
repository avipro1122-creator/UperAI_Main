import React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import EditorProfileClient from '@/components/EditorProfileClient'
import { getEditorByHandleOrId, getEditorPortfolioItems } from '@/lib/firebase/firestore'

export const revalidate = 30

interface EditorPageProps {
  params: { handle?: string; id?: string }
}

export async function generateMetadata(
  { params }: EditorPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const target = params.handle || params.id || ''
  const editor = await getEditorByHandleOrId(target)

  if (!editor) {
    return {
      title: 'Editor Profile Not Found',
      description: 'The requested video editor profile could not be found on UperAI.',
    }
  }

  const name = editor.full_name || editor.name || 'Video Editor'
  const headline = editor.headline || editor.specialty_tag || 'Freelance Video Editor'
  const rate = editor.base_rate || editor.min_rate || editor.rate_short || editor.rate_long || 1500
  const title = `${name} (${headline}) — Hire Video Editor`
  const description = `Hire ${name} on UperAI starting at ₹${Number(rate).toLocaleString()} / video. Audition real showreels, turnaround in ${editor.turnaround_time || '48 Hours'}, and connect directly on WhatsApp.`
  const canonicalUrl = `https://www.uperai.in/editors/${editor.handle || target}`
  const avatarUrl = editor.avatar_url || editor.preview_img || 'https://www.uperai.in/icon.svg'

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | UperAI`,
      description,
      url: canonicalUrl,
      type: 'profile',
      images: [
        {
          url: avatarUrl,
          width: 800,
          height: 800,
          alt: `${name} - Video Editor Portfolio`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | UperAI`,
      description,
      images: [avatarUrl],
    },
  }
}

export default async function PublicEditorProfilePage({ params }: EditorPageProps) {
  const targetId = params.handle || params.id || ''
  if (!targetId) {
    notFound()
  }

  const editor = await getEditorByHandleOrId(targetId)

  if (!editor) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center space-y-4">
        <p className="text-zinc-400 text-sm font-bold">Editor profile not found.</p>
        <Link className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold text-lime-400 rounded-xl" href="/editors">
          ← Back to All Editors
        </Link>
      </div>
    )
  }

  const portfolioItems = await getEditorPortfolioItems(editor.user_id || editor.id)

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
      {
        '@type': 'ListItem',
        position: 3,
        name: editor.full_name || 'Editor Profile',
        item: `https://www.uperai.in/editors/${editor.handle || targetId}`,
      },
    ],
  }

  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${editor.full_name} - Video Editor Portfolio`,
    url: `https://www.uperai.in/editors/${editor.handle || targetId}`,
    mainEntity: {
      '@type': 'Person',
      name: editor.full_name,
      jobTitle: editor.headline || editor.specialty_tag || 'Video Editor',
      description: editor.bio || `${editor.full_name} is a verified Indian video editor specializing in ${editor.specialty_tag || 'high-retention video editing'}.`,
      image: editor.avatar_url,
      sameAs: [
        editor.instagram_handle ? `https://instagram.com/${editor.instagram_handle.replace(/^@/, '')}` : null,
        editor.youtube_url || editor.youtube_url1,
      ].filter(Boolean),
      knowsAbout: editor.software || ['Adobe Premiere Pro', 'After Effects', 'Video Editing'],
      offers: {
        '@type': 'Offer',
        price: editor.base_rate || editor.min_rate || 1500,
        priceCurrency: editor.currency || 'INR',
        availability: editor.open_to_work !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        description: `Video editing services starting from ₹${Number(editor.base_rate || 1500).toLocaleString()}`,
      },
    },
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} id="editor-breadcrumb-schema" />
      <JsonLd data={profileSchema} id="editor-profile-schema" />
      <EditorProfileClient initialEditor={editor} initialPortfolioItems={portfolioItems} />
    </>
  )
}
