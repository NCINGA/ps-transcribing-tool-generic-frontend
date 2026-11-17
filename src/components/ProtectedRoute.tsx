import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '80px', width: '100%', color: 'var(--text-muted)' }}>
        <Loader2 size={18} className="spin" /> Redirecting to sign in...
      </div>
    )
  }

  return <>{children}</>
}