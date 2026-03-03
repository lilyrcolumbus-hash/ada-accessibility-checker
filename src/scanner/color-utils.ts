import { ColorSuggestion } from './types'

const NAMED_COLORS: Record<string, [number, number, number]> = {
  white: [255, 255, 255],
  black: [0, 0, 0],
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  orange: [255, 165, 0],
  purple: [128, 0, 128],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  transparent: [0, 0, 0],
}

export function parseColor(color: string): [number, number, number] | null {
  if (!color) return null
  color = color.trim().toLowerCase()

  if (NAMED_COLORS[color]) return NAMED_COLORS[color]

  // Hex
  const hexMatch = color.match(/^#([0-9a-f]{3,8})$/i)
  if (hexMatch) {
    let hex = hexMatch[1]
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    return [
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16),
    ]
  }

  // rgb/rgba
  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])]
  }

  return null
}

function sRGBtoLinear(channel: number): number {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b)
}

export function contrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
  const l1 = relativeLuminance(...color1)
  const l2 = relativeLuminance(...color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function calculateContrastRatio(c1: string, c2: string): number {
  const color1 = parseColor(c1)
  const color2 = parseColor(c2)
  if (!color1 || !color2) return 0
  return contrastRatio(color1, color2)
}

export function meetsAA(ratio: number, isLargeText: boolean): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

export function meetsAAA(ratio: number, isLargeText: boolean): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')
}

export function suggestCompliantColor(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): ColorSuggestion | null {
  const fg = parseColor(foreground)
  const bg = parseColor(background)
  if (!fg || !bg) return null

  const currentRatio = contrastRatio(fg, bg)
  if (currentRatio >= targetRatio) return null

  const bgLum = relativeLuminance(...bg)

  // Try darkening or lightening the foreground
  let bestColor: [number, number, number] = [...fg]
  const shouldDarken = bgLum > 0.5

  for (let step = 1; step <= 255; step++) {
    const adjusted: [number, number, number] = shouldDarken
      ? [Math.max(0, fg[0] - step), Math.max(0, fg[1] - step), Math.max(0, fg[2] - step)]
      : [Math.min(255, fg[0] + step), Math.min(255, fg[1] + step), Math.min(255, fg[2] + step)]

    const ratio = contrastRatio(adjusted, bg)
    if (ratio >= targetRatio) {
      bestColor = adjusted
      break
    }
  }

  const suggestedHex = rgbToHex(...bestColor)
  const newRatio = contrastRatio(bestColor, bg)

  return {
    original: foreground,
    suggested: suggestedHex,
    contrastRatio: Math.round(newRatio * 100) / 100,
    meetsAA: newRatio >= 4.5,
    meetsAAA: newRatio >= 7,
  }
}
