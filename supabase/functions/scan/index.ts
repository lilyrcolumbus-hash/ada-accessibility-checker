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

    // Fetch the page HTML (10s timeout)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    let response: Response
    try {
      response = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'SiteSafe Accessibility Scanner/1.0',
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
        signal: controller.signal,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Timeout: page took too long to load (>10s)' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw fetchError
    }
    clearTimeout(timeoutId)

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch page: HTTP ${response.status}` }),
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
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
