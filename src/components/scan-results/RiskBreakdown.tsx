import { Building2, MapPin, Scale, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/scanner/cost-estimator'
import { getRiskColor } from '@/scanner/risk-calculator'
import type { RiskAssessment } from '@/scanner/types'

interface RiskBreakdownProps {
  riskAssessment: RiskAssessment
  industry: string
  state: string
}

const RISK_LABEL: Record<string, string> = {
  extreme: 'Extreme',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const RISK_BG: Record<string, string> = {
  extreme: 'bg-danger-50 border-danger-200',
  high: 'bg-orange-50 border-orange-200',
  medium: 'bg-warning-50 border-warning-200',
  low: 'bg-success-50 border-success-200',
}

const RISK_ICON_BG: Record<string, string> = {
  extreme: 'bg-danger-100',
  high: 'bg-orange-100',
  medium: 'bg-warning-100',
  low: 'bg-success-100',
}

export default function RiskBreakdown({ riskAssessment, industry, state }: RiskBreakdownProps) {
  const { industryRisk, stateRisk, estimatedLiability, lawsuitProbability, industryLawsuits, stateLawsuits } = riskAssessment

  const industryLabel = industry
    ? industry.charAt(0).toUpperCase() + industry.slice(1).replace('-', ' ')
    : 'Your Industry'

  const stateLabel = state || 'Your State'

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lawsuit Risk Context</h3>
      </div>

      <div className="p-4 space-y-3">
        {/* Industry risk */}
        <div className={cn('flex items-start gap-3 p-3 rounded-lg border', RISK_BG[industryRisk] || 'bg-gray-50 border-gray-200')}>
          <div className={cn('mt-0.5 p-1.5 rounded-md', RISK_ICON_BG[industryRisk] || 'bg-gray-100')}>
            <Building2 className="w-4 h-4" style={{ color: getRiskColor(industryRisk) }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-gray-800">{industryLabel}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ color: getRiskColor(industryRisk), backgroundColor: `${getRiskColor(industryRisk)}15` }}
              >
                {RISK_LABEL[industryRisk] || industryRisk}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {industryLawsuits.toLocaleString()} lawsuits in 2023
            </p>
          </div>
        </div>

        {/* State risk */}
        <div className={cn('flex items-start gap-3 p-3 rounded-lg border', state ? (RISK_BG[stateRisk] || 'bg-gray-50 border-gray-200') : 'bg-gray-50 border-gray-200')}>
          <div className={cn('mt-0.5 p-1.5 rounded-md', state ? (RISK_ICON_BG[stateRisk] || 'bg-gray-100') : 'bg-gray-100')}>
            <MapPin className="w-4 h-4" style={{ color: state ? getRiskColor(stateRisk) : '#9ca3af' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-gray-800">{stateLabel}</span>
              {state ? (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ color: getRiskColor(stateRisk), backgroundColor: `${getRiskColor(stateRisk)}15` }}
                >
                  {RISK_LABEL[stateRisk] || stateRisk}
                </span>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full text-gray-400 bg-gray-100">
                  N/A
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {state
                ? stateLawsuits > 0
                  ? `${stateLawsuits.toLocaleString()} ADA lawsuits filed`
                  : 'State data not available'
                : 'Select a state above for risk data'}
            </p>
          </div>
        </div>

        {/* Estimated liability — dramatic */}
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-200">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-1.5 bg-danger-100 rounded-md">
              <Scale className="w-4 h-4 text-danger-600" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold text-danger-700 uppercase tracking-wide">Estimated Liability</span>
              <p className="text-xl font-extrabold text-danger-700 mt-1">
                {formatCurrency(estimatedLiability.min)} – {formatCurrency(estimatedLiability.max)}
              </p>
              <p className="text-xs text-danger-500 mt-0.5">Typical settlement + defense cost</p>
            </div>
          </div>
        </div>

        {/* Lawsuit probability */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="mt-0.5 p-1.5 bg-gray-100 rounded-md">
            <TrendingUp className="w-4 h-4" style={{ color: getRiskColor(riskAssessment.overallRisk) }} />
          </div>
          <div className="flex-1">
            <span className="text-xs font-medium text-gray-500">Lawsuit Probability</span>
            <p
              className="text-lg font-extrabold mt-0.5"
              style={{ color: getRiskColor(riskAssessment.overallRisk) }}
            >
              {lawsuitProbability}
            </p>
            <p className="text-xs text-gray-400">Based on industry, location & issues</p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
          Risk estimates are informational only, not legal advice.
        </p>
      </div>
    </div>
  )
}
