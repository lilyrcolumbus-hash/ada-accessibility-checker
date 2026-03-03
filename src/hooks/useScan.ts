import { useState, useEffect, useCallback } from 'react'
const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)
import { runScan } from '@/scanner/engine'
import type { ScanResult } from '@/scanner/types'

const SESSION_KEY = 'sitesafe_scan_result'

async function fetchViaProxy(url: string): Promise<string> {
  // In dev mode, use the Vite CORS proxy middleware
  const proxyUrl = `/api/fetch-page?url=${encodeURIComponent(url)}`
  const response = await fetch(proxyUrl)

  if (!response.ok) {
    // Fallback to direct fetch (works if target allows CORS)
    const directResponse = await fetch(url, {
      headers: { Accept: 'text/html,application/xhtml+xml' },
    })
    if (!directResponse.ok) {
      throw new Error(`Failed to fetch page: ${directResponse.status} ${directResponse.statusText}`)
    }
    return directResponse.text()
  }

  const data = await response.json()
  if (data.error) throw new Error(data.error)
  return data.html
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
        if (!url || parsed.url === url) {
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

    try {
      let html: string

      // 1. Try Supabase edge function first (avoids CORS)
      if (isSupabaseConfigured) {
        try {
          const { supabase } = await import('@/lib/supabase')
          const { data, error: fnError } = await supabase.functions.invoke('scan', {
            body: { url: normalised },
          })

          if (fnError) throw fnError
          if (!data?.html) throw new Error('No HTML returned from edge function')

          html = data.html as string
        } catch (edgeError) {
          console.warn('Edge function unavailable, trying proxy:', edgeError)
          html = await fetchViaProxy(normalised)
        }
      } else {
        // No Supabase — use dev proxy or direct fetch
        html = await fetchViaProxy(normalised)
      }

      // 3. Run the scanner
      const scanResult = await runScan(html, normalised)

      // 4. Persist to sessionStorage
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(scanResult))
      } catch {
        // quota exceeded — skip
      }

      // 5. Save to DB if authenticated
      if (isSupabaseConfigured) {
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
      }

      setResult(scanResult)
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'An unexpected error occurred. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, result, error, startScan }
}
