import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { GoogleAuthProvider, onIdTokenChanged, signInWithPopup, signOut } from 'firebase/auth'
import { firebaseAuth } from '../lib/firebase'

export interface AuthUser {
  uid: string
  username: string
  email: string | null
  name: string | null
  roles: Set<string>
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function login() {
  if (firebaseAuth) await signInWithPopup(firebaseAuth, new GoogleAuthProvider())
}

async function logout() {
  if (firebaseAuth) await signOut(firebaseAuth)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(firebaseAuth !== null)

  useEffect(() => {
    if (!firebaseAuth) return
    const auth = firebaseAuth
    let active = true
    const unsubscribe = onIdTokenChanged(auth, async identity => {
      if (!active) return
      if (!identity) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const { claims } = await identity.getIdTokenResult()
        if (!active || auth.currentUser !== identity) return
        const roles = Array.isArray(claims.roles)
          ? claims.roles.filter((role): role is string => typeof role === 'string')
          : []
        setUser({
          uid: identity.uid,
          username: identity.email ?? identity.uid,
          email: identity.email,
          name: identity.displayName,
          roles: new Set(roles),
        })
      } catch {
        if (!active || auth.currentUser !== identity) return
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const isSuperAdmin = user?.roles.has('role-superadmin') ?? false
  const isAdmin = isSuperAdmin || (user?.roles.has('role-admin') ?? false)

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSuperAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
