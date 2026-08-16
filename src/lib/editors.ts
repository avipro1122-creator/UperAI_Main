import { getPublicEditors, getEditorPortfolioItems } from '@/lib/firebase/firestore'

export async function getEditors() {
  try {
    const profiles = await getPublicEditors(30)

    const editorsWithPortfolio = await Promise.all(
      profiles.map(async (p: any) => {
        const editorId = p.user_id || p.id
        const items = await getEditorPortfolioItems(editorId, 10)

        return {
          id: editorId,
          user_id: editorId,
          full_name: p.full_name || p.name || 'Editor',
          name: p.full_name || p.name || 'Editor',
          handle: p.handle || '',
          avatar_url: p.avatar_url,
          bio: p.bio,
          headline: p.headline,
          specialty_tag: p.specialty_tag || p.headline,
          min_rate: p.min_rate ?? p.base_rate ?? p.rate_short ?? p.rate_long,
          base_rate: p.base_rate ?? p.min_rate ?? p.rate_short ?? p.rate_long,
          turnaround_time: p.turnaround_time || (p.turnaround_days ? `${p.turnaround_days} Days` : '48 Hours'),
          portfolio_items: items.map((item: any) => ({
            id: item.id,
            title: item.title,
            video_url: item.youtube_url || item.video_url,
            thumbnail_url: item.thumbnail_url,
            format: item.is_short ? 'Shorts' : 'Long-form',
            is_hero_preview: item.position === 0,
          })),
        }
      })
    )

    return editorsWithPortfolio
  } catch (err) {
    console.error('Error fetching editors from Firestore:', err)
    return []
  }
}
