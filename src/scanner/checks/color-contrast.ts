import { ScanIssue, generateId } from '../types'
import { parseColor, calculateContrastRatio, suggestCompliantColor } from '../color-utils'

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

function getFontSizeInPixels(el: Element): number {
  // Try to extract font-size from style attribute
  const styleAttr = el.getAttribute('style')
  if (styleAttr) {
    const fontSizeMatch = styleAttr.match(/font-size\s*:\s*(\d+(?:\.\d+)?)(px|pt|em|rem)?/i)
    if (fontSizeMatch) {
      const size = parseFloat(fontSizeMatch[1])
      const unit = fontSizeMatch[2] || 'px'

      // Simple conversion (assuming 16px = 1em/rem)
      if (unit === 'em' || unit === 'rem') {
        return size * 16
      } else if (unit === 'pt') {
        return size * (4 / 3) // 1pt = 1.333px
      }
      return size
    }
  }

  // Default assumption: 16px for most text
  return 16
}

function isFontWeightBold(el: Element): boolean {
  const styleAttr = el.getAttribute('style')
  if (styleAttr) {
    const fontWeightMatch = styleAttr.match(/font-weight\s*:\s*(\d+|bold|bolder)/i)
    if (fontWeightMatch) {
      const weight = fontWeightMatch[1].toLowerCase()
      return weight === 'bold' || weight === 'bolder' || parseInt(weight) >= 700
    }
  }

  // Check if it's a strong, b, or th element
  if (el.tagName.toLowerCase() === 'strong' || el.tagName.toLowerCase() === 'b' || el.tagName.toLowerCase() === 'th') {
    return true
  }

  return false
}

function isLargeText(el: Element): boolean {
  const fontSize = getFontSizeInPixels(el)
  const isBold = isFontWeightBold(el)

  // Large text: >= 18pt (24px) or >= 14pt (18.67px) bold
  if (fontSize >= 24) {
    return true
  }

  if (isBold && fontSize >= 18.67) {
    return true
  }

  return false
}

function getColorFromInlineStyle(styleAttr: string | null, property: string): string | null {
  if (!styleAttr) {
    return null
  }

  const regex = new RegExp(`${property}\\s*:\\s*([^;]+)`)
  const match = styleAttr.match(regex)

  if (match) {
    return match[1].trim()
  }

  return null
}

function getElementColors(el: Element): { fg: string | null; bg: string | null } {
  const styleAttr = el.getAttribute('style')
  const fg = getColorFromInlineStyle(styleAttr, 'color')
  const bg = getColorFromInlineStyle(styleAttr, 'background-color')

  return { fg, bg }
}

export function checkColorContrast(doc: Document, url: string): ScanIssue[] {
  const issues: ScanIssue[] = []

  // Text elements to check
  const textSelectors = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'li', 'td', 'th', 'label', 'button']
  const elements = doc.querySelectorAll(textSelectors.join(','))

  elements.forEach(el => {
    // Skip elements with no text content
    if (!el.textContent || el.textContent.trim().length === 0) {
      return
    }

    const { fg, bg } = getElementColors(el)

    // Only check if we can determine both colors from inline styles
    if (fg && bg) {
      const fgParsed = parseColor(fg)
      const bgParsed = parseColor(bg)

      if (fgParsed && bgParsed) {
        const contrastRatio = calculateContrastRatio(fg, bg)
        const isLarge = isLargeText(el)
        const requiredRatio = isLarge ? 3 : 4.5

        if (contrastRatio < requiredRatio) {
          const severity = isLarge ? 'moderate' : 'serious'
          const suggestion = suggestCompliantColor(fg, bg, requiredRatio)
          const suggestedColor = suggestion?.suggested || (contrastRatio < 3 ? '#000000' : fg)

          issues.push({
            id: generateId(),
            checkId: 'color-contrast-insufficient',
            severity,
            title: `Insufficient color contrast`,
            description: `The contrast ratio between the foreground and background colors is ${contrastRatio.toFixed(2)}:1, but should be at least ${requiredRatio}:1 for ${isLarge ? 'large' : 'normal'} text.`,
            element: el.tagName.toLowerCase(),
            selector: getSelector(el),
            wcagCriteria: '1.4.3',
            wcagLevel: 'AA',
            fixDescription: `Adjust the foreground color to have a contrast ratio of at least ${requiredRatio}:1 against the background color.`,
            codeBefore: truncateHtml(el),
            codeAfter: `<${el.tagName.toLowerCase()} style="color: ${suggestedColor}; ...">...</${el.tagName.toLowerCase()}>`,
            estimatedFixMinutes: 5,
            category: 'Color Contrast'
          })
        }
      }
    }
  })

  return issues
}
