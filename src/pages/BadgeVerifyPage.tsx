import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Shield, Loader2, AlertCircle, ExternalLink, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

interface BadgeData {
  domain: string
  score: number
  is_active: boolean
  last_scan_date: string
}

export default function BadgeVerifyPage() {
  const { token } = useParams<{ token: string }>()
  const [badge, setBadge] = useState<BadgeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBadge() {
      if (!token) return

      try {
        const { supabase } = await import('@/lib/supabase')
        const { data, error: rpcError } = await supabase.rpc('verify_badge', {
          badge_token: token,
        })

        if (rpcError || !data) {
          setError('Badge not found or no longer active.')
          return
        }

        setBadge(data as BadgeData)
      } catch {
        setError('Failed to verify badge.')
      } finally {
        setLoading(false)
      }
    }

    fetchBadge()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !badge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-12 w-12 text-danger-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Badge Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/">
            <Button>Scan Your Own Website</Button>
          </Link>
        </div>
      </div>
    )
  }

  const scoreColor = badge.score >= 90 ? 'text-success-600' : badge.score >= 70 ? 'text-lime-600' : badge.score >= 50 ? 'text-warning-600' : 'text-danger-600'
  const scoreBg = badge.score >= 90 ? 'bg-success-50 border-success-200' : badge.score >= 70 ? 'bg-lime-50 border-lime-200' : badge.score >= 50 ? 'bg-warning-50 border-warning-200' : 'bg-danger-50 border-danger-200'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary-600" />
            <span className="text-lg font-bold text-gray-900">SiteSafe</span>
          </Link>
          <span className="text-sm text-gray-500">Badge Verification</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Verified banner */}
          <div className="bg-success-50 border-b border-success-200 px-6 py-4 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-success-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-success-800">Verified Accessibility Badge</p>
              <p className="text-sm text-success-700">This badge is authentic and currently active.</p>
            </div>
          </div>

          <div className="p-8 text-center">
            {/* Badge visual */}
            <div className="inline-flex items-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-6 py-4 shadow-md mb-8">
              <Shield className="h-8 w-8 text-primary-600" />
              <div className="text-left">
                <div className="text-sm font-bold text-gray-900">SiteSafe Verified</div>
                <div className="text-xs text-gray-500">ADA/WCAG 2.1 AA Tested</div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">{badge.domain}</h1>
            <p className="text-gray-500 mb-6">has been tested for ADA/WCAG 2.1 AA accessibility compliance.</p>

            {/* Score */}
            <div className={`inline-flex items-center gap-3 rounded-xl border px-6 py-4 mb-6 ${scoreBg}`}>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Accessibility Score</p>
                <p className={`text-4xl font-extrabold ${scoreColor}`}>{badge.score}<span className="text-lg text-gray-400">/100</span></p>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Last scanned: {new Date(badge.last_scan_date).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Want to verify your own website's accessibility?</p>
          <Link to="/">
            <Button size="lg">
              <ExternalLink className="h-5 w-5 mr-2" />
              Scan My Website Free
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          This badge indicates the website was tested using SiteSafe's automated accessibility scanner.
          It does not guarantee full ADA/WCAG compliance or legal protection.
        </p>
      </div>
    </div>
  )
}
