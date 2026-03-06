import { useNavigate } from 'react-router-dom'
import { FileText, ShieldCheck, ChevronRight, RotateCcw, Globe } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'

interface UpgradePromptProps {
  totalIssueCount: number
}

const FEATURES = [
  { Icon: Globe, text: 'All issues + fixes for your entire site' },
  { Icon: FileText, text: 'Accessibility Audit Report (PDF)' },
  { Icon: ShieldCheck, text: '"ADA Tested" badge for your site' },
  { Icon: RotateCcw, text: 'Re-scan to verify your fixes worked' },
]

export default function UpgradePrompt({ totalIssueCount }: UpgradePromptProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const checkoutPath = user ? '/checkout?plan=fix-my-site' : '/register?plan=fix-my-site'

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-primary-300 bg-gradient-to-br from-primary-50 via-white to-primary-50 shadow-sm">
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 rounded-full -translate-y-16 translate-x-16 opacity-50" />

      <div className="relative p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            {totalIssueCount} issues found
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mt-1">
            Get all fixes + your Audit Report to prove compliance effort.
          </p>
        </div>

        <ul className="space-y-2.5">
          {FEATURES.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5">
              <div className="p-1 bg-primary-100 rounded-md flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-primary-600" />
              </div>
              <span className="text-sm text-gray-700 font-medium">{text}</span>
            </li>
          ))}
        </ul>

        {/* Price block */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-primary-200 shadow-sm">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-gray-900">$49</span>
              <span className="text-sm text-gray-500">one-time</span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400">vs average lawsuit</p>
            <p className="text-sm font-bold text-danger-600">$10,000+</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          className="w-full gap-2 shadow-md"
          onClick={() => navigate(checkoutPath)}
        >
          Fix My Site
          <ChevronRight className="w-4 h-4" />
        </Button>

        <p className="text-xs text-center text-gray-400">
          One-time payment. No subscription.
        </p>
      </div>
    </div>
  )
}
