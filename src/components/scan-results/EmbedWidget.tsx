import { useState } from 'react'
import { Copy, Check, Shield, Code } from 'lucide-react'
import Button from '@/components/ui/Button'

interface EmbedWidgetProps {
  domain: string
  score: number
}

export default function EmbedWidget({ domain, score }: EmbedWidgetProps) {
  const [copied, setCopied] = useState(false)

  const scanUrl = `https://ada-accessibility-checker.pages.dev/scan?url=https://${domain}`
  const scoreColor = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'

  const embedCode = `<!-- SiteSafe ADA Compliance Badge -->
<a href="${scanUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:8px 14px;text-decoration:none;font-family:system-ui,sans-serif;box-shadow:0 1px 2px rgba(0,0,0,.05);">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  <span style="display:flex;flex-direction:column;">
    <span style="font-size:11px;font-weight:700;color:#111;">ADA Tested by SiteSafe</span>
    <span style="font-size:10px;color:${scoreColor};font-weight:600;">Score: ${score}/100</span>
  </span>
</a>`

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
        <Code className="h-4 w-4 text-primary-600" />
        Free: Add Trust Badge to Your Site
      </h3>

      <p className="text-xs text-gray-500 mb-3">
        Show visitors you take accessibility seriously. Paste this code anywhere on your website.
      </p>

      {/* Badge preview */}
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg mb-3">
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3.5 py-2 shadow-sm">
          <Shield className="h-5 w-5 text-primary-600" />
          <div>
            <div className="text-[11px] font-bold text-gray-900">ADA Tested by SiteSafe</div>
            <div className="text-[10px] font-semibold" style={{ color: scoreColor }}>Score: {score}/100</div>
          </div>
        </div>
      </div>

      {/* Embed code */}
      <div className="relative">
        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-[10px] overflow-x-auto leading-relaxed max-h-28">
          {embedCode}
        </pre>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1.5 right-1.5 text-gray-400 hover:text-white"
          onClick={handleCopy}
        >
          {copied ? (
            <span className="flex items-center gap-1 text-success-400 text-xs">
              <Check className="h-3.5 w-3.5" /> Copied!
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs">
              <Copy className="h-3.5 w-3.5" /> Copy
            </span>
          )}
        </Button>
      </div>

      <p className="text-[10px] text-gray-400 mt-2">
        When visitors click the badge, they can scan their own site — bringing you referral traffic.
      </p>
    </div>
  )
}
