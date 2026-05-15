import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Copy, Check, AlertTriangle, AlertCircle, Info, AlertOctagon, Gift, Monitor, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatTime } from '@/scanner/cost-estimator'
import type { ScanIssue } from '@/scanner/types'


const SEVERITY_VARIANT: Record<string, 'critical' | 'serious' | 'moderate' | 'minor'> = {
  critical: 'critical',
  serious: 'serious',
  moderate: 'moderate',
  minor: 'minor',
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
}

const SEVERITY_BORDER: Record<string, string> = {
  critical: 'border-l-danger-500',
  serious: 'border-l-orange-500',
  moderate: 'border-l-warning-500',
  minor: 'border-l-blue-400',
}

const SEVERITY_BG: Record<string, string> = {
  critical: 'bg-danger-50/40',
  serious: 'bg-orange-50/40',
  moderate: 'bg-warning-50/30',
  minor: 'bg-blue-50/30',
}

type Platform = 'shopify' | 'wordpress' | 'wix' | 'squarespace' | 'html'

const IMAGE_CHECKS = ['alt-text-missing', 'alt-text-missing-input-image', 'alt-text-missing-area']

type GuideSet = Record<Platform, { label: string; steps: string[] }>

const IMAGE_GUIDES: GuideSet = {
  shopify: {
    label: 'Shopify',
    steps: [
      'For product images: go to Products → select the product → click the image → type alt text in the field',
      'For section/page images: go to Online Store → Themes → Customize → find the image → click it → fill in the "Alt text" field',
      'For blog images: go to Blog posts → select the post → click the image → add alt text',
      'Describe what the image shows (e.g., "Red leather handbag on white background")',
      'Click Save — changes go live instantly',
    ],
  },
  wordpress: {
    label: 'WordPress',
    steps: [
      'Go to Media → Library in your WordPress admin',
      'Find and click the image (use the search box if needed)',
      'In the right panel, fill in the "Alt Text" field',
      'Describe what the image shows (e.g., "Team photo at company retreat")',
      'Click Save — the alt text will update everywhere the image is used',
    ],
  },
  wix: {
    label: 'Wix',
    steps: [
      'Open the Wix Editor for your site',
      'Click the image on the page',
      'Click Settings (gear icon) → "What\'s in the image?"',
      'Type a description of what the image shows',
      'Click Publish to make changes live',
    ],
  },
  squarespace: {
    label: 'Squarespace',
    steps: [
      'Open your site in the Squarespace Editor',
      'Navigate to the page with the image',
      'Click the image → click Edit (pencil icon)',
      'Fill in the "Image Description" or "Alt Text" field',
      'Changes save automatically — click the back arrow when done',
    ],
  },
  html: {
    label: 'Plain HTML',
    steps: [
      'Open your HTML file in any code editor (VS Code, Notepad++, etc.)',
      'Find the <img> tag (use Ctrl+F / Cmd+F to search for the filename)',
      'Add alt="Your description here" inside the <img> tag',
      'Save the file and upload it to your hosting provider',
    ],
  },
}

const CODE_GUIDES: GuideSet = {
  shopify: {
    label: 'Shopify',
    steps: [
      'Go to Online Store → Themes → "..." → Edit code',
      'In the left sidebar, use the search box at the top to search across all files',
      'Copy a unique part of the red "Current (broken)" code above and paste it in the search',
      'Click the file that appears in the results → it will open with the code highlighted',
      'Replace the broken code with the green "Fixed" version above',
      'Click Save — changes go live instantly',
    ],
  },
  wordpress: {
    label: 'WordPress',
    steps: [
      'Go to Appearance → Theme File Editor (or use a child theme)',
      'Copy a unique part of the red "Current (broken)" code above',
      'Try searching in: header.php, footer.php, page.php, single.php, or template-parts/',
      'Open each file and use Ctrl+F / Cmd+F to search for the broken code',
      'Replace it with the green "Fixed" version above',
      'Click Update File — clear your cache if using a caching plugin',
    ],
  },
  wix: {
    label: 'Wix',
    steps: [
      'Open the Wix Editor for your site',
      'Find the element on the page (button, link, form, etc.)',
      'Click it → a settings panel will appear on the right side',
      'Update the property mentioned in the fix above (label, text, link, etc.)',
      'Click Publish to make changes live',
    ],
  },
  squarespace: {
    label: 'Squarespace',
    steps: [
      'Open your site in the Squarespace Editor',
      'Navigate to the page where this element appears',
      'Click the element (text, button, link) → click Edit',
      'Update the property mentioned in the fix above',
      'Changes save automatically — click the back arrow when done',
    ],
  },
  html: {
    label: 'Plain HTML',
    steps: [
      'Open your HTML file in any code editor (VS Code, Notepad++, etc.)',
      'Copy a unique part of the red "Current (broken)" code above',
      'Use Ctrl+F / Cmd+F to find it in your file',
      'Replace it with the green "Fixed" version above',
      'Save the file and upload it to your hosting provider',
    ],
  },
}

function PlatformGuide({ checkId }: { checkId: string }) {
  const [platform, setPlatform] = useState<Platform | null>(null)
  const guides = IMAGE_CHECKS.includes(checkId) ? IMAGE_GUIDES : CODE_GUIDES

  return (
    <div className="rounded-xl border-2 border-dashed border-primary-200 bg-gradient-to-br from-primary-50/50 to-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary-100 rounded-lg">
          <Gift className="w-4 h-4 text-primary-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">Step-by-step install guide</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-primary-600 px-1.5 py-0.5 rounded-full">
              Free bonus
            </span>
          </div>
          <p className="text-xs text-gray-500">Select your platform — we'll show you exactly where to paste the fix</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.entries(guides) as [Platform, { label: string }][]).map(([key, { label }]) => (
          <button
            key={key}
            onClick={(e) => { e.stopPropagation(); setPlatform(platform === key ? null : key) }}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors',
              platform === key
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {platform && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Monitor className="w-3.5 h-3.5 text-primary-600" />
            <span className="text-xs font-bold text-primary-700">{guides[platform].label} — How to apply</span>
          </div>
          <ol className="space-y-1.5">
            {guides[platform].steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-xs text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-[10px]">
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function SeverityIcon({ severity }: { severity: string }) {
  const base = 'w-4 h-4 flex-shrink-0'
  switch (severity) {
    case 'critical': return <AlertOctagon className={cn(base, 'text-danger-600')} />
    case 'serious': return <AlertTriangle className={cn(base, 'text-orange-600')} />
    case 'moderate': return <AlertCircle className={cn(base, 'text-warning-600')} />
    default: return <Info className={cn(base, 'text-blue-500')} />
  }
}

function LockedFixOverlay() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const checkoutPath = user ? '/checkout?plan=fix-my-site' : '/register?plan=fix-my-site'

  return (
    <div className="border-t border-gray-100 px-4 py-6 bg-gray-50 text-center space-y-3">
      <div className="flex items-center justify-center gap-2 text-gray-500">
        <Lock className="w-4 h-4" />
        <p className="text-sm font-semibold">Code fix locked</p>
      </div>
      <p className="text-xs text-gray-500 max-w-sm mx-auto">
        Upgrade to Fix My Site ($49 one-time) to see the exact code fix for this issue.
      </p>
      <Button
        size="sm"
        variant="primary"
        onClick={(e) => {
          e.stopPropagation()
          sessionStorage.setItem('sitesafe_pending_plan', 'fix-my-site')
          navigate(checkoutPath)
        }}
      >
        Unlock All Fixes — $49
      </Button>
    </div>
  )
}

interface IssueCardProps {
  issue: ScanIssue
  showFix?: boolean
}

export default function IssueCard({ issue, showFix = true }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const isImageIssue = IMAGE_CHECKS.includes(issue.checkId)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(issue.codeAfter)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-xl border border-gray-200 bg-white overflow-hidden border-l-4 transition-shadow',
        SEVERITY_BORDER[issue.severity],
        expanded && 'shadow-md ring-1 ring-gray-100',
      )}
    >
      {/* Header — always visible, always clickable */}
      <button
        className={cn(
          'w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors hover:bg-gray-50/80',
          SEVERITY_BG[issue.severity],
        )}
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        {/* Severity icon */}
        <div className="mt-0.5">
          <SeverityIcon severity={issue.severity} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant={SEVERITY_VARIANT[issue.severity]}>
              {SEVERITY_LABEL[issue.severity]}
            </Badge>
            <span className="text-xs text-gray-400 font-mono">{issue.wcagCriteria}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 leading-snug">{issue.title}</p>
          <p className="text-sm text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{issue.description}</p>
          {issue.pageUrl && (
            <p className="text-xs text-gray-400 mt-1 font-mono truncate">
              Found on:{' '}
              <span className="text-gray-500">
                {(() => {
                  try {
                    const u = new URL(issue.pageUrl)
                    return u.pathname === '/' ? u.hostname : u.pathname
                  } catch {
                    return issue.pageUrl
                  }
                })()}
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 pt-0.5">
          <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:flex items-center gap-1">
            ~{formatTime(issue.estimatedFixMinutes)} fix
          </span>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Expandable code section */}
      {expanded && !showFix && (
        <LockedFixOverlay />
      )}
      {expanded && showFix && (
        <div className="border-t border-gray-100 px-4 pb-4 space-y-3 bg-white">
            <>
              {/* Fix description */}
              <div className="pt-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">How to fix: </span>
                  {issue.fixDescription}
                </p>
              </div>

              {isImageIssue ? (() => {
                const imgSrc = issue.codeBefore?.match(/src="([^"]*)"/)?.[1] || ''
                const fullSrc = imgSrc.startsWith('//') ? `https:${imgSrc}` : imgSrc
                return (
                  <>
                    {/* Image preview + link to identify */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Image to fix</p>
                      {fullSrc && (
                        <div className="flex items-start gap-3">
                          <img
                            src={fullSrc}
                            alt=""
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200 bg-white flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-mono text-gray-500 break-all line-clamp-2">{imgSrc}</p>
                            <a
                              href={fullSrc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-1 text-xs font-semibold text-primary-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open image in new tab to identify it →
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary-50 border border-primary-200">
                      <Info className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-primary-800">What to type as alt text</p>
                        <p className="text-xs text-primary-700 mt-0.5">
                          Describe what the image shows in a few words. Examples: "Team photo at company retreat", "Red leather handbag on white background", "Company logo". If the image is purely decorative, leave the alt text empty.
                        </p>
                      </div>
                    </div>
                  </>
                )
              })() : (
                <>
                  {/* Code before/after side by side on desktop */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Code before */}
                    {issue.codeBefore && (
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-2 h-2 rounded-full bg-danger-500" />
                          <span className="text-xs font-bold text-danger-600 uppercase tracking-wider">Current (broken)</span>
                        </div>
                        <pre className="text-xs font-mono bg-danger-50 border border-danger-200 text-danger-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                          {issue.codeBefore}
                        </pre>
                      </div>
                    )}

                    {/* Code after */}
                    {issue.codeAfter && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-success-500" />
                            <span className="text-xs font-bold text-success-600 uppercase tracking-wider">Fixed</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-6 px-2 text-xs gap-1"
                          >
                            {copied
                              ? <><Check className="w-3 h-3 text-success-600" /> Copied</>
                              : <><Copy className="w-3 h-3" /> Copy</>}
                          </Button>
                        </div>
                        <pre className="text-xs font-mono bg-success-50 border border-success-200 text-success-700 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                          {issue.codeAfter}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Warning if fix contains placeholders that need customization */}
                  {issue.codeAfter && /\[.*?\]/.test(issue.codeAfter) && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-warning-50 border border-warning-200">
                      <AlertTriangle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-warning-800">Action required: customize the text in [brackets]</p>
                        <p className="text-xs text-warning-700 mt-0.5">
                          Replace any text in [brackets] with your own description. Don't paste it as-is — screen readers will read it literally.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Platform-specific install guide — bonus */}
              <PlatformGuide checkId={issue.checkId} />

              {/* Meta row */}
              <div className="flex flex-wrap gap-x-5 gap-y-1 pt-2 border-t border-gray-100 text-xs text-gray-400">
                <span>WCAG <span className="font-medium text-gray-600">{issue.wcagCriteria}</span></span>
                <span>Level <span className="font-medium text-gray-600">{issue.wcagLevel}</span></span>
                <span>Fix time <span className="font-medium text-gray-600">~{formatTime(issue.estimatedFixMinutes)}</span></span>
              </div>
            </>
        </div>
      )}
    </div>
  )
}
