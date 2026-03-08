import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!user) {
    // Preserve plan param in sessionStorage so LoginForm can redirect to checkout
    const params = new URLSearchParams(location.search)
    const plan = params.get('plan')
    if (plan && plan !== 'free') {
      sessionStorage.setItem('sitesafe_pending_plan', plan)
    }

    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    )
  }

  return <Outlet />
}
