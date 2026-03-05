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

export function checkLangAttribute(doc: Document, url: string): ScanIssue[] {
  const issues: ScanIssue[] = []
  const htmlElement = doc.documentElement

  const langAttr = htmlElement.getAttribute('lang')

  // Check if lang attribute is missing
  if (!langAttr) {
    issues.push({
      id: crypto.randomUUID(),
      checkId: 'lang-attribute-missing',
      severity: 'critical',
      title: 'Missing lang attribute on html element',
      description:
        'The <html> element does not have a lang attribute. This is required to help assistive technologies identify the language of the page.',
      element: 'html',
      selector: 'html',
      wcagCriteria: '3.1.1',
      wcagLevel: 'A',
      fixDescription: 'Add a lang attribute with a valid ISO 639-1 language code (e.g., "en" for English, "es" for Spanish).',
      codeBefore: '<html>',
      codeAfter: '<html lang="en">',
      estimatedFixMinutes: 1,
      category: 'Document'
    })
    return issues
  }

  // Check if lang attribute is empty
  if (langAttr.trim() === '') {
    issues.push({
      id: crypto.randomUUID(),
      checkId: 'lang-attribute-empty',
      severity: 'critical',
      title: 'Empty lang attribute on html element',
      description: 'The <html> element has a lang attribute, but it is empty. A valid language code must be provided.',
      element: 'html',
      selector: 'html',
      wcagCriteria: '3.1.1',
      wcagLevel: 'A',
      fixDescription: 'Provide a valid ISO 639-1 language code (e.g., "en" for English).',
      codeBefore: '<html lang="">',
      codeAfter: '<html lang="en">',
      estimatedFixMinutes: 1,
      category: 'Document'
    })
    return issues
  }

  // Validate lang code format (2-3 letter ISO 639-1 or 639-2)
  // Also accept variants like en-US
  const langRegex = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i
  if (!langRegex.test(langAttr)) {
    issues.push({
      id: crypto.randomUUID(),
      checkId: 'lang-attribute-invalid',
      severity: 'serious',
      title: 'Invalid lang attribute value',
      description: `The lang attribute value "${langAttr}" is not a valid ISO 639 language code. Use a 2-3 letter code (e.g., "en", "es", "fr") or include a region (e.g., "en-US", "es-MX").`,
      element: 'html',
      selector: 'html',
      wcagCriteria: '3.1.1',
      wcagLevel: 'A',
      fixDescription: 'Replace with a valid ISO 639-1 language code, optionally with a region identifier.',
      codeBefore: `<html lang="${langAttr}">`,
      codeAfter: '<html lang="en">',
      estimatedFixMinutes: 1,
      category: 'Document'
    })
  }

  return issues
}
