import { createAdminClient } from '@/lib/appwrite/server'
import { APPWRITE_CONFIG } from '@/lib/appwrite/config'
import { Query } from 'node-appwrite'

export async function getEditors() {
  try {
    const admin = await createAdminClient()
    const profilesRes = await admin.databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.editor_profiles,
      [Query.equal('is_hidden', false)]
    )

    const profiles = profilesRes.documents || []
    const editorIds = profiles.map((p: any) => p.user_id || p.$id)

    let items: any[] = []
    if (editorIds.length > 0) {
      const itemsRes = await admin.databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.portfolio_items,
        [Query.equal('is_available', true)]
      )
      items = itemsRes.documents || []
    }

    const itemsByEditor = new Map<string, any[]>()
    for (const item of items) {
      const key = item.editor_id
      const list = itemsByEditor.get(key) ?? []
      list.push(item)
      itemsByEditor.set(key, list)
    }

    return profiles.map((p: any) => {
      const editorId = p.user_id || p.$id
      const editorItems = itemsByEditor.get(editorId) ?? []

      return {
        id: editorId,
        user_id: editorId,
        full_name: p.full_name || 'Editor',
        name: p.full_name || 'Editor',
        avatar_url: p.avatar_url,
        bio: p.bio,
        headline: p.headline,
        specialty_tag: p.specialty_tag || p.headline,
        min_rate: p.min_rate ?? p.base_rate ?? p.rate_short ?? p.rate_long,
        base_rate: p.base_rate ?? p.min_rate ?? p.rate_short ?? p.rate_long,
        turnaround_time: p.turnaround_time || (p.turnaround_days ? `${p.turnaround_days} Days` : '48 Hours'),
        portfolio_items: editorItems.map((item: any) => ({
          id: item.$id,
          title: item.title,
          video_url: item.youtube_url || item.video_url,
          thumbnail_url: item.thumbnail_url,
          format: item.is_short ? 'Shorts' : 'Long-form',
          is_hero_preview: item.position === 0,
        })),
      }
    })
  } catch (err) {
    console.error('Error fetching editors from Appwrite:', err)
    return []
  }
}
