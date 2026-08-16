import React from 'react'
import DirectoryView, { DirectoryEditor } from '@/components/DirectoryView'
import { EditorCardData } from '@/components/EditorCard'
import { getPublicEditors } from '@/lib/firebase/firestore'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

      const thumbnailUrl =
        doc.thumbnail_url1 ||
        doc.thumbnail_url2 ||
        doc.preview_img ||
        (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null)

      const cardData: EditorCardData = {
        id: editorId,
        handle: doc.handle || editorName.toLowerCase().replace(/[^a-z0-9]/g, '') || editorId,
        name: editorName,
        avatar_url: doc.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editorName)}`,
        headline: doc.specialty_tag || doc.headline || 'Video Editor',
        min_rate: Number(doc.base_rate || doc.min_rate || 1500),
        currency: doc.currency || 'INR',
        thumbnail_url: thumbnailUrl,
        format_tag: formatTag,
        instagram_handle: doc.instagram_handle || doc.instagram || null,
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

  return <DirectoryView initialEditors={mapped} isServerError={isServerError} />
}
