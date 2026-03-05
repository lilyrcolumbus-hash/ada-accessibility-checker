import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Copy, Check, Lock, AlertTriangle, AlertCircle, Info, AlertOctagon, ChevronRight, Gift, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatTime } from '@/scanner/cost-estimator'
import type { ScanIssue } from '@/scanner/types'

interface IssueCardProps {
  issue: ScanIssue
  isPaid: boolean
  isFreeFix?: boolean
}

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

const PLATFORM_GUIDES: Record<Platform, { label: string; steps: string[] }> = {
  shopify: {
    label: 'Shopify',
    steps: [
      'Go to Online Store → Themes → "..." → Edit code',
      'Find the file containing this element (use Ctrl+F to search)',
      'Common locations: theme.liquid, header.liquid, sections/*.liquid',
      'Replace the broken code with the fixed version above',
      'Click Save — changes go live instantly',
    ],
  },
  wordpress: {
    label: 'WordPress',
    steps: [
      'Go to Appearance → Theme File Editor (or use a child theme)',
      'Find the template file containing this element',
      'Common locations: header.php, footer.php, page.php, single.php',
      'Replace the broken code with the fixed version above',
      'Click Update File — clear your cache if using a caching plugin',
    ],
  },
  wix: {
    label: 'Wix',
    steps: [
      'Open the Wix Editor for your site',
      'Click the element mentioned in this issue',
      'Use the Settings panel on the right to update properties',
      'For alt text: click the image → Settings → "What\'s in the image?"',
      'Click Publish to make changes live',
    ],
  },
  squarespace: {
    label: 'Squarespace',
    steps: [
      'Open your site in the Squarespace Editor',
      'Navigate to the page containing this element',
      'Click the element → Edit → update the relevant property',
      'For alt text: click image → Edit → Image Description field',
      'Changes save automatically — click the back arrow when done',
    ],
  },
  html: {
    label: 'Plain HTML',
    steps: [
      'Open the HTML file in any code editor (VS Code, Notepad++, etc.)',
      'Use Ctrl+F / Cmd+F to find the broken code shown above',
      'Replace it with the fixed version',
      'Save the file and upload it to your hosting provider',
    ],
  },
}

function PlatformGuide() {
  const [platform, setPlatform] = useState<Platform | null>(null)

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
        {(Object.entries(PLATFORM_GUIDES) as [Platform, { label: string }][]).map(([key, { label }]) => (
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
            <span className="text-xs font-bold text-primary-700">{PLATFORM_GUIDES[platform].label} — How to apply</span>
          </div>
          <ol className="space-y-1.5">
            {PLATFORM_GUIDES[platform].steps.map((step, i) => (
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

export default function IssueCard({ issue, isPaid, isFreeFix }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  const showFix = isPaid || isFreeFix
  const checkoutPath = user ? '/checkout?plan=fix-my-site' : '/register?plan=fix-my-site'

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
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 space-y-3 bg-white">
          {showFix ? (
            <>
              {/* Fix description */}
              <div className="pt-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">How to fix: </span>
                  {issue.fixDescription}
                </p>
              </div>

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

              {/* Platform-specific install guide — bonus */}
              <PlatformGuide />

              {/* Meta row */}
              <div className="flex flex-wrap gap-x-5 gap-y-1 pt-2 border-t border-gray-100 text-xs text-gray-400">
                <span>WCAG <span className="font-medium text-gray-600">{issue.wcagCriteria}</span></span>
                <span>Level <span className="font-medium text-gray-600">{issue.wcagLevel}</span></span>
                <span>Fix time <span className="font-medium text-gray-600">~{formatTime(issue.estimatedFixMinutes)}</span></span>
              </div>
            </>
          ) : (
            <>
              {/* Locked fix section for free users */}
              <div className="pt-3">
                <p className="text-sm font-semibold text-gray-900 mb-2">How to fix:</p>
              </div>
              <div className="relative select-none">
                {/* Blurred placeholder content */}
                <div className="blur-[6px] pointer-events-none" aria-hidden="true">
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    {issue.fixDescription}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    {issue.codeAfter && (
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-2 h-2 rounded-full bg-success-500" />
                          <span className="text-xs font-bold text-success-600 uppercase tracking-wider">Fixed</span>
                        </div>
                        <pre className="text-xs font-mono bg-success-50 border border-success-200 text-success-700 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                          {issue.codeAfter}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lock overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="p-2.5 bg-gray-100 rounded-full shadow-sm">
                    <Lock className="w-5 h-5 text-gray-500" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Upgrade to unlock code fixes</span>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-1 gap-1"
                    onClick={(e) => { e.stopPropagation(); navigate(checkoutPath) }}
                  >
                    Fix My Site
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
