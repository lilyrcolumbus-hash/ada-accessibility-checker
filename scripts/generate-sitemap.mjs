import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'https://ada-accessibility-checker.pages.dev'
const TODAY = new Date().toISOString().split('T')[0]

const industries = [
  'ecommerce', 'retail', 'restaurant', 'food-delivery', 'hotel', 'travel',
  'healthcare', 'dental', 'pharmacy', 'finance', 'banking', 'insurance',
  'real-estate', 'automotive', 'fitness', 'salon-spa', 'education',
  'entertainment', 'media', 'government', 'nonprofit', 'legal', 'accounting',
  'construction', 'manufacturing', 'technology', 'consulting', 'agriculture',
]

const states = [
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
  'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
  'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
  'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
  'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
  'new-hampshire', 'new-jersey', 'new-mexico', 'new-york',
  'north-carolina', 'north-dakota', 'ohio', 'oklahoma', 'oregon',
  'pennsylvania', 'rhode-island', 'south-carolina', 'south-dakota',
  'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
  'west-virginia', 'wisconsin', 'wyoming',
]

function urlEntry(loc, changefreq, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

const entries = []

// Main pages
entries.push(urlEntry(`${BASE_URL}/`, 'weekly', '1.0'))
entries.push(urlEntry(`${BASE_URL}/scan`, 'weekly', '0.9'))
entries.push(urlEntry(`${BASE_URL}/privacy`, 'yearly', '0.3'))
entries.push(urlEntry(`${BASE_URL}/terms`, 'yearly', '0.3'))

// Industry pages
for (const industry of industries) {
  entries.push(urlEntry(`${BASE_URL}/industry/${industry}`, 'monthly', '0.8'))
}

// State pages
for (const state of states) {
  entries.push(urlEntry(`${BASE_URL}/state/${state}`, 'monthly', '0.8'))
}

// Industry x State combo pages
for (const industry of industries) {
  for (const state of states) {
    entries.push(urlEntry(`${BASE_URL}/industry/${industry}/${state}`, 'monthly', '0.7'))
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main pages -->
${entries.slice(0, 4).join('\n')}

  <!-- Industry pages (${industries.length}) -->
${entries.slice(4, 4 + industries.length).join('\n')}

  <!-- State pages (${states.length}) -->
${entries.slice(4 + industries.length, 4 + industries.length + states.length).join('\n')}

  <!-- Industry x State combo pages (${industries.length} x ${states.length} = ${industries.length * states.length}) -->
${entries.slice(4 + industries.length + states.length).join('\n')}
</urlset>
`

const outputPath = resolve(__dirname, '..', 'public', 'sitemap.xml')
writeFileSync(outputPath, xml)
console.log(`Sitemap generated: ${entries.length} URLs written to ${outputPath}`)
console.log(`  - Main pages: 4`)
console.log(`  - Industry pages: ${industries.length}`)
console.log(`  - State pages: ${states.length}`)
console.log(`  - Combo pages: ${industries.length * states.length}`)
