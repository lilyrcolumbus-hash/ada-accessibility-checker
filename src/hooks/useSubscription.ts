import { getPlan } from '@/config/plans'
import { useAuth } from '@/contexts/AuthContext'

export function useSubscription() {
  const { profile, loading } = useAuth()

  // While loading, don't assume free — wait for real profile data
  const planId = loading ? null : (profile?.plan || 'free')
  const plan = getPlan(planId || 'free')
  const isPaid = planId !== null && planId !== 'free'

  return { plan, isPaid, isLoading: loading }
}
