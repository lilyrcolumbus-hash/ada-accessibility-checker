export default async (req: Request) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Content-Type": "application/json",
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers })
  }

  try {
    const body = await req.json()
    const url = body?.url

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers,
      })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`)
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL format" }), {
        status: 400,
        headers,
      })
    }

    const hostname = parsedUrl.hostname
    if (["localhost", "127.0.0.1"].includes(hostname) || hostname.endsWith(".local")) {
      return new Response(JSON.stringify({ error: "Cannot scan local URLs" }), {
        status: 400,
        headers,
      })
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "SiteSafe Accessibility Scanner/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    }).catch((err: Error) => {
      clearTimeout(timer)
      if (err.name === "AbortError") {
        throw new Error("Timeout: page took too long to load")
      }
      throw err
    })

    clearTimeout(timer)

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch page: HTTP ${response.status}` }),
        { status: 502, headers }
      )
    }

    const html = await response.text()

    if (html.length > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Page too large (>5MB)" }), {
        status: 400,
        headers,
      })
    }

    return new Response(JSON.stringify({ html, finalUrl: response.url }), { headers })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers })
  }
}

export const config = {
  path: "/.netlify/functions/scan",
}
