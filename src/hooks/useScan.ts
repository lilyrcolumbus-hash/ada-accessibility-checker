import { useState, useEffect, useCallback } from 'react'
import { runScan } from '@/scanner/engine'
import type { ScanResult } from '@/scanner/types'

const SESSION_KEY = 'sitesafe_scan_result'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

async function fetchHtml(url: string): Promise<string> {
  // 1. Try Supabase Edge Function (primary — works from any hosting provider)
  if (SUPABASE_URL) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      })
      clearTimeout(timer)

      // If we got a structured response (JSON), trust the server's error message —
      // it knows whether it was DNS, 403, timeout, etc. Don't fall through.
      const data = await response.json().catch(() => null)
      if (data && data.html) return data.html
      if (data && data.error) throw new Error(data.error)
      throw new Error(`Scanner returned ${response.status} with no details`)
    } catch (err) {
      clearTimeout(timer)
      // Only fall through to dev proxy for network-level failures (no response).
      // If the edge function gave us a real error message, propagate it as-is.
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

  // 2. Try local dev proxy (only works in dev mode with vite)
  try {
    const proxyUrl = `/api/fetch-page?url=${encodeURIComponent(url)}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    const response = await fetch(proxyUrl, { signal: controller.signal })
    clearTimeout(timer)

    if (response.ok) {
      const data = await response.json()
      if (data.html) return data.html
    }
  } catch {
    // Proxy not available
  }

  throw new Error(
    'Could not reach our scanner. Check your internet connection and try again.'
  )
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
        if (!url) return // Don't restore stale results when no URL is specified
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
      // 1. Fetch the page HTML (edge function → dev proxy → direct)
      const html = await fetchHtml(normalised)

      // 2. Run the scanner
      const scanResult = await runScan(html, normalised)

      // 3. Persist to sessionStorage
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(scanResult))
      } catch {
        // quota exceeded — skip
      }

      // 4. Show results IMMEDIATELY — don't wait for DB
      setResult(scanResult)

      // 5. Save to DB in background (fire and forget — never blocks UI)
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
