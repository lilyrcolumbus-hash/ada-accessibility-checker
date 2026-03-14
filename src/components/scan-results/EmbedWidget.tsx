import { useState } from 'react'
import { Copy, Check, Shield, Gift, ExternalLink } from 'lucide-react'
import Button from '@/components/ui/Button'

interface EmbedWidgetProps {
  domain: string
  score: number
}

export default function EmbedWidget({ domain, score }: EmbedWidgetProps) {
  const [copiedHtml, setCopiedHtml] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const scanUrl = `https://ada-accessibility-checker.pages.dev/scan?url=https://${domain}`
  const scoreColor = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const scoreLabel = score >= 80 ? 'Excellent' : score >= 50 ? 'Needs Work' : 'At Risk'
  const scoreBgClass = score >= 80 ? 'from-success-500 to-success-600' : score >= 50 ? 'from-warning-400 to-warning-500' : 'from-danger-500 to-danger-600'

  const embedCode = `<!-- SiteSafe ADA Compliance Badge -->
<a href="${scanUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,#1e40af,#2563eb);border-radius:10px;padding:10px 16px;text-decoration:none;font-family:system-ui,sans-serif;box-shadow:0 2px 8px rgba(37,99,235,.3);">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  <span style="display:flex;flex-direction:column;">
    <span style="font-size:12px;font-weight:700;color:#fff;">ADA Tested by SiteSafe</span>
    <span style="font-size:11px;color:rgba(255,255,255,.85);font-weight:500;">Score: ${score}/100 · ${scoreLabel}</span>
  </span>
</a>`

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(embedCode)
    setCopiedHtml(true)
    setTimeout(() => setCopiedHtml(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(scanUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="rounded-xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
          <Gift className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Your Free Compliance Badge</h3>
          <p className="text-[10px] text-gray-500">A gift from SiteSafe — included with your plan</p>
        </div>
      </div>
      <p className="text-xs text-gray-600 mb-3">
        Show your customers you care about accessibility. Share your badge anywhere — your website, social media, or emails.
      </p>

      {/* Badge preview — large and eye-catching */}
      <div className="flex items-center justify-center p-5 bg-white rounded-xl border border-gray-200 mb-4 shadow-inner">
        <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${scoreBgClass} rounded-xl px-5 py-3 shadow-lg`}>
          <Shield className="h-7 w-7 text-white" />
          <div>
            <div className="text-[13px] font-bold text-white">ADA Tested by SiteSafe</div>
            <div className="text-[11px] text-white/85 font-medium">Score: {score}/100 · {scoreLabel}</div>
          </div>
        </div>
      </div>

      {/* Option 1: Simple link */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          Easy: Share this link
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={scanUrl}
            className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 truncate"
          />
          <Button
            size="sm"
            variant={copiedLink ? 'primary' : 'outline'}
            onClick={handleCopyLink}
            className="flex-shrink-0"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Option 2: HTML embed */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
          {'</>'}
          Pro: Embed badge on your site
        </p>
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-[10px] overflow-x-auto leading-relaxed max-h-24">
            {embedCode}
          </pre>
          <button
            onClick={handleCopyHtml}
            className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-md bg-gray-700 px-2 py-1 text-[10px] font-medium text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
          >
            {copiedHtml ? (
              <><Check className="h-3 w-3 text-green-400" /> Copied!</>
            ) : (
              <><Copy className="h-3 w-3" /> Copy HTML</>
            )}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-primary-600/70 mt-3 font-medium text-center">
        This badge is free forever as a thank you for choosing SiteSafe
      </p>
    </div>
  )
}
