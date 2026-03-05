import { ScanIssue } from '../types'

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

function extractDescriptiveAlt(src: string): string {
  // Try to get a readable name from the URL path
  const parts = src.split('/').filter(p => p && !p.includes('?'))
  // Walk backwards looking for a human-readable segment
  for (let i = parts.length - 1; i >= 0; i--) {
    const segment = parts[i].split('.')[0].replace(/[-_]/g, ' ').trim()
    // Skip hashes, UUIDs, and purely numeric/hex strings
    if (segment.length > 3 && !/^[a-f0-9\s]+$/i.test(segment) && /[a-z]/i.test(segment)) {
      // Capitalize first letter
      return segment.charAt(0).toUpperCase() + segment.slice(1)
    }
  }
  return '[Describe this image]'
}

export function checkAltText(doc: Document, url: string): ScanIssue[] {
  const issues: ScanIssue[] = []

  // Check <img> elements
  const images = doc.querySelectorAll('img')
  images.forEach((img) => {
    const alt = img.getAttribute('alt')
    // alt="" is valid for decorative images per WCAG — only flag missing alt
    if (alt === null) {
      const src = img.getAttribute('src') || 'unknown'
      const descriptiveAlt = extractDescriptiveAlt(src)

      issues.push({
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
