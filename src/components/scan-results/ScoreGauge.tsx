import { getScoreLabel, getScoreColor } from '@/scanner/scoring'
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'

interface ScoreGaugeProps {
  score: number
}

function ScoreIcon({ score }: { score: number }) {
  const cls = 'w-5 h-5'
  if (score >= 90) return <ShieldCheck className={cls} />
  if (score >= 70) return <Shield className={cls} />
  if (score >= 50) return <ShieldAlert className={cls} />
  return <ShieldX className={cls} />
}

export default function ScoreGauge({ score }: ScoreGaugeProps) {
  const radius = 62
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(100, score))
  const strokeDashoffset = circumference - (progress / 100) * circumference
  const color = getScoreColor(score)
  const label = getScoreLabel(score)

  // Generate a softer glow color
  const glowColor = `${color}30`

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative inline-flex items-center justify-center rounded-full"
        style={{ filter: `drop-shadow(0 0 18px ${glowColor})` }}
      >
        <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
          {/* Background track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="14"
          />
          {/* Progress ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.4s ease-in-out' }}
          />
        </svg>
        {/* Score number in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-extrabold leading-none tabular-nums"
            style={{ color }}
          >
            {score}
          </span>
          <span className="text-xs text-gray-400 font-medium mt-1">out of 100</span>
        </div>
      </div>
      {/* Label below */}
      <span
        className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-1.5 rounded-full"
        style={{ color, backgroundColor: `${color}15`, border: `1.5px solid ${color}30` }}
      >
        <ScoreIcon score={score} />
        {label}
      </span>
    </div>
  )
}
