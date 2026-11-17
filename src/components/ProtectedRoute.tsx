import { useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { BRAND } from '../config/brand'
import { isPreview } from '../lib/firebase'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, login } = useAuth()
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')

  if (isPreview) return <>{children}</>

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '80px', width: '100%', color: 'var(--text-muted)' }}>
        <Loader2 size={18} className="spin" /> Checking your session...
      </div>
    )
  }

  async function handleSignIn() {
    setError('')
    setSigningIn(true)
    try {
      await login()
    } catch {
      setError('Could not sign in. Try again or contact your administrator.')
    } finally {
      setSigningIn(false)
    }
  }

  if (!user) {
    return (
      <main className="page" style={{ maxWidth: '480px', margin: '64px auto' }}>
        <h1 className="page-title">Sign in to {BRAND.name}</h1>
        {error && <p className="alert danger" role="alert">{error}</p>}
        <button className="btn btn-primary" onClick={handleSignIn} disabled={signingIn}>
          {signingIn ? 'Signing in…' : 'Sign in with Google'}
        </button>
      </main>
    )
  }

  return <>{children}</>
}
