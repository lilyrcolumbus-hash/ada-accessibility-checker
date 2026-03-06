import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Shield, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { ScanResult } from '@/scanner/types'
import ScoreGauge from '@/components/scan-results/ScoreGauge'
import IssueCard from '@/components/scan-results/IssueCard'
import Button from '@/components/ui/Button'

interface SharedReport {
  scan: {
    url: string
    domain: string
    score: number
    total_issues: number
    critical_count: number
    serious_count: number
    moderate_count: number
    minor_count: number
    results: ScanResult
    created_at: string
  }
  shared_at: string
  views: number
}

export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>()
  const [report, setReport] = useState<SharedReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReport() {
      if (!token) return

      try {
        const { supabase } = await import('@/lib/supabase')
        const { data, error: rpcError } = await supabase.rpc('get_shared_report', {
          report_token: token,
        })

        if (rpcError || !data) {
          setError('Report not found or no longer available.')
          return
        }

        setReport(data as SharedReport)
      } catch {
        setError('Failed to load report.')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-danger-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Report Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/">
            <Button>Scan Your Own Website</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { scan } = report
  const issues = scan.results?.issues || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary-600" />
            <span className="text-lg font-bold text-gray-900">SiteSafe</span>
          </Link>
          <span className="text-sm text-gray-500">Shared Report</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Score Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ScoreGauge score={scan.score} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Accessibility Report for {scan.domain}
              </h1>
              <p className="text-gray-500 mb-3">
                Scanned on {new Date(scan.created_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-danger-600 font-medium">{scan.critical_count} Critical</span>
                <span className="text-orange-600 font-medium">{scan.serious_count} Serious</span>
                <span className="text-warning-600 font-medium">{scan.moderate_count} Moderate</span>
                <span className="text-blue-600 font-medium">{scan.minor_count} Minor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Issues */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-gray-900">
            Issues Found ({issues.length})
          </h2>
          {issues.slice(0, 10).map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
          {issues.length > 10 && (
            <p className="text-center text-gray-500 py-4">
              Showing 10 of {issues.length} issues.
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="bg-primary-50 rounded-xl border border-primary-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Want to scan your own website?
          </h2>
          <p className="text-gray-600 mb-6">
            Check your site for ADA/WCAG compliance in 30 seconds — free.
          </p>
          <Link to="/">
            <Button size="lg">
              <ExternalLink className="h-5 w-5 mr-2" />
              Scan My Website Free
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="max-w-5xl mx-auto px-4 py-6 text-center">
        <p className="text-xs text-gray-400">
          This report is for informational purposes only and does not constitute legal advice.
          SiteSafe does not guarantee ADA compliance or legal protection.
        </p>
      </div>
    </div>
  )
}
