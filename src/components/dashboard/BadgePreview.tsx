import { useState } from 'react'
import { Copy, Check, Shield } from 'lucide-react'
import Button from '@/components/ui/Button'

interface BadgePreviewProps {
  domain: string
  score: number
  badgeToken: string
}

export default function BadgePreview({ domain, score, badgeToken }: BadgePreviewProps) {
  const [copied, setCopied] = useState(false)

  const badgeUrl = `${window.location.origin}/badge/${badgeToken}`
  const embedCode = `<a href="${badgeUrl}" target="_blank" rel="noopener">
  <img src="${badgeUrl}/image" alt="SiteSafe Accessibility Verified" width="160" height="40" />
</a>`

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Compliance Badge</h3>

      {/* Badge preview */}
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg mb-4">
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
          <Shield className="h-5 w-5 text-primary-600" />
          <div>
            <div className="text-xs font-bold text-gray-900">SiteSafe Verified</div>
            <div className="text-[10px] text-gray-500">Score: {score}/100</div>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Add this badge to your website to show visitors you take accessibility seriously.
      </p>

      {/* Embed code */}
      <div className="relative">
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
          {embedCode}
        </pre>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Badge links to a verification page showing your latest scan score for {domain}.
      </p>
    </div>
  )
}
