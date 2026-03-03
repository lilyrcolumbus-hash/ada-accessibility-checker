import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <>
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 rounded-lg border transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'placeholder:text-gray-400',
          error ? 'border-danger-500 focus:ring-danger-500' : 'border-gray-300',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
    </>
  )
)

Input.displayName = 'Input'
export default Input
