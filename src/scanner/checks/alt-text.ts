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
  const filename = src.split('/').pop() || 'image'
  const nameWithoutExt = filename.split('.')[0]
  return nameWithoutExt.replace(/[-_]/g, ' ')
}

export function checkAltText(doc: Document, url: string): ScanIssue[] {
  const issues: ScanIssue[] = []

  // Check <img> elements
  const images = doc.querySelectorAll('img')
  images.forEach((img) => {
    const alt = img.getAttribute('alt')
    if (alt === null || alt.trim() === '') {
      const src = img.getAttribute('src') || 'unknown'
      const descriptiveAlt = extractDescriptiveAlt(src)

      issues.push({
        id: crypto.randomUUID(),
        checkId: 'alt-text-missing',
        severity: 'critical',
        title: 'Missing or empty alt text',
        description: `Image element is missing alt attribute or has empty alt text. All images must have descriptive alt text for screen readers.`,
        element: truncateHtml(img),
        selector: getSelector(img),
        wcagCriteria: '1.1.1',
        wcagLevel: 'A',
        fixDescription: 'Add a descriptive alt attribute that conveys the meaning and purpose of the image.',
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
    if (alt === null || alt.trim() === '') {
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
    if (alt === null || alt.trim() === '') {
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
