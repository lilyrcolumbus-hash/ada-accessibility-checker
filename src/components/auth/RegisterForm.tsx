import { useState, FormEvent } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getPlan } from '@/config/plans'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export function RegisterForm() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const planId = searchParams.get('plan') || 'free'
  const selectedPlan = getPlan(planId)
  const hasPlanParam = searchParams.has('plan') && planId !== 'free'

  // Persist plan so LoginForm can pick it up if user switches to "Already have an account?"
  if (hasPlanParam) {
    sessionStorage.setItem('sitesafe_pending_plan', planId)
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      // Always go to dashboard first — user sees their profile, scans, and upgrade options
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
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
            <Link to={hasPlanParam ? `/login?plan=${planId}` : '/login'} className="font-medium text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
