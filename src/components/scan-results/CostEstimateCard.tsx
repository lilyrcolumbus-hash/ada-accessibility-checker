import { useNavigate } from 'react-router-dom'
import { Lock, Clock, DollarSign, AlertTriangle, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatTime } from '@/scanner/cost-estimator'
import Button from '@/components/ui/Button'
import type { CostEstimate } from '@/scanner/types'

interface CostEstimateCardProps {
  costEstimate: CostEstimate
  isPaid: boolean
}

function CategoryLabel(name: string): string {
  return name
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function CostEstimateCard({ costEstimate, isPaid }: CostEstimateCardProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { totalMinutes, totalCost, byCategory } = costEstimate
  const categories = Object.entries(byCategory)
  const savingsMultiplier = totalCost > 0 ? Math.round(10000 / totalCost) : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-gray-500" />
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fix Cost Estimate</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Big totals */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
            <Clock className="w-5 h-5 text-primary-500 mx-auto mb-1.5" />
            <p className="text-xl font-extrabold text-gray-900">{formatTime(totalMinutes)}</p>
            <p className="text-xs text-gray-500 font-medium">Dev time</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
            <DollarSign className="w-5 h-5 text-success-500 mx-auto mb-1.5" />
            <p className="text-xl font-extrabold text-gray-900">{formatCurrency(totalCost)}</p>
            <p className="text-xs text-gray-500 font-medium">Total cost</p>
          </div>
        </div>

        {/* Dramatic lawsuit comparison */}
        <div className="p-4 bg-gradient-to-br from-danger-50 to-danger-100/50 border border-danger-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-danger-200 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-danger-700" />
            </div>
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-bold text-gray-900">{formatCurrency(totalCost)}</span>
                <span className="text-sm text-gray-500">to fix</span>
                <span className="text-xs text-gray-400">vs</span>
                <span className="text-sm font-bold text-danger-700">$10,000+</span>
                <span className="text-sm text-gray-500">lawsuit</span>
              </div>
              {savingsMultiplier > 0 && (
                <p className="text-xs font-bold text-danger-600 mt-1">
                  Fixing now is {savingsMultiplier}x cheaper than a lawsuit
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Category breakdown — blurred for free users */}
        {categories.length > 0 && (
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Breakdown</span>
              {!isPaid && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Lock className="w-3 h-3" />
                  Full report
                </span>
              )}
            </div>

            <div className={!isPaid ? 'blur-sm select-none pointer-events-none' : ''}>
              <div className="space-y-1.5">
                {categories.map(([category, data]) => {
                  const pct = totalCost > 0 ? Math.round((data.cost / totalCost) * 100) : 0
                  return (
                    <div key={category} className="flex items-center gap-2">
                      <span className="text-xs text-gray-700 font-medium w-24 truncate">{CategoryLabel(category)}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-2 bg-primary-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 font-medium w-14 text-right">{formatCurrency(data.cost)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Overlay for blurred state */}
            {!isPaid && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="bg-white/90 border border-gray-200 shadow-sm rounded-lg px-4 py-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-600">Unlock full breakdown</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    sessionStorage.setItem('sitesafe_pending_plan', 'fix-my-site')
                    navigate(user ? '/checkout?plan=fix-my-site' : '/register?plan=fix-my-site')
                  }}
                >
                  Fix My Site
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Hourly rate note */}
        <p className="text-[10px] text-gray-400">
          Based on $50/hr developer rate. Actual costs may vary.
        </p>
      </div>
    </div>
  )
}
