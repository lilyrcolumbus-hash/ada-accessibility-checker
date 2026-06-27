import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const ZONE_ID    = "db247e1196945180238264b265a63f71"
const ACCOUNT_ID = "ae34fffdc22f7b4446e782a4188c9946"

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const CF_TOKEN = Deno.env.get("CLOUDFLARE_ANALYTICS_TOKEN") ?? ""
  if (!CF_TOKEN) return new Response(JSON.stringify({ error: "No token" }), {
    status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split("T")[0]
  const ago = (days: number) => { const d = new Date(today); d.setDate(d.getDate() - days); return d }

  const dateEnd      = fmt(today)
  const date30       = fmt(ago(30))
  const date7        = fmt(ago(7))
  const date14       = fmt(ago(14))
  const todayStr     = dateEnd
  const weekAgoStr   = fmt(ago(7))
  const monthStartStr = todayStr.slice(0, 7) + "-01"

  const gql = async (query: string) => {
    const r = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { "Authorization": `Bearer ${CF_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
    return r.json()
  }

  // ── 1. Zone analytics — daily unique visitors + page views (last 30 days) ──
  const zoneQ = `{
    viewer {
      zones(filter: {zoneTag: "${ZONE_ID}"}) {
        daily: httpRequests1dGroups(
          limit: 31
          filter: {date_geq: "${date30}", date_leq: "${dateEnd}"}
          orderBy: [date_ASC]
        ) { dimensions { date } sum { pageViews } uniq { uniques } }
      }
    }
  }`

  // ── 2. RUM — top pages + referrers (last 7 days, human traffic only) ──────
  const rumQ = `{
    viewer {
      accounts(filter: {accountTag: "${ACCOUNT_ID}"}) {
        topPages: rumPageloadEventsAdaptiveGroups(
          limit: 8
          filter: {date_geq: "${date7}", date_leq: "${dateEnd}"}
          orderBy: [count_DESC]
        ) { count dimensions { requestPath } }
        topRefs: rumPageloadEventsAdaptiveGroups(
          limit: 10
          filter: {date_geq: "${date7}", date_leq: "${dateEnd}"}
          orderBy: [count_DESC]
        ) { count dimensions { refererHost } }
      }
    }
  }`

  try {
    const [zoneData, rumData] = await Promise.all([gql(zoneQ), gql(rumQ)])

    const daily: Array<{ dimensions: { date: string }; sum: { pageViews: number }; uniq: { uniques: number } }> =
      zoneData?.data?.viewer?.zones?.[0]?.daily ?? []

    const topPagesRaw: Array<{ count: number; dimensions: { requestPath: string } }> =
      rumData?.data?.viewer?.accounts?.[0]?.topPages ?? []

    const topRefsRaw: Array<{ count: number; dimensions: { refererHost: string } }> =
      rumData?.data?.viewer?.accounts?.[0]?.topRefs ?? []

    // ── Totals from zone analytics ──────────────────────────────────────────
    let visitsToday = 0, visitsWeek = 0, visitsMonth = 0
    let viewsToday  = 0, viewsWeek  = 0, viewsMonth  = 0
    let visitsLastWeek = 0

    for (const row of daily) {
      const d      = row.dimensions.date
      const visits = row.uniq?.uniques ?? 0
      const views  = row.sum?.pageViews ?? 0
      if (d >= monthStartStr) { visitsMonth += visits; viewsMonth += views }
      if (d >= weekAgoStr)    { visitsWeek  += visits; viewsWeek  += views }
      if (d === todayStr)     { visitsToday  = visits; viewsToday  = views }
      if (d >= date14 && d < weekAgoStr) visitsLastWeek += visits
    }

    // ── Week vs week change ─────────────────────────────────────────────────
    const weekChange = visitsLastWeek > 0
      ? Math.round(((visitsWeek - visitsLastWeek) / visitsLastWeek) * 100)
      : null

    // ── Top pages (dedupe path, skip /outreach/) ────────────────────────────
    const topPages = topPagesRaw
      .filter(p => p.dimensions.requestPath !== "/outreach/")
      .slice(0, 6)
      .map(p => ({ path: p.dimensions.requestPath || "/", count: p.count }))

    // ── Top referrers (skip empty and self-referrals) ───────────────────────
    const refMap: Record<string, number> = {}
    for (const r of topRefsRaw) {
      const host = r.dimensions.refererHost
      if (!host || host === "adalawsuitcheck.com") continue
      refMap[host] = (refMap[host] ?? 0) + r.count
    }
    const directCount = topRefsRaw
      .filter(r => !r.dimensions.refererHost)
      .reduce((s, r) => s + r.count, 0)

    const topReferrers = [
      { source: "Direct / Unknown", count: directCount },
      ...Object.entries(refMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([source, count]) => ({ source, count })),
    ].filter(r => r.count > 0)

    return new Response(JSON.stringify({
      totals: { visitsToday, visitsWeek, visitsMonth, viewsToday, viewsWeek, viewsMonth, weekChange },
      daily,
      topPages,
      topReferrers,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
