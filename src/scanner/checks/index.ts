import { CheckFunction } from '../types'
import { checkAltText } from './alt-text'
import { checkColorContrast } from './color-contrast'
import { checkFormLabels } from './form-labels'
import { checkHeadingHierarchy } from './heading-hierarchy'
import { checkLinkText } from './link-text'
import { checkLangAttribute } from './lang-attribute'
import { checkEmptyInteractive } from './empty-interactive'
import { checkDuplicateIds } from './duplicate-ids'
import { checkTableHeaders } from './table-headers'
import { checkAriaRoles } from './aria-roles'
import { checkAutoPlayMedia } from './auto-play-media'

export interface CheckInfo {
  id: string
  name: string
  fn: CheckFunction
}

export const ALL_CHECKS: CheckInfo[] = [
  { id: 'alt-text', name: 'Image Alt Text', fn: checkAltText },
  { id: 'color-contrast', name: 'Color Contrast', fn: checkColorContrast },
  { id: 'form-labels', name: 'Form Labels', fn: checkFormLabels },
  { id: 'heading-hierarchy', name: 'Heading Hierarchy', fn: checkHeadingHierarchy },
  { id: 'link-text', name: 'Link Text', fn: checkLinkText },
  { id: 'lang-attribute', name: 'Language Attribute', fn: checkLangAttribute },
  { id: 'empty-interactive', name: 'Empty Interactive Elements', fn: checkEmptyInteractive },
  { id: 'duplicate-ids', name: 'Duplicate IDs', fn: checkDuplicateIds },
  { id: 'table-headers', name: 'Table Headers', fn: checkTableHeaders },
  { id: 'aria-roles', name: 'ARIA Roles', fn: checkAriaRoles },
  { id: 'auto-play-media', name: 'Auto-Play Media', fn: checkAutoPlayMedia },
]
