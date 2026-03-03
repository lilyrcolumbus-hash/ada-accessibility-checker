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

function hasAccessibleLabel(el: Element): boolean {
  // Check for aria-label
  if (el.getAttribute('aria-label')?.trim()) {
    return true
  }

  // Check for aria-labelledby
  if (el.getAttribute('aria-labelledby')?.trim()) {
    return true
  }

  // Check for title attribute
  if (el.getAttribute('title')?.trim()) {
    return true
  }

  // Check for text content
  if (el.textContent?.trim()) {
    return true
  }

  // Check for img with alt inside
  const imgs = el.querySelectorAll('img')
  for (const img of imgs) {
    if (img.getAttribute('alt')?.trim()) {
      return true
    }
  }

  return false
}

export function checkEmptyInteractive(doc: Document, url: string): ScanIssue[] {
  const issues: ScanIssue[] = []

  // Check buttons
  const buttons = doc.querySelectorAll('button')
  buttons.forEach((button) => {
    if (!hasAccessibleLabel(button)) {
      issues.push({
        id: crypto.randomUUID(),
        checkId: 'empty-button',
        severity: 'critical',
        title: 'Button has no accessible label',
        description:
          'The button element has no text content, aria-label, aria-labelledby, title, or images with alt text. Users cannot understand the purpose of this button.',
        element: button.tagName,
        selector: getSelector(button),
        wcagCriteria: '4.1.2',
        wcagLevel: 'A',
        fixDescription:
          'Add descriptive text content to the button, or provide an aria-label, title attribute, or an img with alt text inside.',
        codeBefore: truncateHtml(button),
        codeAfter: '<button>Submit Form</button>',
        estimatedFixMinutes: 2,
        category: 'Interactive Elements'
      })
    }
  })

  // Check links
  const links = doc.querySelectorAll('a')
  links.forEach((link) => {
    if (!hasAccessibleLabel(link)) {
      issues.push({
        id: crypto.randomUUID(),
        checkId: 'empty-link',
        severity: 'serious',
        title: 'Link has no accessible label',
        description:
          'The link element has no text content, aria-label, aria-labelledby, title, or images with alt text. Users cannot understand the destination or purpose of this link.',
        element: link.tagName,
        selector: getSelector(link),
        wcagCriteria: '4.1.2',
        wcagLevel: 'A',
        fixDescription:
          'Add descriptive text content to the link, or provide an aria-label, title attribute, or an img with alt text inside.',
        codeBefore: truncateHtml(link),
        codeAfter: '<a href="/page">Learn More</a>',
        estimatedFixMinutes: 2,
        category: 'Interactive Elements'
      })
    }
  })

  return issues
}
