import { NextResponse } from 'next/server'
import { getPublicEditors } from '@/lib/firebase/firestore'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1 hour

interface SitemapEntry {
  loc: string
  priority: string
  changefreq: string
  lastmod?: string
}

export async function GET() {
  const baseUrl = 'https://www.uperai.in'

  const staticPages: SitemapEntry[] = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily', lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/editors`, priority: '0.9', changefreq: 'daily', lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/about`, priority: '0.7', changefreq: 'monthly', lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/sitemap`, priority: '0.6', changefreq: 'weekly', lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/terms`, priority: '0.4', changefreq: 'yearly', lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/privacy`, priority: '0.4', changefreq: 'yearly', lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/onboarding`, priority: '0.6', changefreq: 'monthly', lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/login`, priority: '0.5', changefreq: 'monthly', lastmod: new Date().toISOString() },
  ]

  let dynamicPages: SitemapEntry[] = []

  try {
    const editors = await getPublicEditors(200)
    dynamicPages = editors
      .filter((e) => Boolean(e.handle || e.user_id || e.id))
      .map((e) => ({
        loc: `${baseUrl}/editors/${e.handle || e.user_id || e.id}`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: e.updatedAt ? new Date(e.updatedAt).toISOString() : new Date().toISOString(),
      }))
  } catch (err) {
    console.error('[Sitemap XML] Error fetching dynamic editors:', err)
  }

  const allPages = [...staticPages, ...dynamicPages]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map((page) => {
    return `  <url>
    <loc>${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>${
      page.lastmod
        ? `
    <lastmod>${page.lastmod}</lastmod>`
        : ''
    }
  </url>`
  })
  .join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
