import { MetadataRoute } from 'next'
import { getPublicEditors } from '@/lib/firebase/firestore'

export const revalidate = 3600 // Cache sitemap XML for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.uperai.in'

  // Static Core Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/editors`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sitemap`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/onboarding`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Dynamic Editor Portfolio Routes from Firestore
  try {
    const editors = await getPublicEditors(200)
    const dynamicRoutes: MetadataRoute.Sitemap = editors
      .filter((editor) => Boolean(editor.handle || editor.user_id || editor.id))
      .map((editor) => {
        const identifier = editor.handle || editor.user_id || editor.id
        return {
          url: `${baseUrl}/editors/${identifier}`,
          lastModified: editor.updatedAt ? new Date(editor.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        }
      })

    return [...staticRoutes, ...dynamicRoutes]
  } catch (err) {
    console.error('[Sitemap] Failed to generate dynamic editor routes:', err)
    return staticRoutes
  }
}
