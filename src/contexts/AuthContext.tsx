import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import keycloak from '../lib/keycloak'

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
  login: () => void
  logout: () => void
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function buildUser(): AuthUser | null {
  if (!keycloak.authenticated || !keycloak.tokenParsed) return null
  const parsed = keycloak.tokenParsed as Record<string, unknown>
  const realmAccess = parsed.realm_access as { roles?: string[] } | undefined

  return {
    uid: keycloak.subject ?? '',
    username: (parsed.preferred_username as string) ?? '',
    email: (parsed.email as string) ?? null,
    name: (parsed.name as string) ?? null,
    roles: new Set(realmAccess?.roles ?? []),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  useEffect(() => {

    if (initialized.current) return
    initialized.current = true

    keycloak
      .init({
        onLoad: 'login-required',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      })
      .then(() => {
        setUser(buildUser())
        setLoading(false)
      })
      .catch(() => {
        setUser(null)
        setLoading(false)
      })

    // keycloak.onTokenExpired = () => {
    //   keycloak
    //     .updateToken(30)
    //     .then(() => setUser(buildUser()))
    //     .catch(() => {
    //       // Don't force a redirect here -- let the next API call's own
    //       // updateToken attempt (in api.ts) decide whether to redirect.
    //       // Redirecting immediately on every transient refresh failure is
    //       // what turns a single hiccup into a fast reload loop.
    //     })
    // }
  }, [])

  const login = useCallback(() => keycloak.login(), [])
  const logout = useCallback(() => keycloak.logout({ redirectUri: window.location.origin }), [])

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!keycloak.authenticated) return null
    try {
      await keycloak.updateToken(30)
    } catch {
      keycloak.login()
      return null
    }
    return keycloak.token ?? null
  }, [])

  const roles = user?.roles ?? new Set<string>()
  const isAdmin = roles.has('role-admin') || roles.has('role-superadmin')
  const isSuperAdmin = roles.has('role-superadmin')

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSuperAdmin, login, logout, getToken }}>
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
