import { AlertTriangle, AlertCircle, CheckCircle, ShieldX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RiskBadgeProps {
  risk: 'extreme' | 'high' | 'medium' | 'low'
  size?: 'sm' | 'md'
}

const RISK_CONFIG = {
  extreme: {
    label: 'Extreme Risk',
    Icon: ShieldX,
    bg: 'bg-danger-600',
    text: 'text-white',
    ring: 'ring-danger-300',
    pulse: true,
  },
  high: {
    label: 'High Risk',
    Icon: AlertTriangle,
    bg: 'bg-orange-500',
    text: 'text-white',
    ring: 'ring-orange-200',
    pulse: false,
  },
  medium: {
    label: 'Medium Risk',
    Icon: AlertCircle,
    bg: 'bg-warning-500',
    text: 'text-white',
    ring: 'ring-warning-200',
    pulse: false,
  },
  low: {
    label: 'Low Risk',
    Icon: CheckCircle,
    bg: 'bg-success-500',
    text: 'text-white',
    ring: 'ring-success-200',
    pulse: false,
  },
} as const

export default function RiskBadge({ risk, size = 'md' }: RiskBadgeProps) {
  const config = RISK_CONFIG[risk]
  const { Icon } = config

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-lg font-bold shadow-sm ring-2',
        config.bg, config.text, config.ring,
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm',
      )}
    >
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
      )}
      <Icon className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      {config.label}
    </span>
  )
}
