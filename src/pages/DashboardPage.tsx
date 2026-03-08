import { useState, useEffect, FormEvent, useCallback } from 'react'
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
  Trash2,
  Loader2,
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

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-success-50'
  if (score >= 50) return 'bg-warning-50'
  return 'bg-danger-50'
}

export function DashboardPage() {
  const { user, signOut, refreshProfile } = useAuth()
  const { plan, isPaid } = useSubscription()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [scans, setScans] = useState<ScanRecord[]>([])
  const [loadingScans, setLoadingScans] = useState(true)
  const [quickUrl, setQuickUrl] = useState('')

  // Load scans from Supabase DB
  const loadScans = useCallback(async () => {
    if (!user) {
      setLoadingScans(false)
      return
    }

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('scans')
        .select('id, url, score, total_issues, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      if (data && data.length > 0) {
        setScans(data.map(s => ({
          id: s.id,
          url: s.url,
          score: s.score,
          issueCount: s.total_issues,
          date: s.created_at,
        })))
      } else {
        // Fallback: load from sessionStorage if no DB scans
        try {
          const raw = sessionStorage.getItem('sitesafe_scan_result')
          if (raw) {
            const result = JSON.parse(raw)
            setScans([{
              id: result.scannedAt || Date.now().toString(),
              url: result.url,
              score: result.score,
              issueCount: result.totalIssues,
              date: result.scannedAt,
            }])
          }
        } catch { /* ignore */ }
      }
    } catch {
      // DB not available, try sessionStorage
      try {
        const raw = sessionStorage.getItem('sitesafe_scan_result')
        if (raw) {
          const result = JSON.parse(raw)
          setScans([{
            id: result.scannedAt || Date.now().toString(),
            url: result.url,
            score: result.score,
            issueCount: result.totalIssues,
            date: result.scannedAt,
          }])
        }
      } catch { /* ignore */ }
    } finally {
      setLoadingScans(false)
    }
  }, [user])

  useEffect(() => {
    loadScans()
  }, [loadScans])

  // Show payment success toast + refresh profile to pick up plan change
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      const planName = searchParams.get('plan')
      toast.success(
        planName
          ? `Payment successful! Your ${planName === 'compliance-shield' ? 'Compliance Shield' : 'Fix My Site'} plan is now active.`
          : 'Payment successful! Your plan has been upgraded.',
        { duration: 5000 }
      )
      const refresh = async () => {
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, i === 0 ? 500 : 2000))
          await refreshProfile()
        }
      }
      refresh()
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, refreshProfile])

  const handleQuickScan = (e: FormEvent) => {
    e.preventDefault()
    if (!quickUrl.trim()) return
    navigate(`/scan?url=${encodeURIComponent(quickUrl.trim())}`)
  }

  const handleDeleteScan = async (scanId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('scans').delete().eq('id', scanId)
      setScans(prev => prev.filter(s => s.id !== scanId))
      toast.success('Scan deleted')
    } catch {
      toast.error('Failed to delete scan')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      // Force navigate even if signOut fails
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">SiteSafe Dashboard</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </Link>

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
                  aria-label="Website URL to scan"
                  placeholder="yourwebsite.com"
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

        {/* Upgrade CTA for free users */}
        {!isPaid && (
          <div className={cn(
            'mb-8 rounded-xl border-2 border-primary-300',
            'bg-gradient-to-r from-primary-50 via-white to-primary-50 px-6 py-5'
          )}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-5 w-5 text-primary-600" />
                  <p className="text-lg font-bold text-gray-900">Unlock all fixes for $49</p>
                </div>
                <p className="text-sm text-gray-600">
                  Get every code fix, your Accessibility Audit Report, and an "ADA Tested" badge — one-time payment.
                </p>
              </div>
              <Link to="/checkout?plan=fix-my-site">
                <Button variant="primary" size="md" className="gap-2 shadow-md whitespace-nowrap">
                  Fix My Site
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
              <span>All issues with code fixes</span>
              <span>·</span>
              <span>Audit Report (PDF)</span>
              <span>·</span>
              <span>"ADA Tested" badge</span>
              <span>·</span>
              <span>vs $10,000+ lawsuit</span>
            </div>
          </div>
        )}

        {/* Scan history */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <TrendingUp className="h-4 w-4 text-primary-600" />
                Scan History
                {scans.length > 0 && (
                  <span className="text-sm font-normal text-gray-400">({scans.length})</span>
                )}
              </h2>
              <Button size="sm" variant="outline" onClick={() => navigate('/scan')}>
                <PlusCircle className="mr-1.5 h-4 w-4" />
                New Scan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingScans ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : scans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <Globe className="h-7 w-7 text-gray-400" />
                </div>
                <h3 className="mb-1 text-base font-semibold text-gray-900">No scans yet</h3>
                <p className="mb-6 max-w-sm text-sm text-gray-500">
                  Run your first scan to see how your website scores for ADA compliance.
                </p>
                <Button variant="primary" onClick={() => navigate('/scan')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Scan my website
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {scans.map((scan) => (
                  <div key={scan.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    {/* Score circle */}
                    <div className={cn(
                      'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2',
                      scan.score >= 80 ? 'border-success-300' : scan.score >= 50 ? 'border-warning-300' : 'border-danger-300',
                      getScoreBg(scan.score),
                    )}>
                      <span className={cn('text-sm font-extrabold', getScoreColor(scan.score))}>
                        {scan.score}
                      </span>
                    </div>

                    {/* Site info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{getDomain(scan.url)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {scan.issueCount} issue{scan.issueCount !== 1 ? 's' : ''} · {formatDate(scan.date)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Link to={`/scan?url=${encodeURIComponent(scan.url)}`}>
                        <Button size="sm" variant="primary" className="gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </Link>
                      <Link to={`/scan?url=${encodeURIComponent(scan.url)}&rescan=1`}>
                        <Button size="sm" variant="ghost" className="gap-1">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-danger-600"
                        onClick={() => handleDeleteScan(scan.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
