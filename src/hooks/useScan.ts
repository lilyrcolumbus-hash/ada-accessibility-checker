import { useState, useEffect, useCallback, useRef } from 'react'
import { runScan } from '@/scanner/engine'
import type { ScanResult, ScanIssue, PageScanError } from '@/scanner/types'
import { useSubscription } from '@/hooks/useSubscription'

const SESSION_KEY = 'sitesafe_scan_result'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

const PAID_MAX_PAGES = 25
const FREE_MAX_PAGES = 1
// Total budget for the entire crawl + scan. Crawl alone has its own server-side budget.
const GLOBAL_TIMEOUT_MS = 90_000
// Hard cap for each post-scan DB write so the badge/share UI can never hang forever.
const PERSIST_TIMEOUT_MS = 15_000

// Reject if a thenable (e.g. a Supabase query builder) does not settle in time.
// Without this a stalled connection would leave the badge/share states pending
// indefinitely, showing a misleading "Generating…" spinner to paying users.
function withTimeout<T>(operation: PromiseLike<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms)
  })
  return Promise.race([Promise.resolve(operation), timeout]).finally(() =>
    clearTimeout(timer)
  )
}

interface ScannedPagePayload {
  url: string
  html?: string
  error?: string
}

interface FetchPagesResult {
  pages: ScannedPagePayload[]
  finalUrl: string
}

async function fetchPages(url: string, maxPages: number): Promise<FetchPagesResult> {
  if (SUPABASE_URL) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 80_000)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url, maxPages }),
        signal: controller.signal,
      })
      clearTimeout(timer)

      const data = await response.json().catch(() => null)
      if (data && Array.isArray(data.pages) && data.pages.length > 0) {
        return { pages: data.pages, finalUrl: data.finalUrl || url }
      }
      // Backwards compat: older edge function returned { html, finalUrl } without pages[]
      if (data && data.html) {
        return { pages: [{ url: data.finalUrl || url, html: data.html }], finalUrl: data.finalUrl || url }
      }
      if (data && data.error) throw new Error(data.error)
      throw new Error(`Scanner returned ${response.status} with no details`)
    } catch (err) {
      clearTimeout(timer)
      const errorMessage = err instanceof Error ? err.message : String(err)
      const isNetworkLevel =
        err instanceof TypeError ||
        (err instanceof Error && err.name === 'AbortError')
      if (!isNetworkLevel) {
        throw new Error(errorMessage)
      }
      console.warn('[SiteSafe] Edge function unreachable, trying dev proxy:', err)
    }
  }

  // Dev proxy only fetches a single page — multi-page crawl needs the edge function
  try {
    const proxyUrl = `/api/fetch-page?url=${encodeURIComponent(url)}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)
    const response = await fetch(proxyUrl, { signal: controller.signal })
    clearTimeout(timer)

    if (response.ok) {
      const data = await response.json()
      if (data.html) return { pages: [{ url: data.finalUrl || url, html: data.html }], finalUrl: data.finalUrl || url }
    }
  } catch {
    // Proxy not available
  }

  throw new Error(
    'Could not reach our scanner. Check your internet connection and try again.'
  )
}

function aggregateScans(
  seedUrl: string,
  pages: ScannedPagePayload[],
  pageScans: { url: string; result: ScanResult }[],
  scanDurationMs: number
): ScanResult {
  const allIssues: ScanIssue[] = []
  const passedSets: string[][] = []
  const errors: PageScanError[] = []
  let critical = 0
  let serious = 0
  let moderate = 0
  let minor = 0

  for (const page of pages) {
    if (page.error || !page.html) {
      errors.push({ url: page.url, error: page.error || 'No HTML returned' })
    }
  }

  for (const { url, result } of pageScans) {
    for (const issue of result.issues) {
      allIssues.push({ ...issue, pageUrl: url })
    }
    passedSets.push(result.passedChecks)
    critical += result.criticalCount
    serious += result.seriousCount
    moderate += result.moderateCount
    minor += result.minorCount
  }

  const severityOrder: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 }
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  // passedChecks = intersection: a check only counts as passed if it passes on EVERY scanned page
  const passedChecks =
    passedSets.length === 0
      ? []
      : passedSets.reduce((acc, set) => acc.filter((id) => set.includes(id)))

  // Average page scores (each page already scored independently for fairness)
  const avgScore =
    pageScans.length === 0
      ? 0
      : Math.round(pageScans.reduce((sum, p) => sum + p.result.score, 0) / pageScans.length)

  return {
    url: seedUrl,
    scannedAt: new Date().toISOString(),
    score: avgScore,
    totalIssues: allIssues.length,
    criticalCount: critical,
    seriousCount: serious,
    moderateCount: moderate,
    minorCount: minor,
    issues: allIssues,
    passedChecks,
    scanDurationMs,
    pagesScanned: pageScans.length,
    pagesAttempted: pages.length,
    pageErrors: errors.length > 0 ? errors : undefined,
    // Flag from the seed page only — that's the one the user actually typed in.
    isLikelySPA: pageScans[0]?.result.isLikelySPA,
  }
}

interface UseScanReturn {
  loading: boolean
  result: ScanResult | null
  error: string | null
  scanId: string | null
  badgeToken: string | null
  // True once the post-scan persistence failed, so the UI can show a real error
  // (with a retry hint) instead of a spinner that never resolves.
  scanSaveError: boolean
  badgeError: boolean
  startScan: (url: string) => Promise<void>
}

export function useScan(url?: string): UseScanReturn {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanId, setScanId] = useState<string | null>(null)
  const [badgeToken, setBadgeToken] = useState<string | null>(null)
  const [scanSaveError, setScanSaveError] = useState(false)
  const [badgeError, setBadgeError] = useState(false)
  const { isPaid } = useSubscription()

  // The post-scan persistence is fire-and-forget and can settle up to
  // PERSIST_TIMEOUT_MS after the user navigates away. Guard state writes so we
  // never call setState on an unmounted hook.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        const parsed: ScanResult = JSON.parse(stored)
        if (!url) return
        const normalisedUrl = url.startsWith('http') ? url : `https://${url}`
        if (parsed.url === normalisedUrl) {
          setResult(parsed)
        }
      }
    } catch {
      // sessionStorage not available or invalid JSON — ignore
    }
  }, [url])

  const startScan = useCallback(async (targetUrl: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setScanId(null)
    setBadgeToken(null)
    setScanSaveError(false)
    setBadgeError(false)

    const normalised = targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
      ? targetUrl
      : `https://${targetUrl}`

    const maxPages = isPaid ? PAID_MAX_PAGES : FREE_MAX_PAGES

    const globalTimeout = setTimeout(() => {
      console.error(`[SiteSafe] Global ${GLOBAL_TIMEOUT_MS / 1000}s timeout fired — scan hung somewhere`)
      setError('Scan timed out. The website may be too slow or blocking our scanner. Please try again.')
      setLoading(false)
    }, GLOBAL_TIMEOUT_MS)

    const startTime = performance.now()

    try {
      const { pages, finalUrl } = await fetchPages(normalised, maxPages)

      const pageScans: { url: string; result: ScanResult }[] = []
      for (const page of pages) {
        if (!page.html) continue
        try {
          const result = await runScan(page.html, page.url)
          pageScans.push({ url: page.url, result })
        } catch (e) {
          console.warn('[SiteSafe] Failed to scan page:', page.url, e)
        }
      }

      if (pageScans.length === 0) {
        throw new Error('No pages could be scanned. The site may be unreachable.')
      }

      const aggregated = aggregateScans(
        finalUrl || normalised,
        pages,
        pageScans,
        Math.round(performance.now() - startTime)
      )

      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(aggregated))
      } catch {
        // quota exceeded — skip
      }

      setResult(aggregated)

      if (isSupabaseConfigured) {
        // Persist the scan + (for paid users) generate the badge in the background.
        // The scan result is already shown; these power history, sharing and the badge.
        // Scan-save and badge-generation are handled independently so one failing
        // doesn't mask the other, and BOTH flip a visible error flag on failure so
        // the UI never shows a perpetual "Saving…" / "Generating…" spinner.
        (async () => {
          const { supabase } = await import('@/lib/supabase')
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            // Paid UI is showing (isPaid from a cached profile) but the session is
            // gone — expired token, or the project auto-paused. Without this, the
            // badge/share spinners would hang forever: the exact bug we're fixing.
            if (isPaid && mountedRef.current) {
              setScanSaveError(true)
              setBadgeError(true)
            }
            return
          }

          const domain = new URL(aggregated.url).hostname

          try {
            const { data: inserted, error: insertError } = await withTimeout(
              supabase
                .from('scans')
                .insert({
                  user_id: user.id,
                  url: aggregated.url,
                  domain,
                  score: aggregated.score,
                  total_issues: aggregated.totalIssues,
                  critical_count: aggregated.criticalCount,
                  serious_count: aggregated.seriousCount,
                  moderate_count: aggregated.moderateCount,
                  minor_count: aggregated.minorCount,
                  results: aggregated,
                  scan_duration_ms: aggregated.scanDurationMs,
                })
                .select('id')
                .single(),
              PERSIST_TIMEOUT_MS,
              'Saving scan'
            )
            if (insertError || !inserted?.id) {
              throw new Error(insertError?.message || 'Scan row was not created')
            }
            if (mountedRef.current) setScanId(inserted.id as string)
          } catch (e) {
            console.error('[SiteSafe] Failed to save scan:', e)
            if (mountedRef.current) setScanSaveError(true)
          }

          if (isPaid) {
            try {
              const { data: token, error: badgeErr } = await withTimeout(
                supabase.rpc('upsert_badge', {
                  domain_param: domain,
                  score_param: aggregated.score,
                }),
                PERSIST_TIMEOUT_MS,
                'Generating badge'
              )
              if (badgeErr || typeof token !== 'string') {
                throw new Error(badgeErr?.message || 'Badge token was not returned')
              }
              if (mountedRef.current) setBadgeToken(token)
            } catch (e) {
              console.error('[SiteSafe] Failed to generate badge:', e)
              if (mountedRef.current) setBadgeError(true)
            }
          }
        })().catch((e) => {
          // auth/import failed before we even got to the writes — surface, don't hang.
          console.error('[SiteSafe] Post-scan persistence failed to start:', e)
          if (!mountedRef.current) return
          setScanSaveError(true)
          if (isPaid) setBadgeError(true)
        })
      }
    } catch (err) {
      console.error('[SiteSafe] Scan failed with error:', err)
      const message = err instanceof Error
        ? err.message
        : 'An unexpected error occurred. Please try again.'
      setError(message)
    } finally {
      clearTimeout(globalTimeout)
      setLoading(false)
    }
  }, [isPaid])

  return { loading, result, error, scanId, badgeToken, scanSaveError, badgeError, startScan }
}
