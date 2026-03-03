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

export function checkTableHeaders(doc: Document, url: string): ScanIssue[] {
  const issues: ScanIssue[] = []

  const tables = doc.querySelectorAll('table')
  tables.forEach((table) => {
    const tableSelector = getSelector(table)

    // Check for th elements
    const thElements = table.querySelectorAll('th')
    if (thElements.length === 0) {
      issues.push({
        id: crypto.randomUUID(),
        checkId: 'table-no-headers',
        severity: 'serious',
        title: 'Table has no header cells',
        description:
          'The table does not contain any <th> (table header) elements. Tables require header cells to help users understand the structure and content of the table.',
        element: 'table',
        selector: tableSelector,
        wcagCriteria: '1.3.1',
        wcagLevel: 'A',
        fixDescription:
          'Add <th> elements to the first row (or first column) of the table to identify headers. Include a scope attribute (scope="col" for column headers, scope="row" for row headers).',
        codeBefore: truncateHtml(table),
        codeAfter:
          '<table>\n  <tr>\n    <th scope="col">Name</th>\n    <th scope="col">Email</th>\n  </tr>\n  <tr>\n    <td>John</td>\n    <td>john@example.com</td>\n  </tr>\n</table>',
        estimatedFixMinutes: 10,
        category: 'Tables'
      })
    } else {
      // Check th elements for scope attribute
      const thWithoutScope: Element[] = []
      thElements.forEach((th) => {
        if (!th.getAttribute('scope')) {
          thWithoutScope.push(th)
        }
      })

      if (thWithoutScope.length > 0) {
        issues.push({
          id: crypto.randomUUID(),
          checkId: 'table-missing-scope',
          severity: 'moderate',
          title: 'Table headers missing scope attribute',
          description: `The table has ${thWithoutScope.length} header cell(s) without a scope attribute. The scope attribute helps assistive technologies associate headers with data cells.`,
          element: 'th',
          selector: tableSelector,
          wcagCriteria: '1.3.1',
          wcagLevel: 'A',
          fixDescription:
            'Add a scope attribute to each <th> element. Use scope="col" for column headers and scope="row" for row headers.',
          codeBefore: '<th>Name</th>',
          codeAfter: '<th scope="col">Name</th>',
          estimatedFixMinutes: 10,
          category: 'Tables'
        })
      }
    }

    // Check for caption
    const caption = table.querySelector('caption')
    if (!caption) {
      issues.push({
        id: crypto.randomUUID(),
        checkId: 'table-missing-caption',
        severity: 'moderate',
        title: 'Table has no caption',
        description:
          'The table does not have a <caption> element. A caption helps users understand the purpose and content of the table.',
        element: 'table',
        selector: tableSelector,
        wcagCriteria: '1.3.1',
        wcagLevel: 'A',
        fixDescription:
          'Add a <caption> element as the first child of the <table> to provide a descriptive title for the table.',
        codeBefore: '<table>',
        codeAfter: '<table>\n  <caption>Monthly Sales Data</caption>',
        estimatedFixMinutes: 10,
        category: 'Tables'
      })
    }
  })

  return issues
}
