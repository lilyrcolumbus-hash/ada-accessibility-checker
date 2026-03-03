import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'critical' | 'serious' | 'moderate' | 'minor' | 'success'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-gray-100 text-gray-800': variant === 'default',
          'bg-danger-100 text-danger-700': variant === 'critical',
          'bg-orange-100 text-orange-700': variant === 'serious',
          'bg-warning-100 text-warning-600': variant === 'moderate',
          'bg-blue-100 text-blue-700': variant === 'minor',
          'bg-success-100 text-success-600': variant === 'success',
        },
        className
      )}
      {...props}
    />
  )
)

Badge.displayName = 'Badge'
export default Badge
