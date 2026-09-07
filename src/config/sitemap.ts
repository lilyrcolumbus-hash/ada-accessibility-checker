import { INDUSTRY_RISK, TOP_LAWSUIT_STATES } from '@/config/constants'
import { blogPosts } from '@/config/blog-posts'

const BASE_URL = 'https://adalawsuitcheck.com'

function stateNameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

export interface SitemapEntry {
  url: string
  priority: number
  changefreq: 'daily' | 'weekly' | 'monthly'
}

export function getAllSitemapUrls(): SitemapEntry[] {
  const urls: SitemapEntry[] = []

  // Static pages
  urls.push({ url: `${BASE_URL}/`, priority: 1.0, changefreq: 'weekly' })
  urls.push({ url: `${BASE_URL}/scan`, priority: 0.9, changefreq: 'weekly' })
  urls.push({ url: `${BASE_URL}/privacy`, priority: 0.3, changefreq: 'monthly' })
  urls.push({ url: `${BASE_URL}/terms`, priority: 0.3, changefreq: 'monthly' })
  urls.push({ url: `${BASE_URL}/for-agencies`, priority: 0.8, changefreq: 'monthly' })

  // Blog pages
  urls.push({ url: `${BASE_URL}/blog`, priority: 0.7, changefreq: 'weekly' })
  for (const post of blogPosts) {
    urls.push({ url: `${BASE_URL}/blog/${post.slug}`, priority: 0.6, changefreq: 'monthly' })
  }

  // Industry pages
  const industrySlugs = Object.keys(INDUSTRY_RISK).filter(s => s !== 'other')
  for (const slug of industrySlugs) {
    const data = INDUSTRY_RISK[slug]
    const priority = data.riskLevel === 'extreme' ? 0.9
      : data.riskLevel === 'high' ? 0.8
      : data.riskLevel === 'medium' ? 0.7
      : 0.6
    urls.push({ url: `${BASE_URL}/industry/${slug}`, priority, changefreq: 'monthly' })
  }

  // State pages
  for (const stateName of Object.keys(TOP_LAWSUIT_STATES)) {
    const data = TOP_LAWSUIT_STATES[stateName]
    const slug = stateNameToSlug(stateName)
    const priority = data.riskLevel === 'extreme' ? 0.9
      : data.riskLevel === 'high' ? 0.8
      : data.riskLevel === 'medium' ? 0.7
      : 0.6
    urls.push({ url: `${BASE_URL}/state/${slug}`, priority, changefreq: 'monthly' })
  }

  return urls
}

export function generateSitemapXML(): string {
  const entries = getAllSitemapUrls()
  const today = new Date().toISOString().split('T')[0]

  const xmlEntries = entries.map(entry =>
    `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`
}

// Export all industry slugs and state slugs for linking
export const ALL_INDUSTRY_SLUGS = Object.keys(INDUSTRY_RISK).filter(s => s !== 'other')
export const ALL_STATE_SLUGS = Object.keys(TOP_LAWSUIT_STATES).map(stateNameToSlug)

export function getTopIndustries(count: number = 5) {
  return Object.entries(INDUSTRY_RISK)
    .filter(([slug]) => slug !== 'other')
    .sort(([, a], [, b]) => b.lawsuitCount - a.lawsuitCount)
    .slice(0, count)
    .map(([slug, data]) => ({ slug, ...data }))
}

export function getTopStates(count: number = 5) {
  return Object.entries(TOP_LAWSUIT_STATES)
    .sort(([, a], [, b]) => b.lawsuits - a.lawsuits)
    .slice(0, count)
    .map(([name, data]) => ({ name, slug: stateNameToSlug(name), ...data }))
}
