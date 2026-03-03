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

function hasLabel(input: Element): boolean {
  const id = input.getAttribute('id')
  const ariaLabel = input.getAttribute('aria-label')
  const ariaLabelledBy = input.getAttribute('aria-labelledby')
  const title = input.getAttribute('title')

  // Check for aria-label or aria-labelledby
  if (ariaLabel || ariaLabelledBy) {
    return true
  }

  // Check for title attribute
  if (title) {
    return true
  }

  // Check for wrapping label
  let parent = input.parentElement
  while (parent) {
    if (parent.tagName.toLowerCase() === 'label') {
      return true
    }
    parent = parent.parentElement
  }

  // Check for label with for attribute
  if (id) {
    const label = input.ownerDocument.querySelector(`label[for="${id}"]`)
    if (label) {
      return true
    }
  }

  return false
}

export function checkFormLabels(doc: Document, url: string): ScanIssue[] {
  const issues: ScanIssue[] = []

  // Get all form inputs, selects, and textareas
  const formInputs = doc.querySelectorAll('input, select, textarea')

  formInputs.forEach((input) => {
    const type = input.getAttribute('type')?.toLowerCase() || ''

    // Skip hidden inputs and buttons (radio and checkbox DO need labels)
    if (type === 'hidden' || type === 'submit' || type === 'reset' || type === 'button' || type === 'image' || type === 'file') {
      return
    }

    // Skip if element has no id and check for other label associations
    if (!hasLabel(input)) {
      const inputId = input.getAttribute('id') || 'input-' + crypto.randomUUID().substring(0, 8)
      const inputName = input.getAttribute('name') || 'field'
      const tagName = input.tagName.toLowerCase()

      issues.push({
        id: crypto.randomUUID(),
        checkId: 'form-label-missing',
        severity: 'critical',
        title: 'Form input missing associated label',
        description: `Form ${tagName} element is not associated with a label. All form inputs must have an associated label using <label for="id">, wrapping <label>, aria-label, aria-labelledby, or title attribute.`,
        element: truncateHtml(input),
        selector: getSelector(input),
        wcagCriteria: '1.3.1 / 4.1.2',
        wcagLevel: 'A',
        fixDescription: `Associate this form input with a label. Either wrap it in a <label> element, use <label for="${inputId}">, or add an aria-label attribute.`,
        codeBefore: input.outerHTML,
        codeAfter: `<label for="${inputId}">${inputName}</label>\n<${tagName} id="${inputId}" name="${inputName}" />`,
        estimatedFixMinutes: 3,
        category: 'Forms',
      })
    }
  })

  return issues
}
