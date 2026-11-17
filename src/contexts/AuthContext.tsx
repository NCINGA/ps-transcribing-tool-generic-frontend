import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onIdTokenChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { firebaseAuth, isPreview } from '../lib/firebase'

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
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const previewUser: AuthUser = {
  uid: 'preview',
  username: 'Preview',
  email: null,
  name: null,
  roles: new Set(),
}

async function login(email: string, password: string) {
  if (!firebaseAuth) throw new Error('Sign-in is unavailable.')
  await signInWithEmailAndPassword(firebaseAuth, email, password)
}

async function logout() {
  if (firebaseAuth) await signOut(firebaseAuth)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(isPreview ? previewUser : null)
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
        const { claims, signInProvider } = await identity.getIdTokenResult()
        if (!active || auth.currentUser !== identity) return
        if (signInProvider !== 'password') {
          setUser(null)
          setLoading(false)
          return
        }
        const access = claims.ps_transcription as { group?: unknown } | undefined
        const group = access?.group === 'admin' || access?.group === 'superadmin' ? access.group : 'user'
        setUser({
          uid: identity.uid,
          username: identity.email ?? identity.uid,
          email: identity.email,
          name: identity.displayName,
          roles: new Set([`role-${group}`]),
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
