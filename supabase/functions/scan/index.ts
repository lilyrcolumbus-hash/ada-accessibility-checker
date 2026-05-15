import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_SCANS_PER_HOUR = 20
const MAX_PAGES_CAP = 25
const SEED_TIMEOUT_MS = 15000
const PAGE_TIMEOUT_MS = 8000
const BATCH_SIZE = 5
const MAX_HTML_BYTES = 5 * 1024 * 1024

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
}

interface ScannedPage {
  url: string
  html?: string
  error?: string
}

async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('scan_usage')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('period_start', oneHourAgo)

    if ((count ?? 0) >= MAX_SCANS_PER_HOUR) return false

    await supabase.from('scan_usage').insert({ ip_address: ip, scan_count: 1, period_start: new Date().toISOString() })
    return true
  } catch {
    return true
  }
}

function isBlockedHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.startsWith('fc') || hostname.startsWith('fd') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname) ||
    hostname.startsWith('169.254.') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  )
}

function categorizeFetchError(err: unknown, hostname: string): { message: string; status: number } {
  if (err instanceof Error && err.name === 'AbortError') {
    return { message: 'Timeout: this website took too long to respond (>15s). It may be slow or temporarily down.', status: 504 }
  }
  const msg = err instanceof Error ? err.message.toLowerCase() : ''
  if (msg.includes('dns') || msg.includes('lookup address') || msg.includes('name resolution')) {
    return { message: `This website does not exist or the domain "${hostname}" cannot be found. Check the URL for typos and confirm the site is still online.`, status: 404 }
  }
  if (msg.includes('connection refused') || msg.includes('tcp connect')) {
    return { message: `The server for "${hostname}" is refusing connections. The website may be down or the server is offline.`, status: 502 }
  }
  if (msg.includes('connection reset') || msg.includes('connection closed')) {
    return { message: `The server for "${hostname}" closed the connection unexpectedly. The site may be unstable or blocking automated traffic.`, status: 502 }
  }
  if (msg.includes('certificate') || msg.includes('tls') || msg.includes('ssl')) {
    return { message: 'This website has an invalid or expired SSL certificate, so we cannot connect securely.', status: 502 }
  }
  if (msg.includes('unreachable') || msg.includes('no route')) {
    return { message: "This website's server is unreachable from our network.", status: 502 }
  }
  return { message: 'Could not reach this website. It may be temporarily down.', status: 502 }
}

function httpStatusToMessage(status: number): string {
  if (status === 403) return 'This site is blocking automated scans (403 Forbidden). Try a different page or contact the site owner.'
  if (status === 401) return 'This page requires authentication and cannot be scanned publicly.'
  if (status === 429) return 'The target site is rate-limiting us. Try again in a few minutes.'
  if (status === 404) return 'Page not found (404). Check the URL and try again.'
  if (status >= 500) return `The site is returning a server error (${status}). Try again later.`
  return `Failed to fetch page: HTTP ${status}`
}

async function fetchPage(targetUrl: string, timeoutMs: number): Promise<ScannedPage> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(targetUrl, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!response.ok) return { url: targetUrl, error: httpStatusToMessage(response.status) }
    const ct = response.headers.get('content-type') || ''
    if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
      return { url: targetUrl, error: 'URL does not point to an HTML page' }
    }
    const html = await response.text()
    if (html.length > MAX_HTML_BYTES) return { url: response.url, error: 'Page is too large to scan (>5MB)' }
    return { url: response.url, html }
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof Error && err.name === 'AbortError') return { url: targetUrl, error: 'Timeout' }
    return { url: targetUrl, error: err instanceof Error ? err.message : 'Fetch failed' }
  }
}

function extractInternalLinks(html: string, baseUrl: URL, limit: number): string[] {
  // Matches href in single or double quotes; tolerates whitespace around `=`.
  const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["']/gi
  const found: string[] = []
  const seen = new Set<string>()
  const baseNormalized = normalizeUrl(baseUrl.toString())
  seen.add(baseNormalized)

  let match: RegExpExecArray | null
  let scanned = 0
  while ((match = linkRegex.exec(html)) !== null && found.length < limit && scanned < limit * 50) {
    scanned++
    const rawHref = match[1].trim()
    if (!rawHref) continue
    if (rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:') || rawHref.startsWith('data:')) continue
    // Skip non-HTML asset extensions
    const path = rawHref.split('?')[0].split('#')[0]
    if (/\.(pdf|jpg|jpeg|png|gif|svg|webp|ico|zip|tar|gz|mp4|mp3|wav|css|js|json|xml|woff2?|ttf|eot|rss)$/i.test(path)) continue

    let resolved: URL
    try {
      resolved = new URL(rawHref, baseUrl)
    } catch {
      continue
    }
    if (!['http:', 'https:'].includes(resolved.protocol)) continue
    if (resolved.hostname !== baseUrl.hostname) continue
    resolved.hash = ''
    const norm = normalizeUrl(resolved.toString())
    if (seen.has(norm)) continue
    seen.add(norm)
    found.push(resolved.toString())
  }
  return found
}

function normalizeUrl(u: string): string {
  // Strip trailing slash for dedupe consistency. Keep query string (different params = different pages).
  return u.endsWith('/') ? u.slice(0, -1) : u
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || 'unknown'
    const allowed = await checkRateLimit(ip)
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { url, maxPages } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (isBlockedHostname(parsedUrl.hostname)) {
      return new Response(
        JSON.stringify({ error: 'Cannot scan local or internal URLs' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestedMax = Math.max(1, Math.min(MAX_PAGES_CAP, Number(maxPages) || 1))

    // Fetch the seed URL with full error categorization (these messages are user-facing)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), SEED_TIMEOUT_MS)

    let seedResponse: Response
    try {
      seedResponse = await fetch(parsedUrl.toString(), {
        headers: BROWSER_HEADERS,
        redirect: 'follow',
        signal: controller.signal,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const { message, status } = categorizeFetchError(fetchError, parsedUrl.hostname)
      return new Response(
        JSON.stringify({ error: message }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    clearTimeout(timeoutId)

    if (!seedResponse.ok) {
      return new Response(
        JSON.stringify({ error: httpStatusToMessage(seedResponse.status) }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const contentType = seedResponse.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return new Response(
        JSON.stringify({ error: 'URL does not point to an HTML page' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const seedHtml = await seedResponse.text()
    if (seedHtml.length > MAX_HTML_BYTES) {
      return new Response(
        JSON.stringify({ error: 'Page is too large to scan (>5MB)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const pages: ScannedPage[] = [{ url: seedResponse.url, html: seedHtml }]

    // Crawl additional pages if requested
    if (requestedMax > 1) {
      const seedFinalUrl = new URL(seedResponse.url)
      const links = extractInternalLinks(seedHtml, seedFinalUrl, requestedMax - 1)

      for (let i = 0; i < links.length; i += BATCH_SIZE) {
        const batch = links.slice(i, i + BATCH_SIZE)
        const results = await Promise.all(batch.map((link) => fetchPage(link, PAGE_TIMEOUT_MS)))
        pages.push(...results)
      }
    }

    return new Response(
      // Keep `html` + `finalUrl` for backwards compatibility with older frontend builds during deploy window
      JSON.stringify({ pages, finalUrl: seedResponse.url, html: seedHtml }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
