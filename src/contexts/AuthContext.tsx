import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { isFirebaseConfigured } from '@/firebase/client'
import { isAdminUser, registerAdmin, signIn, signOutAdmin, watchAuth } from '@/services/authService'

type AuthState = {
  configured: boolean
  user: User | null
  isAdmin: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(configured)

  useEffect(() => {
    if (!configured) return
    return watchAuth((next) => {
      setUser(next)
      if (!next) {
        setIsAdmin(false)
        setLoading(false)
        return
      }
      void isAdminUser(next.uid)
        .then((admin) => {
          setIsAdmin(admin)
          setLoading(false)
        })
        .catch(() => {
          setIsAdmin(false)
          setLoading(false)
        })
    })
  }, [configured])

  const value = useMemo<AuthState>(
    () => ({
      configured,
      user,
      isAdmin,
      loading,
      login: signIn,
      register: registerAdmin,
      logout: async () => {
        await signOutAdmin()
        setIsAdmin(false)
      },
    }),
    [configured, user, isAdmin, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth precisa estar dentro de AuthProvider.')
  return value
}
