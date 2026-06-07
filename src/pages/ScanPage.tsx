import { useEffect, useRef, useState, useCallback, FormEvent } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { RefreshCw, AlertCircle, Shield, ArrowLeft, Search, LayoutDashboard, FileDown } from 'lucide-react'
import { cn, getDomain } from '@/lib/utils'
import Button from '@/components/ui/Button'
import ScoreGauge from '@/components/scan-results/ScoreGauge'
import RiskBadge from '@/components/scan-results/RiskBadge'
import RiskBreakdown from '@/components/scan-results/RiskBreakdown'
import IssuesList from '@/components/scan-results/IssuesList'
import PriorityPlan from '@/components/scan-results/PriorityPlan'
import CostEstimateCard from '@/components/scan-results/CostEstimateCard'
import UpgradePrompt from '@/components/scan-results/UpgradePrompt'
import EmailCapture from '@/components/scan-results/EmailCapture'
import EmbedWidget from '@/components/scan-results/EmbedWidget'
import { useScan } from '@/hooks/useScan'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/contexts/AuthContext'
import { calculateRisk } from '@/scanner/risk-calculator'
import { estimateCosts } from '@/scanner/cost-estimator'
import { getScoreColor } from '@/scanner/scoring'
import { generatePdfReport } from '@/lib/pdf-report'
import { INDUSTRY_RISK, TOP_LAWSUIT_STATES } from '@/config/constants'

// Scanning progress steps shown during loading
const SCAN_STEPS = [
  { label: 'Fetching page...', duration: 3000 },
  { label: 'Analyzing HTML...', duration: 3000 },
  { label: 'Checking contrast...', duration: 2500 },
  { label: 'Calculating risk...', duration: 2500 },
  { label: 'Generating report...', duration: 4000 },
]

const INDUSTRIES = Object.keys(INDUSTRY_RISK).map(key => ({
  value: key,
  label: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
}))

const STATES = Object.keys(TOP_LAWSUIT_STATES).map(key => ({
  value: key,
  label: key,
}))

function ScanningProgress() {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let elapsed = 0

    const interval = setInterval(() => {
      elapsed += 80
      // Never stops: asymptotically approaches 99% but never reaches it
      const pct = 99 * (1 - Math.exp(-elapsed / 8000))
      setProgress(Math.round(pct))

      // Cycle through steps based on progress
      const idx = Math.min(
        Math.floor((pct / 99) * SCAN_STEPS.length),
        SCAN_STEPS.length - 1
      )
      setStepIndex(idx)
    }, 80)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Spinner */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
            <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
          </div>
        </div>

        {/* Step label */}
        <div>
          <p className="text-lg font-semibold text-gray-900 mb-1">
            {SCAN_STEPS[stepIndex]?.label || 'Finishing up...'}
          </p>
          <p className="text-sm text-gray-500">Checking WCAG 2.1 AA compliance</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-primary-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-gray-400">{progress}% complete</p>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const errorNavigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-danger-50 rounded-full">
            <AlertCircle className="w-8 h-8 text-danger-500" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Scan failed</h2>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <p className="text-xs text-gray-400">
          This can happen if the site blocks automated requests or requires authentication.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => errorNavigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button variant="primary" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ScanPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const rawUrl = searchParams.get('url') || ''
  const [industry, setIndustry] = useState('other')
  const [state, setState] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const { loading, result, error, scanId, badgeToken, scanSaveError, badgeError, startScan } = useScan(rawUrl)
  const { isPaid, plan } = useSubscription()
  const { user, profile, refreshProfile } = useAuth()
  const rescansUsed = profile?.rescans_used ?? 0
  const rescansAllowed = plan.limits.rescansAllowed
  const rescanLimitReached =
    rescansAllowed !== 'unlimited' && rescansUsed >= rescansAllowed
  const startScanRef = useRef(startScan)
  startScanRef.current = startScan
  const scanStateRef = useRef({ loading, result, error })
  scanStateRef.current = { loading, result, error }

  // Auto-start the FIRST scan for a URL. Re-scans go through handleRescan, which
  // enforces the per-plan limit server-side before scanning.
  useEffect(() => {
    const { loading: l, result: r, error: e } = scanStateRef.current
    if (!rawUrl || l) return
    if (!r && !e) {
      startScanRef.current(rawUrl)
    }
  }, [rawUrl])

  // Re-scan is gated server-side: increment_rescan() atomically checks the caller's
  // plan limit in the DB and throws when it is exhausted. We only start the scan if
  // the gate passes, so the limit can't be bypassed by editing client state.
  const rescanningRef = useRef(false)
  const handleRescan = useCallback(async () => {
    if (!rawUrl || rescanningRef.current) return
    // Fast client-side guard for UX; the DB RPC below is the real enforcement.
    if (rescanLimitReached) {
      toast.error(`Re-scan limit reached on ${plan.name}. Upgrade for unlimited re-scans.`)
      return
    }
    rescanningRef.current = true
    try {
      if (user) {
        const { supabase } = await import('@/lib/supabase')
        const { error: rpcError } = await supabase.rpc('increment_rescan')
        if (rpcError) {
          toast.error(`Re-scan limit reached on ${plan.name}. Upgrade for unlimited re-scans.`)
          await refreshProfile()
          return
        }
        await refreshProfile()
      }
      startScanRef.current(rawUrl)
    } catch (err) {
      console.error('[ScanPage] re-scan failed to start:', err)
      toast.error('Could not start the re-scan. Please try again.')
    } finally {
      rescanningRef.current = false
    }
  }, [rawUrl, rescanLimitReached, user, plan.name, refreshProfile])

  // Retrying a FAILED scan just completes the original scan — it must NOT consume
  // a re-scan (no result was ever produced), so it bypasses the gate intentionally.
  const handleRetry = useCallback(() => {
    if (rawUrl) startScanRef.current(rawUrl)
  }, [rawUrl])

  const handleNewScan = (e: FormEvent) => {
    e.preventDefault()
    if (!newUrl.trim()) return
    navigate(`/scan?url=${encodeURIComponent(newUrl.trim())}`)
    setNewUrl('')
  }

  const domain = getDomain(rawUrl)

  // Derived data
  const riskAssessment = result
    ? calculateRisk(result.issues, industry, state)
    : null

  const costEstimate = result
    ? estimateCosts(result.issues)
    : null

  const totalIssueCount = result ? result.issues.length : 0

  if (loading) return <ScanningProgress />

  if (error) {
    return <ErrorState message={error} onRetry={handleRetry} />
  }

  if (!result && !rawUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Shield className="w-12 h-12 text-primary-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Scan a Website</h2>
        <p className="text-gray-500 text-sm mb-6">Enter a URL to check for ADA/WCAG accessibility issues.</p>
        <form
          className="flex w-full max-w-lg gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const input = (e.target as HTMLFormElement).elements.namedItem('url') as HTMLInputElement
            if (input.value.trim()) {
              navigate(`/scan?url=${encodeURIComponent(input.value.trim())}`)
            }
          }}
        >
          <input
            name="url"
            type="text"
            aria-label="Website URL to scan"
            placeholder="example.com"
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button type="submit">Scan</Button>
        </form>
        <div className="flex items-center gap-4 mt-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">
            Home
          </Link>
          {user && (
            <>
              <span className="text-gray-300">·</span>
              <Link to="/dashboard" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">
                Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    )
  }

  if (!result) {
    if (rawUrl && !loading) {
      return <ErrorState message="Scan completed but no results were returned. Please try again." onRetry={handleRetry} />
    }
    return <ScanningProgress />
  }

  const scoreColor = getScoreColor(result.score)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          {user && (
            <>
              <span className="text-gray-300">·</span>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </>
          )}
        </div>

        {/* Inline new scan */}
        <form onSubmit={handleNewScan} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Scan another site..."
              aria-label="Scan another website URL"
              className="pl-8 pr-3 py-1.5 w-48 sm:w-64 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">
            Scan
          </Button>
        </form>
      </div>

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">
              Results for{' '}
              <span className="text-primary-600 break-all">{domain}</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Scanned {new Date(result.scannedAt).toLocaleString()} ·{' '}
            {result.totalIssues} issue{result.totalIssues !== 1 ? 's' : ''} found ·{' '}
            {result.passedChecks.length} checks passed
            {result.pagesScanned && result.pagesScanned > 1 && (
              <>
                {' · '}
                <span className="font-medium text-gray-700">
                  {result.pagesScanned} page{result.pagesScanned !== 1 ? 's' : ''} scanned
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPaid && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => generatePdfReport(result, domain)}
              className="gap-1.5"
            >
              <FileDown className="w-3.5 h-3.5" />
              PDF Report
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRescan}
            disabled={rescanLimitReached}
            title={
              rescanLimitReached
                ? `Re-scan limit reached (${rescansAllowed} on ${plan.name}). Upgrade for unlimited re-scans.`
                : undefined
            }
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {rescanLimitReached ? 'Re-scan used' : 'Re-scan'}
          </Button>
        </div>
      </div>

      {/* Score hero section with gradient */}
      <div
        className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${scoreColor}08 0%, white 50%, ${scoreColor}05 100%)` }}
      >
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="flex-shrink-0">
              <ScoreGauge score={result.score} />
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h2 className="text-xl font-extrabold text-gray-900 mb-2">Your Accessibility Score</h2>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed max-w-lg">
                {result.score >= 90
                  ? 'Great job! Your site is highly accessible. Keep monitoring for regressions.'
                  : result.score >= 70
                    ? 'Your site has some issues but is mostly accessible. Fix the critical items first.'
                    : result.score >= 50
                      ? 'Your site needs significant accessibility improvements to meet WCAG 2.1 AA standards.'
                      : 'Your site has serious accessibility barriers. Legal risk is elevated — act quickly.'}
              </p>

              {/* Severity counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Critical', count: result.criticalCount, color: 'bg-danger-500', bg: 'bg-danger-50 border-danger-200', text: 'text-danger-700' },
                  { label: 'Serious', count: result.seriousCount, color: 'bg-orange-500', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
                  { label: 'Moderate', count: result.moderateCount, color: 'bg-warning-500', bg: 'bg-warning-50 border-warning-200', text: 'text-warning-700' },
                  { label: 'Minor', count: result.minorCount, color: 'bg-blue-400', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
                ].map(({ label, count, color, bg, text }) => (
                  <div key={label} className={cn('rounded-xl border px-3 py-3 text-center', bg)}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className={cn('w-2 h-2 rounded-full', color)} />
                      <span className={cn('text-xs font-bold uppercase tracking-wider', text)}>{label}</span>
                    </div>
                    <p className={cn('text-3xl font-extrabold leading-none', text)}>{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embed widget — for paid users, right after score */}
      {isPaid && (
        <EmbedWidget
          domain={domain}
          score={result.score}
          badgeToken={badgeToken}
          scanId={scanId}
          scanSaveError={scanSaveError}
          badgeError={badgeError}
        />
      )}

      {/* Email capture for non-logged-in users */}
      {!user && result && <EmailCapture />}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority plan */}
          {result.issues.length > 0 && (
            <PriorityPlan issues={result.issues} score={result.score} />
          )}

          {/* Issues list */}
          <IssuesList issues={result.issues} isPaid={isPaid} />
        </div>

        {/* Right column: 1/3 width */}
        <div className="space-y-5">
          {/* Risk badge + breakdown */}
          {riskAssessment && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Overall Risk Level</p>
                <div className="flex items-center justify-between gap-3">
                  <RiskBadge risk={riskAssessment.overallRisk} />
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Lawsuit probability</p>
                    <p className="text-sm font-bold text-gray-700">{riskAssessment.lawsuitProbability}</p>
                  </div>
                </div>
              </div>

              <RiskBreakdown
                riskAssessment={riskAssessment}
                industry={industry}
                state={state}
                onIndustryChange={setIndustry}
                onStateChange={setState}
                industries={INDUSTRIES}
                states={STATES}
              />
            </>
          )}

          {/* Cost estimate */}
          {costEstimate && (
            <CostEstimateCard costEstimate={costEstimate} isPaid={isPaid} />
          )}

          {/* Upgrade prompt — only show in sidebar on desktop when issues exist */}
          {!isPaid && totalIssueCount > 0 && (
            <div className="hidden lg:block">
              <UpgradePrompt totalIssueCount={totalIssueCount} />
            </div>
          )}
        </div>
      </div>

      {/* Legal disclaimer */}
      <p className="text-xs text-gray-400 text-center pb-4">
        This tool identifies potential accessibility issues for informational purposes only and does not constitute legal advice.
        Results may not be exhaustive. Consult a qualified accessibility specialist or attorney for full compliance assurance.
      </p>
    </div>
  )
}
