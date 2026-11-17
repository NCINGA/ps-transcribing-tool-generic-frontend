import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { isPreview } from '../lib/firebase'
import LoginPage from './LoginPage'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (isPreview) return <>{children}</>

  if (loading) {
    return (
      <div className="login-page" role="status">
        <span className="login-checking"><Loader2 size={18} className="spin" aria-hidden="true" /> Checking your session…</span>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return <>{children}</>
}
