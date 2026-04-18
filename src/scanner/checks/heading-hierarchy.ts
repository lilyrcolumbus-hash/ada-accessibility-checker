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

export function checkHeadingHierarchy(doc: Document, url: string): ScanIssue[] {
  const issues: ScanIssue[] = []

  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const headingLevels: number[] = []
  const headingElements: Element[] = []

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.substring(1))
    headingLevels.push(level)
    headingElements.push(heading)
  })

  // Check if there's exactly one h1
  const h1Count = headingLevels.filter((level) => level === 1).length

  if (h1Count === 0) {
    issues.push({
      id: generateId(),
      checkId: 'no-h1',
      severity: 'serious',
      title: 'Page missing h1 heading',
      description: `Page does not contain an h1 heading. Every page must have exactly one h1 to indicate the main topic.`,
      element: '<page root>',
      selector: 'body',
      wcagCriteria: '1.3.1',
      wcagLevel: 'A',
      fixDescription: 'Add an h1 heading to the main content area that describes the page topic.',
      codeBefore: '<h2>Page Title</h2>',
      codeAfter: '<h1>Page Title</h1>',
      estimatedFixMinutes: 5,
      category: 'Structure',
    })
  } else if (h1Count > 1) {
    issues.push({
      id: generateId(),
      checkId: 'multiple-h1',
      severity: 'moderate',
      title: 'Page contains multiple h1 headings',
      description: `Page contains ${h1Count} h1 headings. Best practice is to have exactly one h1 per page.`,
      element: '<page root>',
      selector: 'body',
      wcagCriteria: '1.3.1',
      wcagLevel: 'A',
      fixDescription: 'Ensure only one h1 heading is used per page. Change other h1 elements to h2 or appropriate lower levels.',
      codeBefore: '<h1>Main Title</h1>\n<h1>Secondary Title</h1>',
      codeAfter: '<h1>Main Title</h1>\n<h2>Secondary Title</h2>',
      estimatedFixMinutes: 5,
      category: 'Structure',
    })
  }

  // Check for skipped heading levels
  for (let i = 1; i < headingLevels.length; i++) {
    const prevLevel = headingLevels[i - 1]
    const currentLevel = headingLevels[i]

    // Only flag if we skip more than one level (e.g., h1 to h3)
    if (currentLevel - prevLevel > 1) {
      const currentHeading = headingElements[i]
      const prevTag = `h${prevLevel}`
      const currentTag = `h${currentLevel}`
      const expectedTag = `h${prevLevel + 1}`

      issues.push({
        id: generateId(),
        checkId: 'heading-level-skip',
        severity: 'serious',
        title: `Heading level skipped from ${prevTag} to ${currentTag}`,
        description: `Heading hierarchy skips a level. Found ${currentTag} after ${prevTag}. Heading levels should increase by one at a time.`,
        element: truncateHtml(currentHeading),
        selector: getSelector(currentHeading),
        wcagCriteria: '1.3.1',
        wcagLevel: 'A',
        fixDescription: `Change this ${currentTag} to ${expectedTag} to maintain proper heading hierarchy.`,
        codeBefore: `<${prevTag}>Section</${prevTag}>\n<${currentTag}>Subsection</${currentTag}>`,
        codeAfter: `<${prevTag}>Section</${prevTag}>\n<${expectedTag}>Subsection</${expectedTag}>`,
        estimatedFixMinutes: 5,
        category: 'Structure',
      })
    }
  }

  return issues
}
