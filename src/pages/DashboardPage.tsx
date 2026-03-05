import { useState, useEffect, FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Globe,
  PlusCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  Zap,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { cn, formatDate, getDomain } from '@/lib/utils'

interface ScanRecord {
  id: string
  url: string
  score: number
  issueCount: number
  date: string
}

function getPlanBadgeVariant(plan: string): 'default' | 'success' | 'critical' {
  if (plan === 'free') return 'default'
  return 'success'
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success-600'
  if (score >= 50) return 'text-warning-600'
  return 'text-danger-600'
}

function loadScansFromStorage(): ScanRecord[] {
  try {
    // useScan stores the latest result in 'sitesafe_scan_result'
    const raw = sessionStorage.getItem('sitesafe_scan_result')
    if (!raw) return []
    const result = JSON.parse(raw)
    // Convert single ScanResult to ScanRecord array
    return [{
      id: result.scannedAt || Date.now().toString(),
      url: result.url,
      score: result.score,
      issueCount: result.totalIssues,
      date: result.scannedAt,
    }]
  } catch {
    return []
  }
}

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const { plan, isPaid } = useSubscription()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [scans] = useState<ScanRecord[]>(loadScansFromStorage)
  const [quickUrl, setQuickUrl] = useState('')

  // Show payment success toast
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      const planName = searchParams.get('plan')
      toast.success(
        planName
          ? `Payment successful! Your ${planName === 'compliance-shield' ? 'Compliance Shield' : 'Fix My Site'} is now active.`
          : 'Payment successful! Your plan has been upgraded.',
        { duration: 5000 }
      )
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handleQuickScan = (e: FormEvent) => {
    e.preventDefault()
    if (!quickUrl.trim()) return
    navigate(`/scan?url=${encodeURIComponent(quickUrl.trim())}`)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">SiteSafe Dashboard</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={getPlanBadgeVariant(plan.id)}>
              {plan.name} plan
            </Badge>
            {!isPaid && (
              <Link to="/checkout?plan=fix-my-site">
                <Button size="sm" variant="primary">
                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                  Upgrade
                </Button>
              </Link>
            )}
            <Button size="sm" variant="ghost" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="mt-1 text-gray-500">
            Monitor your website's ADA compliance and stay lawsuit-proof.
          </p>
        </div>

        {/* Quick scan */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Globe className="h-4 w-4 text-primary-600" />
              Quick Scan
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleQuickScan} className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  required
                />
              </div>
              <Button type="submit">
                Scan Now
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Plan info banner for free users */}
        {!isPaid && (
          <div className={cn(
            'mb-8 flex items-center justify-between rounded-xl border border-primary-200',
            'bg-primary-50 px-6 py-4'
          )}>
            <div>
              <p className="font-semibold text-primary-900">You're on the Free plan</p>
              <p className="text-sm text-primary-700">
                Upgrade to scan full websites, get monitoring alerts, and protect against lawsuits.
              </p>
            </div>
            <Link to="/checkout?plan=fix-my-site">
              <Button size="sm" variant="primary">
                View plans
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Scan history */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <TrendingUp className="h-4 w-4 text-primary-600" />
                Scan History
              </h2>
              <Link to="/">
                <Button size="sm" variant="outline">
                  <PlusCircle className="mr-1.5 h-4 w-4" />
                  New Scan
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {scans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <Globe className="h-7 w-7 text-gray-400" />
                </div>
                <h3 className="mb-1 text-base font-semibold text-gray-900">No scans yet</h3>
                <p className="mb-6 max-w-sm text-sm text-gray-500">
                  Run your first scan to see how your website scores for ADA compliance.
                </p>
                <Link to="/">
                  <Button variant="primary">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Scan my website
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Website</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Score</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Issues</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {scans.map((scan) => (
                      <tr key={scan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 flex-shrink-0 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {getDomain(scan.url)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('font-bold', getScoreColor(scan.score))}>
                            {scan.score}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700">{scan.issueCount} issues</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {formatDate(scan.date)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link to={`/scan?url=${encodeURIComponent(scan.url)}`}>
                              <Button size="sm" variant="ghost">
                                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                                Re-scan
                              </Button>
                            </Link>
                            <Link to={`/scan?url=${encodeURIComponent(scan.url)}`}>
                              <Button size="sm" variant="ghost">
                                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
