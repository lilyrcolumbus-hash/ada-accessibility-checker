import { useState } from 'react'
import { Copy, Check, Shield, Gift, Code, Share2, Globe, Sparkles, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'

interface EmbedWidgetProps {
  domain: string
  score: number
  badgeToken: string | null
  scanId: string | null
  // Set when background persistence failed, so we show an actionable error
  // instead of a spinner that never resolves.
  scanSaveError?: boolean
  badgeError?: boolean
}

// navigator.clipboard.writeText() can hang indefinitely (never resolve OR
// reject) in some browser/permission contexts instead of failing fast — if
// awaited directly inside a try/finally, a hung write blocks the finally
// block forever, leaving a loading button stuck. Race it against a timeout
// so a stuck clipboard permission can never freeze the UI.
async function writeToClipboardWithTimeout(text: string, timeoutMs = 3000): Promise<void> {
  await Promise.race([
    navigator.clipboard.writeText(text),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('clipboard write timed out')), timeoutMs)),
  ])
}

export default function EmbedWidget({ domain, score, badgeToken, scanId, scanSaveError, badgeError }: EmbedWidgetProps) {
  const [copiedHtml, setCopiedHtml] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showHtml, setShowHtml] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [creatingShare, setCreatingShare] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const verifyUrl = badgeToken ? `${origin}/badge/${badgeToken}` : ''
  const shareUrl = shareToken ? `${origin}/shared/${shareToken}` : ''
  const scoreLabel = score >= 80 ? 'Excellent' : score >= 50 ? 'Needs Work' : 'At Risk'
  const scoreBgClass = score >= 80 ? 'from-success-500 to-success-600' : score >= 50 ? 'from-warning-400 to-warning-500' : 'from-danger-500 to-danger-600'

  const embedCode = badgeToken
    ? `<!-- SiteSafe ADA Compliance Badge -->
<a href="${verifyUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,#1e40af,#2563eb);border-radius:10px;padding:10px 16px;text-decoration:none;font-family:system-ui,sans-serif;box-shadow:0 2px 8px rgba(37,99,235,.3);">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  <span style="display:flex;flex-direction:column;">
    <span style="font-size:12px;font-weight:700;color:#fff;">ADA Tested by SiteSafe</span>
    <span style="font-size:11px;color:rgba(255,255,255,.85);font-weight:500;">Score: ${score}/100 · ${scoreLabel}</span>
  </span>
</a>`
    : ''

  const handleCopyHtml = async () => {
    if (!embedCode) return
    try {
      await writeToClipboardWithTimeout(embedCode)
      setCopiedHtml(true)
      setTimeout(() => setCopiedHtml(false), 2000)
    } catch { /* clipboard not available or timed out */ }
  }

  const handleCreateShareLink = async () => {
    if (!scanId) {
      setShareError('Share link will be available once your scan is saved. Please retry in a moment.')
      return
    }
    setCreatingShare(true)
    setShareError(null)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.rpc('create_shared_report', { scan_id_param: scanId })
      if (error || typeof data !== 'string') {
        throw new Error(error?.message || 'Could not create share link')
      }
      setShareToken(data)
      try {
        await writeToClipboardWithTimeout(`${origin}/shared/${data}`)
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      } catch { /* clipboard not available or timed out — link is already created and shown */ }
    } catch (e) {
      setShareError(e instanceof Error ? e.message : 'Could not create share link')
    } finally {
      setCreatingShare(false)
    }
  }

  const handleCopyShareLink = async () => {
    if (!shareUrl) return
    try {
      await writeToClipboardWithTimeout(shareUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch { /* clipboard not available or timed out */ }
  }

  return (
    <div className="rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 via-white to-primary-50/50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md flex-shrink-0">
          <Gift className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">Your Free Compliance Badge</h3>
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700 uppercase">Free Gift</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Included with your plan — yours to keep forever</p>
        </div>
      </div>

      {/* What it does — benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="flex items-start gap-2 rounded-lg bg-white border border-gray-100 p-3">
          <Sparkles className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gray-800">Build Trust</p>
            <p className="text-[10px] text-gray-500">Show customers you care about accessibility</p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-white border border-gray-100 p-3">
          <Shield className="h-4 w-4 text-success-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gray-800">Prove Compliance</p>
            <p className="text-[10px] text-gray-500">Display your ADA score publicly</p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-white border border-gray-100 p-3">
          <Globe className="h-4 w-4 text-warning-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gray-800">Stand Out</p>
            <p className="text-[10px] text-gray-500">Differentiate from competitors who ignore ADA</p>
          </div>
        </div>
      </div>

      {/* Badge preview */}
      <p className="text-xs font-semibold text-gray-700 mb-2">This is how your badge looks:</p>
      <div className="flex items-center justify-center p-5 bg-white rounded-xl border border-gray-200 mb-5">
        <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${scoreBgClass} rounded-xl px-6 py-3.5 shadow-lg`}>
          <Shield className="h-8 w-8 text-white" />
          <div>
            <div className="text-sm font-bold text-white">ADA Tested by SiteSafe</div>
            <div className="text-xs text-white/85 font-medium">Score: {score}/100 · {scoreLabel}</div>
          </div>
        </div>
      </div>

      {/* Option 1: Share link (lazy-generated) */}
      <div className="rounded-xl bg-white border border-gray-200 p-4 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Share2 className="h-4 w-4 text-primary-600" />
          <p className="text-sm font-semibold text-gray-800">Share your results</p>
        </div>
        <p className="text-xs text-gray-500 mb-2">
          Create a public, read-only link to your accessibility report. Share it with clients,
          your team, or post it anywhere — viewers see your score and issues without needing
          to re-scan {domain}.
        </p>

        {!shareToken ? (
          <Button
            size="sm"
            variant="primary"
            onClick={handleCreateShareLink}
            disabled={creatingShare || !scanId || scanSaveError}
            className="gap-1.5"
          >
            {creatingShare ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating link...</>
            ) : (
              <><Share2 className="h-3.5 w-3.5" /> Create share link</>
            )}
          </Button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-600 truncate"
            />
            <Button
              size="sm"
              variant={copiedLink ? 'primary' : 'outline'}
              onClick={handleCopyShareLink}
              className="flex-shrink-0 gap-1.5"
            >
              {copiedLink ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
            </Button>
          </div>
        )}
        {shareError && <p className="mt-2 text-xs text-danger-600">{shareError}</p>}
        {!scanId && !shareError && (
          scanSaveError ? (
            <p className="mt-2 text-[11px] text-danger-600">
              We couldn't save this scan, so the share link isn't available. Use the Re-scan button above to try again.
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-gray-400">Saving your scan… the share button will activate in a moment.</p>
          )
        )}
      </div>

      {/* Option 2: Embed on website */}
      <div className="rounded-xl bg-white border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-primary-600" />
            <p className="text-sm font-semibold text-gray-800">Add badge to your website</p>
          </div>
          {badgeToken && (
            <button
              onClick={() => setShowHtml(!showHtml)}
              className="text-[11px] font-medium text-primary-600 hover:text-primary-700"
            >
              {showHtml ? 'Hide code' : 'Show code'}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-2">
          Paste this code in your website's footer or sidebar. Visitors who click the badge
          land on a SiteSafe verification page proving the score is real — not a self-made image.
        </p>
        {!badgeToken && (
          badgeError ? (
            <p className="text-[11px] text-danger-600">
              We couldn't generate your badge automatically. Use the Re-scan button above to try again — if it keeps failing, contact support.
            </p>
          ) : (
            <p className="text-[11px] text-gray-400">Generating your badge… it will appear here in a moment.</p>
          )
        )}
        {showHtml && badgeToken && (
          <div className="relative mt-2">
            <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-[10px] overflow-x-auto leading-relaxed max-h-28">
              {embedCode}
            </pre>
            <button
              onClick={handleCopyHtml}
              className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-md bg-gray-700 px-2.5 py-1 text-[10px] font-medium text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
            >
              {copiedHtml ? (
                <><Check className="h-3 w-3 text-green-400" /> Copied!</>
              ) : (
                <><Copy className="h-3 w-3" /> Copy code</>
              )}
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-primary-600/60 mt-4 text-center">
        This badge is a free gift from SiteSafe as a thank you for choosing us. No expiration, no strings attached.
      </p>
    </div>
  )
}
