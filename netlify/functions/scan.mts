import type { Context } from "@netlify/functions"

export default async (req: Request, _context: Context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`)
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Block internal/local URLs
    const hostname = parsedUrl.hostname
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local")
    ) {
      return new Response(
        JSON.stringify({ error: "Cannot scan local or internal URLs" }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Fetch the page HTML (15s timeout)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    let response: Response
    try {
      response = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "SiteSafe Accessibility Scanner/1.0",
          "Accept": "text/html,application/xhtml+xml",
        },
        redirect: "follow",
        signal: controller.signal,
      })
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "Timeout: page took too long to load (>15s)" }),
          { status: 504, headers: corsHeaders }
        )
      }
      throw fetchError
    }
    clearTimeout(timeoutId)

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch page: HTTP ${response.status}` }),
        { status: 502, headers: corsHeaders }
      )
    }

    const html = await response.text()

    // Limit HTML size to 5MB
    if (html.length > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Page is too large to scan (>5MB)" }),
        { status: 400, headers: corsHeaders }
      )
    }

    return new Response(
      JSON.stringify({ html, finalUrl: response.url }),
      { headers: corsHeaders }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: corsHeaders }
    )
  }
}
