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

export function checkAutoPlayMedia(doc: Document, _url: string): ScanIssue[] {
  const issues: ScanIssue[] = []

  // Check all video and audio elements
  const mediaElements = doc.querySelectorAll('video, audio')

  mediaElements.forEach(el => {
    const elementType = el.tagName.toLowerCase()
    const hasAutoplay = el.hasAttribute('autoplay')
    const hasControls = el.hasAttribute('controls')

    if (hasAutoplay && !hasControls) {
      // Autoplay without controls — most severe: user can't stop it
      issues.push({
        id: generateId(),
        checkId: 'autoplay-media-no-controls',
        severity: 'serious',
        title: `${elementType} autoplays without controls`,
        description: `The ${elementType} element autoplays and has no controls. Users cannot pause, stop, or adjust volume. This violates WCAG 1.4.2 (Audio Control).`,
        element: elementType,
        selector: getSelector(el),
        wcagCriteria: '1.4.2',
        wcagLevel: 'A',
        fixDescription: `Remove the autoplay attribute and add the controls attribute so users can control playback.`,
        codeBefore: truncateHtml(el),
        codeAfter: `<${elementType} controls><source src="..." type="..."></source></${elementType}>`,
        estimatedFixMinutes: 2,
        category: 'Media'
      })
    } else if (hasAutoplay) {
      // Autoplay with controls — less severe
      issues.push({
        id: generateId(),
        checkId: 'autoplay-media',
        severity: 'moderate',
        title: `${elementType} element autoplays`,
        description: `The ${elementType} element has an autoplay attribute, which can be disorienting for users. Controls are present, but media should require user interaction to start.`,
        element: elementType,
        selector: getSelector(el),
        wcagCriteria: '1.4.2',
        wcagLevel: 'A',
        fixDescription: `Remove the autoplay attribute and let users choose when to play.`,
        codeBefore: truncateHtml(el),
        codeAfter: `<${elementType} controls><source src="..." type="..."></source></${elementType}>`,
        estimatedFixMinutes: 2,
        category: 'Media'
      })
    }
  })

  return issues
}
