import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const ZONE_ID = "db247e1196945180238264b265a63f71"

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const CF_TOKEN = Deno.env.get("CLOUDFLARE_ANALYTICS_TOKEN") ?? ""
  if (!CF_TOKEN) {
    return new Response(JSON.stringify({ error: "No Cloudflare token" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const today = new Date()
  const dateEnd = today.toISOString().split("T")[0]
  const dateStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const query = `{
    viewer {
      zones(filter: {zoneTag: "${ZONE_ID}"}) {
        daily: httpRequests1dGroups(
          limit: 31
          filter: {date_geq: "${dateStart}", date_leq: "${dateEnd}"}
          orderBy: [date_ASC]
        ) {
          dimensions { date }
          sum { requests pageViews }
          uniq { uniques }
        }
      }
    }
  }`

  try {
    const resp = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    })

    const data = await resp.json()
    const daily = data?.data?.viewer?.zones?.[0]?.daily ?? []

    // Calculate totals
    const todayStr = dateEnd
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    let visitsToday = 0, visitsWeek = 0, visitsMonth = 0
    let viewsToday = 0, viewsWeek = 0, viewsMonth = 0

    for (const row of daily) {
      const d = row.dimensions.date
      const visits = row.uniq?.uniques ?? 0
      const views = row.sum?.pageViews ?? 0
      if (d >= monthAgo) { visitsMonth += visits; viewsMonth += views }
      if (d >= weekAgo)  { visitsWeek  += visits; viewsWeek  += views }
      if (d === todayStr) { visitsToday = visits;  viewsToday  = views }
    }

    return new Response(JSON.stringify({
      totals: { visitsToday, visitsWeek, visitsMonth, viewsToday, viewsWeek, viewsMonth },
      daily,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
