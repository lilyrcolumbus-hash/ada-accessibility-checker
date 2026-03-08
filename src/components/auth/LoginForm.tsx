import { useState, FormEvent } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export function LoginForm() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const stateFrom = (location.state as { from?: string })?.from || '/dashboard'
  // Plan can come from: URL param, sessionStorage (set by ProtectedRoute), or registration flow
  const urlPlan = searchParams.get('plan')
  if (urlPlan && urlPlan !== 'free') {
    sessionStorage.setItem('sitesafe_pending_plan', urlPlan)
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)

      // Check for pending plan from registration flow
      const pendingPlan = sessionStorage.getItem('sitesafe_pending_plan')
      if (pendingPlan && pendingPlan !== 'free') {
        sessionStorage.removeItem('sitesafe_pending_plan')
        navigate(`/checkout?plan=${pendingPlan}`)
      } else {
        navigate(stateFrom)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
            <LogIn className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sign in to SiteSafe</h1>
            <p className="text-sm text-gray-500">Welcome back</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" loading={loading} disabled={loading}>
            Sign In
          </Button>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
              Sign up
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
