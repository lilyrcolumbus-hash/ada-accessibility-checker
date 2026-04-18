import { ChevronDown } from 'lucide-react'
import { TOP_LAWSUIT_STATES } from '@/config/constants'

export const INDUSTRY_LABELS: Record<string, string> = {
  'ecommerce': 'E-Commerce',
  'retail': 'Retail',
  'restaurant': 'Restaurant',
  'food-delivery': 'Food Delivery',
  'hotel': 'Hotel & Hospitality',
  'travel': 'Travel',
  'healthcare': 'Healthcare',
  'dental': 'Dental',
  'pharmacy': 'Pharmacy',
  'finance': 'Finance',
  'banking': 'Banking',
  'insurance': 'Insurance',
  'real-estate': 'Real Estate',
  'automotive': 'Automotive',
  'fitness': 'Fitness',
  'salon-spa': 'Salon & Spa',
  'education': 'Education',
  'entertainment': 'Entertainment',
  'media': 'Media',
  'government': 'Government',
  'nonprofit': 'Nonprofit',
  'legal': 'Legal',
  'accounting': 'Accounting',
  'construction': 'Construction',
  'manufacturing': 'Manufacturing',
  'technology': 'Technology',
  'consulting': 'Consulting',
  'agriculture': 'Agriculture',
}

export function getRiskColor(riskLevel: string) {
  switch (riskLevel) {
    case 'extreme': return { bg: 'bg-danger-50', border: 'border-danger-200', text: 'text-danger-700', badge: 'bg-danger-100 text-danger-700', dot: 'bg-danger-500' }
    case 'high': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' }
    case 'medium': return { bg: 'bg-warning-50', border: 'border-warning-200', text: 'text-warning-700', badge: 'bg-warning-100 text-warning-700', dot: 'bg-warning-500' }
    default: return { bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-700', badge: 'bg-success-100 text-success-700', dot: 'bg-success-500' }
  }
}

export function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-xl border border-gray-200 bg-white">
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left text-base font-semibold text-gray-900">
        {question}
        <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-6 pb-4 text-sm leading-relaxed text-gray-600">
        {answer}
      </div>
    </details>
  )
}

export function stateNameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

export function slugToStateName(slug: string): string | undefined {
  return Object.keys(TOP_LAWSUIT_STATES).find(name => stateNameToSlug(name) === slug)
}
