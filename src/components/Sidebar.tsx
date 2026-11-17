import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileAudio, ListChecks, Users, LogOut, Wifi, WifiOff, AudioLines } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useConnectivity } from '../contexts/ConnectivityContext'
import { BRAND } from '../config/brand'
import { isPreview } from '../lib/firebase'

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export default function Sidebar() {
  const { user, isAdmin, isSuperAdmin, logout } = useAuth()
  const { isOnline } = useConnectivity()
  const displayName = user?.name || user?.username || ''
  const roleLabel = isSuperAdmin ? 'Superadmin' : isAdmin ? 'Admin' : 'Standard user'

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo"><AudioLines size={22} /></div>
        <div className="sidebar-brand-text">
          <div style={{ color: '#fff', fontSize: '16px', fontWeight: 750, letterSpacing: '-0.01em' }}>{BRAND.name}</div>
          <div style={{ color: 'var(--navbar-text-muted)', fontSize: '12px' }}>{BRAND.tagline}</div>
        </div>
      </div>

      <div className="sidebar-section">Menu</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <NavLink to="/" end className="nav-link"><LayoutDashboard size={18} /><span>Dashboard</span></NavLink>
        <NavLink to="/files" className="nav-link"><FileAudio size={18} /><span>Files</span></NavLink>
        <NavLink to="/action-items" className="nav-link"><ListChecks size={18} /><span>Action Items</span></NavLink>
        {isAdmin && <NavLink to="/users" className="nav-link"><Users size={18} /><span>Users</span></NavLink>}
      </nav>

      <div className={`conn ${isOnline ? 'on' : 'off'}`}>
        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span>{isOnline ? 'Online' : 'Offline'}</span>
        <i className="conn-dot" />
      </div>

      {!isPreview && <div className="sidebar-user">
        <div className="avatar" style={{ background: 'var(--brand-gradient)' }}>{initialsOf(displayName)}</div>
        <div className="sidebar-user-text" title={displayName}>
          <div className="sidebar-user-name">{displayName}</div>
          <div className="sidebar-user-role">{roleLabel}</div>
        </div>
        <button onClick={logout} className="signout" title="Sign out" aria-label="Sign out"><LogOut size={17} /></button>
      </div>}
    </aside>
  )
}
