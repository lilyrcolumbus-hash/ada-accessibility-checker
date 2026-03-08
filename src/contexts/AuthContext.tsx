import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  plan: string
  stripe_customer_id: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const isConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isConfigured)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase
        .from('profiles')
        .select('id, email, plan, stripe_customer_id')
        .eq('id', userId)
        .single()
      if (data) setProfile(data as Profile)
    } catch {
      // Profile may not exist yet
    }
  }, [])

  useEffect(() => {
    if (!isConfigured) return

    let mounted = true

    const init = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')

        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) await fetchProfile(session.user.id)
        setLoading(false)

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (!mounted) return
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
              await fetchProfile(session.user.id)
            } else {
              setProfile(null)
            }
            setLoading(false)
          }
        )

        return () => subscription.unsubscribe()
      } catch {
        if (mounted) setLoading(false)
      }
    }

    let cleanup: (() => void) | undefined
    init().then(fn => { cleanup = fn }).catch(err => {
      console.error('Auth init failed:', err)
    })

    return () => {
      mounted = false
      cleanup?.()
    }
  }, [fetchProfile])

  const signUp = async (email: string, password: string) => {
    const { supabase } = await import('@/lib/supabase')
    const { error, data } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    // With email confirmation disabled, session is returned immediately
    if (data.session) {
      setSession(data.session)
      setUser(data.user)
      if (data.user) await fetchProfile(data.user.id)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { supabase } = await import('@/lib/supabase')
    const { error, data } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Update state immediately
    setSession(data.session)
    setUser(data.user)
    if (data.user) await fetchProfile(data.user.id)
  }

  const signOut = async () => {
    const { supabase } = await import('@/lib/supabase')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const { supabase } = await import('@/lib/supabase')
      // Always refresh to guarantee a valid token
      const { data: { session: refreshed } } = await supabase.auth.refreshSession()
      if (refreshed) {
        setSession(refreshed)
        return refreshed.access_token
      }
      // Fallback: try cached session
      const { data: { session: cached } } = await supabase.auth.getSession()
      return cached?.access_token ?? null
    } catch {
      return null
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
