import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_SCANS_PER_HOUR = 20

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
    // If rate limiting fails, allow the request
    return true
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || 'unknown'
    const allowed = await checkRateLimit(ip)
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { url } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Block internal/local URLs
    const hostname = parsedUrl.hostname
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('fc') || hostname.startsWith('fd') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') || hostname.startsWith('172.17.') || hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') || hostname.startsWith('172.20.') || hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') || hostname.startsWith('172.23.') || hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') || hostname.startsWith('172.26.') || hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') || hostname.startsWith('172.29.') || hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.') ||
      hostname.startsWith('169.254.') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return new Response(
        JSON.stringify({ error: 'Cannot scan local or internal URLs' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the page HTML (15s timeout) — present as a real browser to avoid WAF blocks
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const browserHeaders = {
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

    let response: Response
    try {
      response = await fetch(parsedUrl.toString(), {
        headers: browserHeaders,
        redirect: 'follow',
        signal: controller.signal,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Timeout: this website took too long to respond (>15s). It may be slow or temporarily down.' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      // Categorize network-level failures by error message so users see why
      const msg = fetchError instanceof Error ? fetchError.message.toLowerCase() : ''
      let userMessage = 'Could not reach this website. It may be temporarily down.'
      let status = 502
      if (msg.includes('dns') || msg.includes('lookup address') || msg.includes('name resolution')) {
        userMessage = `This website does not exist or the domain "${parsedUrl.hostname}" cannot be found. Check the URL for typos and confirm the site is still online.`
        status = 404
      } else if (msg.includes('connection refused') || msg.includes('tcp connect')) {
        userMessage = `The server for "${parsedUrl.hostname}" is refusing connections. The website may be down or the server is offline.`
        status = 502
      } else if (msg.includes('connection reset') || msg.includes('connection closed')) {
        userMessage = `The server for "${parsedUrl.hostname}" closed the connection unexpectedly. The site may be unstable or blocking automated traffic.`
        status = 502
      } else if (msg.includes('certificate') || msg.includes('tls') || msg.includes('ssl')) {
        userMessage = `This website has an invalid or expired SSL certificate, so we cannot connect securely.`
        status = 502
      } else if (msg.includes('unreachable') || msg.includes('no route')) {
        userMessage = `This website's server is unreachable from our network.`
        status = 502
      }
      return new Response(
        JSON.stringify({ error: userMessage }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    clearTimeout(timeoutId)

    if (!response.ok) {
      // More specific errors for common WAF/auth blocks
      let errorMessage = `Failed to fetch page: HTTP ${response.status}`
      if (response.status === 403) {
        errorMessage = 'This site is blocking automated scans (403 Forbidden). Try a different page or contact the site owner.'
      } else if (response.status === 401) {
        errorMessage = 'This page requires authentication and cannot be scanned publicly.'
      } else if (response.status === 429) {
        errorMessage = 'The target site is rate-limiting us. Try again in a few minutes.'
      } else if (response.status === 404) {
        errorMessage = 'Page not found (404). Check the URL and try again.'
      } else if (response.status >= 500) {
        errorMessage = `The site is returning a server error (${response.status}). Try again later.`
      }
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return new Response(
        JSON.stringify({ error: 'URL does not point to an HTML page' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const html = await response.text()

    // Limit HTML size to 5MB
    if (html.length > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Page is too large to scan (>5MB)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ html, finalUrl: response.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
