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

const nonDescriptivePatterns = ['click here', 'read more', 'learn more', 'here', 'more', 'link', 'this']

function isNonDescriptive(text: string): boolean {
  const normalized = text.trim().toLowerCase()
  return nonDescriptivePatterns.some((pattern) => normalized === pattern)
}

function getLinkText(link: Element): string {
  let text = link.textContent || ''
  return text.trim()
}

function hasAriaLabel(link: Element): boolean {
  return !!(link.getAttribute('aria-label')?.trim()) || !!link.getAttribute('aria-labelledby')
}

export function checkLinkText(doc: Document, url: string): ScanIssue[] {
  const issues: ScanIssue[] = []

  const links = doc.querySelectorAll('a')

  links.forEach((link) => {
    const href = link.getAttribute('href')

    // Skip links without href or anchor-only links
    if (!href || href === '#' || href === '') {
      return
    }

    const linkText = getLinkText(link)
    const hasLabel = hasAriaLabel(link)

    // Check for empty link text
    if (linkText === '' && !hasLabel) {
      issues.push({
        id: generateId(),
        checkId: 'empty-link-text',
        severity: 'serious',
        title: 'Link has no descriptive text',
        description: `Link is empty or contains no readable text and has no aria-label. Links must have descriptive text content or an aria-label.`,
        element: truncateHtml(link),
        selector: getSelector(link),
        wcagCriteria: '2.4.4',
        wcagLevel: 'A',
        fixDescription: 'Add descriptive text content to the link that explains where it goes or what it does.',
        codeBefore: `<a href="${href}"></a>`,
        codeAfter: `<a href="${href}">[Describe where this link goes]</a>`,
        estimatedFixMinutes: 3,
        category: 'Links',
      })
    } else if (isNonDescriptive(linkText) && !hasLabel) {
      // Check for non-descriptive link text
      issues.push({
        id: generateId(),
        checkId: 'non-descriptive-link-text',
        severity: 'moderate',
        title: 'Link text is not descriptive',
        description: `Link text "${linkText}" is not descriptive. Link text like "click here" or "read more" doesn't convey the purpose of the link without context.`,
        element: truncateHtml(link),
        selector: getSelector(link),
        wcagCriteria: '2.4.4',
        wcagLevel: 'A',
        fixDescription: `Change link text from "${linkText}" to something that describes the link destination or purpose.`,
        codeBefore: `<a href="${href}">${linkText}</a>`,
        codeAfter: `<a href="${href}">[Describe where this link goes]</a>`,
        estimatedFixMinutes: 3,
        category: 'Links',
      })
    }
  })

  return issues
}
