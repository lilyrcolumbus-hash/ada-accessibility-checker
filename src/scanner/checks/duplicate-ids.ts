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

export function checkDuplicateIds(doc: Document, url: string): ScanIssue[] {
  const issues: ScanIssue[] = []
  const idMap = new Map<string, Element[]>()

  // Collect all elements with id attributes
  const allElements = doc.querySelectorAll('[id]')
  allElements.forEach((el) => {
    const id = el.getAttribute('id')
    if (id && id.trim()) {
      if (!idMap.has(id)) {
        idMap.set(id, [])
      }
      idMap.get(id)!.push(el)
    }
  })

  // Find duplicate IDs and create issues
  idMap.forEach((elements, idValue) => {
    if (elements.length > 1) {
      // Create a single issue for each duplicate ID group
      const selectors = elements.map((el) => getSelector(el)).join(', ')
      const firstElement = elements[0]

      issues.push({
        id: crypto.randomUUID(),
        checkId: 'duplicate-ids',
        severity: 'serious',
        title: `Duplicate ID: "${idValue}"`,
        description: `The ID "${idValue}" is used ${elements.length} times on this page. IDs must be unique. Duplicate IDs can break functionality for screen readers, link anchors, form labels, and JavaScript selectors.`,
        element: firstElement.tagName,
        selector: selectors,
        wcagCriteria: '4.1.1',
        wcagLevel: 'A',
        fixDescription: `Make each ID unique by renaming the duplicate instances. For example, use "${idValue}-1", "${idValue}-2", etc. Update any associated labels or JavaScript that references these IDs.`,
        codeBefore: `<div id="${idValue}">...</div>\n<div id="${idValue}">...</div>`,
        codeAfter: `<div id="${idValue}-1">...</div>\n<div id="${idValue}-2">...</div>`,
        estimatedFixMinutes: 3,
        category: 'Document'
      })
    }
  })

  return issues
}
