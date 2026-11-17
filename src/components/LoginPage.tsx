import { useState, type FormEvent, type ReactNode } from 'react'
import { FirebaseError } from 'firebase/app'
import { ArrowRight, AudioLines, Eye, EyeOff, Loader2 } from 'lucide-react'
import { BRAND } from '../config/brand'
import { useAuth } from '../contexts/AuthContext'
import './login.css'

const waveform = [14, 24, 16, 36, 58, 84, 48, 66, 108, 78, 38, 56, 88, 50, 26, 38, 20, 12]

export function LoginFrame({ title, description, children }: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <main className="login-page">
      <div className="login-shell">
        <aside className="login-brand">
          <div className="login-brand-lockup">
            <div className="sidebar-logo" aria-hidden="true"><AudioLines size={22} /></div>
            <div>
              <div className="login-brand-name">{BRAND.name}</div>
              <div className="login-brand-tagline">{BRAND.tagline}</div>
            </div>
          </div>
          <div className="login-waveform" aria-hidden="true">
            {waveform.map((height, index) => <span key={index} style={{ height }} />)}
          </div>
        </aside>
        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-panel-inner">
            <h1 id="login-title">{title}</h1>
            <p className="login-description">{description}</p>
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}

function signInMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/invalid-email':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Check your email and password and try again.'
      case 'auth/too-many-requests':
        return 'Too many sign-in attempts. Wait a few minutes and try again.'
      case 'auth/network-request-failed':
        return 'Check your internet connection and try again.'
    }
  }
  return 'Could not sign in. Try again or contact your administrator.'
}

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (signingIn) return
    setError('')
    setSigningIn(true)
    try {
      await login(email.trim(), password)
    } catch (cause) {
      setError(signInMessage(cause))
    } finally {
      setSigningIn(false)
    }
  }

  return (
    <LoginFrame title="Sign in" description="Use the email and password provided by your administrator.">
      <form className="login-form" onSubmit={handleSignIn} aria-busy={signingIn}>
        {error && <p className="alert danger" role="alert">{error}</p>}
        <div>
          <label className="field-label" htmlFor="login-email">Email address</label>
          <input id="login-email" name="email" className="input" type="email" autoComplete="username"
            autoCapitalize="none" value={email} onChange={event => setEmail(event.target.value)}
            disabled={signingIn} required />
        </div>
        <div>
          <label className="field-label" htmlFor="login-password">Password</label>
          <div className="login-password">
            <input id="login-password" name="password" className="input"
              type={showPassword ? 'text' : 'password'} autoComplete="current-password"
              value={password} onChange={event => setPassword(event.target.value)} disabled={signingIn} required />
            <button type="button" className="btn btn-ghost btn-icon" aria-controls="login-password"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(visible => !visible)}>
              {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <button className="btn btn-primary login-submit" type="submit" disabled={signingIn}>
          {signingIn ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
          {signingIn ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </LoginFrame>
  )
}
