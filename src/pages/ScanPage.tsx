import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { RefreshCw, AlertCircle, ChevronDown, Shield } from 'lucide-react'
import { cn, getDomain } from '@/lib/utils'
import Button from '@/components/ui/Button'
import ScoreGauge from '@/components/scan-results/ScoreGauge'
import RiskBadge from '@/components/scan-results/RiskBadge'
import RiskBreakdown from '@/components/scan-results/RiskBreakdown'
import IssuesList from '@/components/scan-results/IssuesList'
import PriorityPlan from '@/components/scan-results/PriorityPlan'
import CostEstimateCard from '@/components/scan-results/CostEstimateCard'
import UpgradePrompt from '@/components/scan-results/UpgradePrompt'
import { useScan } from '@/hooks/useScan'
import { useSubscription } from '@/hooks/useSubscription'
import { calculateRisk } from '@/scanner/risk-calculator'
import { estimateCosts } from '@/scanner/cost-estimator'
import { getScoreColor } from '@/scanner/scoring'
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
    const totalDuration = SCAN_STEPS.reduce((s, step) => s + step.duration, 0)

    const interval = setInterval(() => {
      elapsed += 100
      // Ease-out curve: fast at start, slows down approaching 95%
      const linear = elapsed / totalDuration
      const eased = 1 - Math.pow(1 - Math.min(linear, 1), 2.5)
      setProgress(Math.min(95, Math.round(eased * 95)))

      let cumulative = 0
      for (let i = 0; i < SCAN_STEPS.length; i++) {
        cumulative += SCAN_STEPS[i].duration
        if (elapsed < cumulative) {
          setStepIndex(i)
          break
        }
        // If past all steps, stay on last
        if (i === SCAN_STEPS.length - 1) setStepIndex(i)
      }
    }, 100)

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
        <Button variant="primary" onClick={onRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    </div>
  )
}

export function ScanPage() {
  const [searchParams] = useSearchParams()
  const scanNavigate = useNavigate()
  const rawUrl = searchParams.get('url') || ''
  const [industry, setIndustry] = useState('other')
  const [state, setState] = useState('')

  const { loading, result, error, startScan } = useScan(rawUrl)
  const { isPaid } = useSubscription()

  // Auto-start scan when URL param is present and no result yet
  useEffect(() => {
    if (rawUrl && !result && !loading && !error) {
      startScan(rawUrl)
    }
  }, [rawUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRescan = useCallback(() => {
    if (rawUrl) startScan(rawUrl)
  }, [rawUrl, startScan])

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
    return <ErrorState message={error} onRetry={handleRescan} />
  }

  if (!result && !rawUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Scan a Website</h2>
        <p className="text-gray-500 text-sm mb-6">Enter a URL to check for ADA/WCAG accessibility issues.</p>
        <form
          className="flex w-full max-w-lg gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const input = (e.target as HTMLFormElement).elements.namedItem('url') as HTMLInputElement
            if (input.value.trim()) {
              scanNavigate(`/scan?url=${encodeURIComponent(input.value.trim())}`)

            }
          }}
        >
          <input
            name="url"
            type="text"
            placeholder="https://example.com"
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button type="submit">Scan</Button>
        </form>
      </div>
    )
  }

  if (!result) {
    return <ScanningProgress />
  }

  const scoreColor = getScoreColor(result.score)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRescan}
          className="gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-scan
        </Button>
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

      {/* Risk refinement selectors */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <span className="text-sm font-medium text-gray-700">Refine risk estimate:</span>
        <div className="relative">
          <select
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            className={cn(
              'appearance-none pl-3 pr-8 py-1.5 text-sm rounded-lg border border-gray-300 bg-white',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'cursor-pointer'
            )}
          >
            {INDUSTRIES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        </div>
        <div className="relative">
          <select
            value={state}
            onChange={e => setState(e.target.value)}
            className={cn(
              'appearance-none pl-3 pr-8 py-1.5 text-sm rounded-lg border border-gray-300 bg-white',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'cursor-pointer'
            )}
          >
            <option value="">Select state</option>
            {STATES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        </div>
        <span className="text-xs text-gray-400">Updates risk estimate in real time</span>
      </div>

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
