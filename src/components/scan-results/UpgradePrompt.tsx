import { useNavigate } from 'react-router-dom'
import { Lock, Code2, FileCheck2, ChevronRight, RotateCcw, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'

interface UpgradePromptProps {
  hiddenIssueCount: number
}

const FEATURES = [
  { Icon: ShieldCheck, text: 'Every issue explained in plain English' },
  { Icon: Code2, text: 'Copy-paste code fix for each issue' },
  { Icon: FileCheck2, text: 'Shareable report for your developer' },
  { Icon: RotateCcw, text: 'Free re-scan after you fix everything' },
]

export default function UpgradePrompt({ hiddenIssueCount }: UpgradePromptProps) {
  const navigate = useNavigate()

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-primary-300 bg-gradient-to-br from-primary-50 via-white to-primary-50 shadow-sm">
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 rounded-full -translate-y-16 translate-x-16 opacity-50" />

      <div className="relative p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-primary-100 rounded-lg">
              <Lock className="w-4 h-4 text-primary-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Unlock Full Report</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {hiddenIssueCount > 0 ? (
              <>
                You have{' '}
                <span className="font-bold text-danger-600">{hiddenIssueCount} more issue{hiddenIssueCount !== 1 ? 's' : ''}</span>{' '}
                hidden. Get every fix before a lawsuit finds you.
              </>
            ) : (
              <>Get the complete report with every code fix and a shareable link.</>
            )}
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
          onClick={() => navigate('/register?plan=full-report')}
        >
          Get Full Report
          <ChevronRight className="w-4 h-4" />
        </Button>

        <p className="text-xs text-center text-gray-400">
          One-time payment. No subscription.
        </p>
      </div>
    </div>
  )
}
