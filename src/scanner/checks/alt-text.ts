import { ScanIssue, generateId } from '../types'

function truncateHtml(el: Element): string {
  const html = el.outerHTML
  return html.length > 200 ? html.substring(0, 200) + '...' : html
}

function getSelector(el: Element): string {
  if (el.id) return `#${el.id}`
  const tag = el.tagName.toLowerCase()
  const classes = Array.from(el.classList).slice(0, 2).join('.')
  if (classes) return `${tag}.${classes}`
  return tag
}

function extractDescriptiveAlt(_src: string): string {
  // Always use a bracket placeholder so users know they MUST customize it.
  // Auto-extracted text from URLs (like "Preview images", "Banner") is misleading
  // because it doesn't describe what the image actually shows.
  return '[Describe this image]'
}

// Tracking pixels and analytics images that should be ignored (they're decorative/invisible)
const TRACKING_PATTERNS = [
  /facebook\.com\/tr/i,
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
  /doubleclick\.net/i,
  /pixel\./i,
  /tracking\./i,
  /analytics\./i,
  /beacon\./i,
  /\.gif\?/i,           // Most tracking pixels are 1x1 GIFs with query params
  /pagead/i,
  /adservice/i,
  /hotjar\.com/i,
  /clarity\.ms/i,
  /hubspot\.com.*\/tracking/i,
  /bat\.bing\.com/i,
  /linkedin\.com\/px/i,
  /snap\.licdn\.com/i,
  /ads\.linkedin/i,
  /t\.co\/i/i,
]

function isTrackingPixel(img: Element): boolean {
  const src = img.getAttribute('src') || ''
  if (TRACKING_PATTERNS.some(p => p.test(src))) return true
  // Check for 1x1 pixel dimensions
  const w = img.getAttribute('width')
  const h = img.getAttribute('height')
  if ((w === '1' || w === '0') && (h === '1' || h === '0')) return true
  return false
}

export function checkAltText(doc: Document, url: string): ScanIssue[] {
  const issues: ScanIssue[] = []

  // Check <img> elements
  const images = doc.querySelectorAll('img')
  images.forEach((img) => {
    const alt = img.getAttribute('alt')
    // alt="" is valid for decorative images per WCAG — only flag missing alt
    // Skip tracking pixels — they should use alt="" but flagging them is noise
    if (alt === null && !isTrackingPixel(img)) {
      const src = img.getAttribute('src') || 'unknown'
      const descriptiveAlt = extractDescriptiveAlt(src)

      issues.push({
        id: generateId(),
        checkId: 'alt-text-missing',
        severity: 'critical',
        title: 'Missing alt text on image',
        description: `Image element is missing the alt attribute. All non-decorative images must have descriptive alt text for screen readers. Use alt="" only for decorative images.`,
        element: truncateHtml(img),
        selector: getSelector(img),
        wcagCriteria: '1.1.1',
        wcagLevel: 'A',
        fixDescription: 'Add a descriptive alt attribute that conveys the meaning and purpose of the image. Replace [Describe this image] with a real description of what the image shows (e.g., "Team photo at company retreat" or "Red leather handbag product shot").',
        codeBefore: img.outerHTML,
        codeAfter: `<img src="${src}" alt="${descriptiveAlt}" />`,
        estimatedFixMinutes: 2,
        category: 'Images',
      })
    }
  })

  // Check <input type="image"> elements
  const imageInputs = doc.querySelectorAll('input[type="image"]')
  imageInputs.forEach((input) => {
    const alt = input.getAttribute('alt')
    if (alt === null || alt?.trim() === '') {
      const src = input.getAttribute('src') || 'unknown'
      const descriptiveAlt = extractDescriptiveAlt(src)

      issues.push({
        id: generateId(),
        checkId: 'alt-text-missing-input-image',
        severity: 'critical',
        title: 'Missing alt text on image input',
        description: `Input element with type="image" is missing alt attribute. Image buttons must have alt text.`,
        element: truncateHtml(input),
        selector: getSelector(input),
        wcagCriteria: '1.1.1',
        wcagLevel: 'A',
        fixDescription: 'Add a descriptive alt attribute to the image input button.',
        codeBefore: input.outerHTML,
        codeAfter: `<input type="image" src="${src}" alt="${descriptiveAlt}" />`,
        estimatedFixMinutes: 2,
        category: 'Images',
      })
    }
  })

  // Check <area> elements
  const areas = doc.querySelectorAll('area')
  areas.forEach((area) => {
    const alt = area.getAttribute('alt')
    if (alt === null || alt?.trim() === '') {
      issues.push({
        id: generateId(),
        checkId: 'alt-text-missing-area',
        severity: 'critical',
        title: 'Missing alt text on image map area',
        description: `Area element in image map is missing alt attribute. All clickable areas must have descriptive alt text.`,
        element: truncateHtml(area),
        selector: getSelector(area),
        wcagCriteria: '1.1.1',
        wcagLevel: 'A',
        fixDescription: 'Add a descriptive alt attribute to the area element.',
        codeBefore: area.outerHTML,
        codeAfter: `<area alt="descriptive text" ... />`,
        estimatedFixMinutes: 2,
        category: 'Images',
      })
    }
  })

  return issues
}
