import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Copy, Check, Clock, Shield } from 'lucide-react'

const CONTACT_EMAIL = 'codebake.saas@outlook.com'

export function ContactPage() {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    document.title = 'Contact — SiteSafe'
    return () => { document.title = 'SiteSafe — ADA Website Accessibility Checker' }
  }, [])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = CONTACT_EMAIL
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Contact SiteSafe</h1>
      <p className="text-gray-600 mb-10">
        Questions about ADA compliance, your scan results, billing, or anything else? Email us — we read every message.
      </p>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-5">
          <div className="rounded-lg bg-primary-50 p-2">
            <Mail className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Email us</h2>
            <p className="text-sm text-gray-500">The fastest way to reach the team</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900 break-all">
            {CONTACT_EMAIL}
          </div>
          <button
            onClick={copyEmail}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Copy email address"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-success-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Mail className="w-4 h-4" />
          Open email app
        </a>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-6">
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <Clock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-gray-900">Response time</div>
            <div className="text-sm text-gray-500">Within 24 hours, Mon–Fri</div>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <Shield className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-gray-900">Refunds & billing</div>
            <div className="text-sm text-gray-500">Include your purchase email</div>
          </div>
        </div>
      </div>
    </div>
  )
}
