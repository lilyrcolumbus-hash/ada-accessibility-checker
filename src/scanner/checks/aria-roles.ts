import { ScanIssue, generateId } from '../types'

const VALID_ARIA_ROLES = new Set([
  'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell',
  'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo',
  'definition', 'dialog', 'directory', 'document', 'feed', 'figure', 'form',
  'grid', 'gridcell', 'group', 'heading', 'img', 'link', 'list', 'listbox',
  'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem',
  'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 'note', 'option',
  'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row',
  'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
  'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
  'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree',
  'treegrid', 'treeitem'
])

const ARIA_ID_ATTRIBUTES = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns']

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

export function checkAriaRoles(doc: Document, url: string): ScanIssue[] {
  const issues: ScanIssue[] = []

  // Collect all IDs in the document for aria-* attribute validation
  const elementIds = new Set<string>()
  doc.querySelectorAll('[id]').forEach(el => {
    const id = el.getAttribute('id')
    if (id) elementIds.add(id)
  })

  // Check all elements with role attribute
  doc.querySelectorAll('[role]').forEach(el => {
    const role = el.getAttribute('role')
    if (role && !VALID_ARIA_ROLES.has(role)) {
      issues.push({
        id: generateId(),
        checkId: 'aria-roles-invalid',
        severity: 'serious',
        title: 'Invalid ARIA role',
        description: `The element has an invalid ARIA role: "${role}". Valid roles are defined in the ARIA specification.`,
        element: el.tagName.toLowerCase(),
        selector: getSelector(el),
        wcagCriteria: '4.1.2',
        wcagLevel: 'A',
        fixDescription: `Replace the invalid role "${role}" with a valid ARIA role from the specification.`,
        codeBefore: truncateHtml(el),
        codeAfter: `<${el.tagName.toLowerCase()} role="[valid-role]">...</${el.tagName.toLowerCase()}>`,
        estimatedFixMinutes: 5,
        category: 'ARIA'
      })
    }
  })

  // Check for aria-* attributes referencing non-existent IDs
  doc.querySelectorAll('[aria-labelledby], [aria-describedby], [aria-controls], [aria-owns]').forEach(el => {
    ARIA_ID_ATTRIBUTES.forEach(attrName => {
      const attrValue = el.getAttribute(attrName)
      if (attrValue) {
        // Handle space-separated ID lists
        const ids = attrValue.split(/\s+/).filter(id => id.length > 0)
        ids.forEach(id => {
          if (!elementIds.has(id)) {
            issues.push({
              id: generateId(),
              checkId: 'aria-refs-missing-id',
              severity: 'serious',
              title: `ARIA attribute references non-existent ID`,
              description: `The "${attrName}" attribute references ID "${id}", but no element with this ID exists in the document.`,
              element: el.tagName.toLowerCase(),
              selector: getSelector(el),
              wcagCriteria: '4.1.2',
              wcagLevel: 'A',
              fixDescription: `Ensure that the ID referenced in "${attrName}" matches an existing element's id attribute in the document.`,
              codeBefore: truncateHtml(el),
              codeAfter: `<${el.tagName.toLowerCase()} ${attrName}="[existing-id]">...</${el.tagName.toLowerCase()}>`,
              estimatedFixMinutes: 5,
              category: 'ARIA'
            })
          }
        })
      }
    })
  })

  return issues
}
