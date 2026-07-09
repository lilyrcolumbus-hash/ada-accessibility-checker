import { corsHeaders } from '../_shared/cors.ts'

interface ScanIssue {
  severity: string
  title: string
  description: string
  fixDescription: string
  codeBefore: string
  codeAfter: string
}

interface RequestBody {
  email: string
  url: string
  score: number
  criticalCount: number
  seriousCount: number
  totalIssues: number
  topIssue: ScanIssue | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Email not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: RequestBody = await req.json()
    const { email, url, score, criticalCount, seriousCount, totalIssues, topIssue } = body

    if (!email || !url) {
      return new Response(JSON.stringify({ error: 'Missing email or url' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    const scanUrl = `https://adalawsuitcheck.com/scan?url=${encodeURIComponent(url)}`
    const upgradeUrl = `https://adalawsuitcheck.com/register?plan=fix-my-site`

    const scoreLabel = score >= 90 ? 'Good' : score >= 70 ? 'Needs Work' : score >= 50 ? 'Poor' : 'Critical'
    const scoreColor = score >= 90 ? '#16a34a' : score >= 70 ? '#ca8a04' : score >= 50 ? '#ea580c' : '#dc2626'

    const urgencyLine = criticalCount > 0
      ? `Your site has <strong style="color:#dc2626">${criticalCount} critical violation${criticalCount !== 1 ? 's' : ''}</strong> — these are the ones that trigger lawsuits.`
      : `Your site has <strong>${totalIssues} accessibility issue${totalIssues !== 1 ? 's' : ''}</strong> that could expose you to legal risk.`

    const topIssueBlock = topIssue ? `
      <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:0.05em;">Top issue found</p>
        <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#1f2937;">${topIssue.title}</p>
        <p style="margin:0 0 12px;font-size:14px;color:#4b5563;">${topIssue.description}</p>
        <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#374151;">How to fix it:</p>
        <p style="margin:0;font-size:13px;color:#4b5563;">${topIssue.fixDescription}</p>
      </div>
    ` : ''

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:#1e40af;padding:24px 32px;">
      <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">SiteSafe</p>
      <p style="margin:4px 0 0;font-size:13px;color:#93c5fd;">ADA Accessibility Report for ${domain}</p>
    </div>

    <!-- Score -->
    <div style="padding:28px 32px 20px;border-bottom:1px solid #f3f4f6;">
      <p style="margin:0 0 12px;font-size:15px;color:#374151;">Your accessibility score:</p>
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="width:64px;height:64px;border-radius:50%;background:${scoreColor};display:flex;align-items:center;justify-content:center;">
          <span style="font-size:22px;font-weight:800;color:#fff;">${score}</span>
        </div>
        <div>
          <p style="margin:0;font-size:18px;font-weight:700;color:${scoreColor};">${scoreLabel}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${urgencyLine}</p>
        </div>
      </div>
    </div>

    <!-- Top issue -->
    <div style="padding:20px 32px;">
      ${topIssueBlock}
      <p style="margin:0 0 16px;font-size:14px;color:#4b5563;">
        The full report includes the exact code fix for every issue — copy, paste, done. No developer needed.
      </p>

      <!-- CTA -->
      <a href="${upgradeUrl}" style="display:block;text-align:center;background:#1e40af;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 24px;border-radius:8px;margin-bottom:12px;">
        Get All ${totalIssues} Fixes — $49 One-Time
      </a>
      <a href="${scanUrl}" style="display:block;text-align:center;color:#1e40af;text-decoration:none;font-size:13px;font-weight:500;padding:8px;">
        View your free scan results →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        You received this because you scanned ${domain} on SiteSafe.
        This is not legal advice — results are informational only.
        <br>SiteSafe · adalawsuitcheck.com
      </p>
    </div>
  </div>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lily from SiteSafe <lily@adalawsuitcheck.com>',
        to: [email],
        subject: `Your ${domain} accessibility report: score ${score}/100 (${totalIssues} issues found)`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-scan-followup error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
