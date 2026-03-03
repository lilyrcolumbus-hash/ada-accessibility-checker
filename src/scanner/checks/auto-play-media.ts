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

export function checkAutoPlayMedia(doc: Document, url: string): ScanIssue[] {
  const issues: ScanIssue[] = []

  // Check all video and audio elements
  const mediaElements = doc.querySelectorAll('video, audio')

  mediaElements.forEach(el => {
    const elementType = el.tagName.toLowerCase()
    const hasAutoplay = el.hasAttribute('autoplay')
    const hasControls = el.hasAttribute('controls')

    // Check for autoplay attribute
    if (hasAutoplay) {
      issues.push({
        id: crypto.randomUUID(),
        checkId: 'autoplay-media',
        severity: 'serious',
        title: `${elementType} element autoplays`,
        description: `The ${elementType} element has an autoplay attribute, which can be disorienting or startling for users. Media should only play when the user explicitly chooses to play it.`,
        element: elementType,
        selector: getSelector(el),
        wcagCriteria: '1.4.2',
        wcagLevel: 'A',
        fixDescription: `Remove the autoplay attribute and let users control playback.`,
        codeBefore: truncateHtml(el),
        codeAfter: `<${elementType} controls><source src="..." type="..."></source></${elementType}>`,
        estimatedFixMinutes: 2,
        category: 'Media'
      })
    }

    // Check for missing controls attribute
    if (!hasControls) {
      issues.push({
        id: crypto.randomUUID(),
        checkId: 'media-missing-controls',
        severity: 'serious',
        title: `${elementType} element lacks controls`,
        description: `The ${elementType} element does not have a controls attribute. Users need a way to control media playback, pause, and volume.`,
        element: elementType,
        selector: getSelector(el),
        wcagCriteria: '1.4.2',
        wcagLevel: 'A',
        fixDescription: `Add the controls attribute to allow users to play, pause, and adjust volume.`,
        codeBefore: truncateHtml(el),
        codeAfter: `<${elementType} controls><source src="..." type="..."></source></${elementType}>`,
        estimatedFixMinutes: 2,
        category: 'Media'
      })
    }
  })

  return issues
}
