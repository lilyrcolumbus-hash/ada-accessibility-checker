import { useState, useEffect, useCallback } from 'react'
const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)
import { runScan } from '@/scanner/engine'
import type { ScanResult } from '@/scanner/types'

const SESSION_KEY = 'sitesafe_scan_result'

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ])
}

async function fetchViaProxy(url: string): Promise<string> {
  const proxyUrl = `/api/fetch-page?url=${encodeURIComponent(url)}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(proxyUrl, { signal: controller.signal })
    clearTimeout(timer)

    if (!response.ok) {
      throw new Error(`Proxy returned ${response.status}`)
    }

    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.html
  } catch {
    clearTimeout(timer)
    // Fallback to direct fetch (works if target allows CORS)
    const controller2 = new AbortController()
    const timer2 = setTimeout(() => controller2.abort(), 10000)
    try {
      const directResponse = await fetch(url, {
        headers: { Accept: 'text/html,application/xhtml+xml' },
        signal: controller2.signal,
      })
      clearTimeout(timer2)
      if (!directResponse.ok) {
        throw new Error(`Failed to fetch page: ${directResponse.status} ${directResponse.statusText}`)
      }
      return directResponse.text()
    } catch (err) {
      clearTimeout(timer2)
      throw err
    }
  }
}

interface UseScanReturn {
  loading: boolean
  result: ScanResult | null
  error: string | null
  startScan: (url: string) => Promise<void>
}

export function useScan(url?: string): UseScanReturn {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load result from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        const parsed: ScanResult = JSON.parse(stored)
        // Only restore if it matches the requested url (or no url specified)
        // Normalise for comparison: raw url may lack protocol
        const normalisedUrl = url && !url.startsWith('http') ? `https://${url}` : url
        if (!normalisedUrl || parsed.url === normalisedUrl) {
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

    // Normalise URL
    const normalised = targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
      ? targetUrl
      : `https://${targetUrl}`

    // Global safety timeout — NEVER let the scan hang more than 30s
    const globalTimeout = setTimeout(() => {
      console.error('[SiteSafe] Global 30s timeout fired — scan hung somewhere')
      setError('Scan timed out. The website may be too slow or blocking our scanner. Please try again.')
      setLoading(false)
    }, 30000)

    try {
      let html: string

      // 1. Try Supabase edge function first (avoids CORS) — 15s timeout
      if (isSupabaseConfigured) {
        try {
          console.log('[SiteSafe] Calling edge function for:', normalised)
          const { supabase } = await import('@/lib/supabase')
          const { data, error: fnError } = await withTimeout(
            supabase.functions.invoke('scan', { body: { url: normalised } }),
            15000,
            'Edge function'
          )

          if (fnError) throw fnError

          // supabase.functions.invoke may return data as string if Content-Type isn't detected
          let parsed = data
          if (typeof data === 'string') {
            try { parsed = JSON.parse(data) } catch { /* already parsed */ }
          }

          if (!parsed?.html) {
            console.error('[SiteSafe] Edge function returned unexpected data:', typeof data, data ? Object.keys(data) : 'null')
            throw new Error('No HTML returned from edge function')
          }

          html = parsed.html as string
          console.log('[SiteSafe] Got HTML from edge function, length:', html.length)
        } catch (edgeError) {
          console.warn('[SiteSafe] Edge function failed, trying proxy:', edgeError)
          html = await fetchViaProxy(normalised)
        }
      } else {
        html = await fetchViaProxy(normalised)
      }

      // 3. Run the scanner
      console.log('[SiteSafe] Running scanner on HTML...')
      const scanResult = await runScan(html, normalised)
      console.log('[SiteSafe] Scan complete. Score:', scanResult.score, 'Issues:', scanResult.totalIssues)

      // 4. Persist to sessionStorage
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(scanResult))
      } catch {
        // quota exceeded — skip
      }

      // 5. Show results IMMEDIATELY — don't wait for DB
      setResult(scanResult)

      // 6. Save to DB in background (fire and forget — never blocks UI)
      if (isSupabaseConfigured) {
        (async () => {
          try {
            const { supabase } = await import('@/lib/supabase')
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              await supabase.from('scans').insert({
                user_id: user.id,
                url: normalised,
                domain: new URL(normalised).hostname,
                score: scanResult.score,
                total_issues: scanResult.totalIssues,
                critical_count: scanResult.criticalCount,
                serious_count: scanResult.seriousCount,
                moderate_count: scanResult.moderateCount,
                minor_count: scanResult.minorCount,
                results: scanResult,
                scan_duration_ms: scanResult.scanDurationMs,
              })
            }
          } catch {
            // DB save failed — not critical
          }
        })()
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
  }, [])

  return { loading, result, error, startScan }
}
