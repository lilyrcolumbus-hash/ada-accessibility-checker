import { useState, FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { UserPlus, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getPlan } from '@/config/plans'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export function RegisterForm() {
  const { signUp } = useAuth()
  const [searchParams] = useSearchParams()

  const planId = searchParams.get('plan') || 'free'
  const selectedPlan = getPlan(planId)
  const hasPlanParam = searchParams.has('plan') && planId !== 'free'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [confirmError, setConfirmError] = useState<string | undefined>()

  const validate = (): boolean => {
    let valid = true

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      valid = false
    } else {
      setPasswordError(undefined)
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match')
      valid = false
    } else {
      setConfirmError(undefined)
    }

    return valid
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validate()) return

    setLoading(true)

    try {
      await signUp(email, password)
      if (hasPlanParam) {
        sessionStorage.setItem('sitesafe_pending_plan', planId)
      }
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
            <CheckCircle className="h-7 w-7 text-success-600" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Check your email</h2>
          <p className="mb-4 text-sm text-gray-600">
            We've sent a confirmation link to{' '}
            <span className="font-medium text-gray-900">{email}</span>.
            Click the link to activate your account.
          </p>
          {hasPlanParam && (
            <p className="rounded-lg bg-primary-50 px-4 py-2 text-sm text-primary-700">
              After confirming, you'll be taken to checkout for the{' '}
              <strong>{selectedPlan.name}</strong> plan.
            </p>
          )}
          <Link
            to="/login"
            className="mt-6 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
            <UserPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
            <p className="text-sm text-gray-500">Start protecting your website today</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {hasPlanParam && (
            <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm text-primary-800">
              Selected plan: <strong>{selectedPlan.name}</strong> — ${selectedPlan.price} one-time
            </div>
          )}

          {error && (
            <div className={cn(
              'rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700'
            )}>
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmError}
            />
          </div>

          <Button type="submit" className="w-full" loading={loading} disabled={loading}>
            Create Account
          </Button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
