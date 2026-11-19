import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchUsers, createUser, resetUserRole } from '../api'
import type { UserRecord, UserGroup } from '../types'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import Select from '../components/Select'
import { UserPlus, UserMinus, Loader2, ShieldAlert, UsersRound, Mail } from 'lucide-react'

function availableGroups(isSuperAdmin: boolean): UserGroup[] {
  return isSuperAdmin ? ['user', 'admin', 'superadmin'] : ['user']
}

function groupLabel(group: UserGroup | null): string {
  if (!group) return '—'
  return group === 'user' ? 'Standard User' : group === 'admin' ? 'Admin' : 'Superadmin'
}

function groupPill(group: UserGroup | null): string {
  if (group === 'superadmin') return 'danger'
  if (group === 'admin') return 'primary'
  return ''
}

const AVATAR_COLORS = ['#6366f1', '#0891b2', '#7c3aed', '#059669', '#d97706', '#e11d48']
function avatarColor(seed: string): string {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

const EMPTY_USER_FORM = { email: '', password: '', first_name: '', last_name: '', group: 'user' as UserGroup, department: '' }

const DEPARTMENTS = ['Cyber Security', 'Multi-Cloud', 'Data and AI', 'Networking', 'Application Services']

const EMAIL_REGEX = /^[^\s@]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/
const NAME_REGEX = /^[A-Za-z\s]+$/

function validateUserForm(form: typeof EMPTY_USER_FORM): string | null {
  const email = form.email.trim()
  const firstName = form.first_name.trim()
  const lastName = form.last_name.trim()

  if (!email) return 'Email is required in order to create the user'
  if (!firstName) return 'First name is required in order to create the user'
  if (!lastName) return 'Last name is required in order to create the user'
  if (!form.department) return 'Department is required in order to create the user'
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address'
  if (form.password && form.password.length < 6) return 'Use a password with at least six characters'
  if (!NAME_REGEX.test(firstName)) return 'First name must only contain letters'
  if (!NAME_REGEX.test(lastName)) return 'Last name must only contain letters'
  return null
}

export default function UsersPage() {
  const { isAdmin, isSuperAdmin, user } = useAuth()
  const navigate = useNavigate()

  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_USER_FORM)

  const [confirmReset, setConfirmReset] = useState<{ id: string; label: string } | null>(null)
  const [resetting, setResetting] = useState<string | null>(null)
  const [alertMsg, setAlertMsg] = useState<string | null>(null)

  const load = async () => {
    try {
      const data = await fetchUsers()
      setUsers(data)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    const loadUsers = async () => {
      try {
        const data = await fetchUsers()
        setUsers(data)
        setError(null)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load users')
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="card">
          <div className="empty">
            <span className="icon-chip danger"><ShieldAlert size={24} /></span>
            <h3>You don't have access to this page</h3>
            <p style={{ marginBottom: '16px' }}>Only admins can manage users.</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">Go to Dashboard</button>
          </div>
        </div>
      </div>
    )
  }

  const handleCreate = async () => {
    const validationError = validateUserForm(form)
    if (validationError) {
      setCreateError(validationError)
      return
    }

    setCreating(true)
    setCreateError(null)
    try {
      await createUser({
        ...form,
        email: form.email.trim(),
        password: form.password || undefined,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      })
      setShowCreate(false)
      setForm(EMPTY_USER_FORM)
      await load()
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to save user settings')
    } finally {
      setCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreate(false)
    setForm(EMPTY_USER_FORM)
    setCreateError(null)
  }

  const confirmRoleReset = async () => {
    if (!confirmReset) return
    const { id } = confirmReset
    setConfirmReset(null)
    setResetting(id)
    try {
      await resetUserRole(id)
      await load()
    } catch (e: unknown) {
      setAlertMsg(e instanceof Error ? e.message : 'Failed to reset user role')
    } finally {
      setResetting(null)
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Users"
        subtitle="Manage Firebase password accounts and transcription roles"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <UserPlus size={16} /> Add or update user
          </button>
        }
      />

      {error && <div className="alert danger">{error}</div>}

      {loading ? (
        <div className="user-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '190px', borderRadius: '16px' }} />)}
        </div>
      ) : users.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="icon-chip"><UsersRound size={24} /></span>
            <h3>No users found</h3>
          </div>
        </div>
      ) : (
        <div className="user-grid">
          {users.map(u => {
            const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ')
            const initials = ((u.first_name?.[0] ?? u.email?.[0] ?? '?') + (u.last_name?.[0] ?? '')).toUpperCase()
            return (
              <article key={u.user_id} className="card user-card">
                <div className="user-card-top">
                  <span className="avatar avatar-lg" style={{ background: avatarColor(u.email || u.user_id) }}>{initials}</span>
                  <span className={`pill ${u.enabled ? 'success' : ''}`} style={{ marginLeft: 'auto' }}>
                    <span className="dot" />{u.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <h3 className="user-name">{fullName || '—'}</h3>
                <div className="user-email" title={u.email || ''}><Mail size={13} /> {u.email || '—'}</div>
                <div style={{ margin: '12px 0 16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={`pill ${groupPill(u.group)}`}>{groupLabel(u.group)}</span>
                  {u.department && <span className="pill">{u.department}</span>}
                </div>
                <div className="user-actions">
                  {isSuperAdmin && u.user_id !== user?.uid && (u.group === 'admin' || u.group === 'superadmin') && (
                    <button
                      onClick={() => setConfirmReset({ id: u.user_id, label: u.email || u.user_id })}
                      disabled={resetting === u.user_id}
                      className="btn btn-outline-danger btn-sm"
                    >
                      {resetting === u.user_id ? <Loader2 size={13} className="spin" /> : <UserMinus size={13} />} Reset role
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {showCreate && createPortal(
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '480px' }} role="dialog" aria-modal="true">
            <div className="modal-icon"><UserPlus size={22} /></div>
            <div className="modal-title" style={{ marginBottom: '18px' }}>Add or update user</div>
            <p>Enter a password to create a Firebase account. Leave it blank to update an existing account’s transcription settings.</p>

            <FormField label="Email" required>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" />
            </FormField>
            <FormField label="Password for new accounts">
              <input type="password" autoComplete="new-password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} className="input" />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="First name" required>
                <input type="text" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="input" />
              </FormField>
              <FormField label="Last name" required>
                <input type="text" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="input" />
              </FormField>
            </div>

            <FormField label="Department" required>
              <Select label="Department" value={form.department} fullWidth placeholder="Select a department"
                options={DEPARTMENTS.map(department => ({ value: department, label: department }))}
                onChange={department => setForm({ ...form, department })} />
            </FormField>

            <FormField label="Group" required>
              <Select label="Group" value={form.group} fullWidth
                options={availableGroups(isSuperAdmin).map(group => ({ value: group, label: groupLabel(group) }))}
                onChange={group => setForm({ ...form, group })} />
            </FormField>

            {createError && <div className="alert danger" style={{ marginTop: '14px' }}>{createError}</div>}

            <div className="modal-actions" style={{ marginTop: '22px' }}>
              <button onClick={handleCancelCreate} className="btn btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="btn btn-primary">
                {creating ? 'Saving…' : 'Save user'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {confirmReset && (
        <Modal
          title="Reset user role"
          message={`Change ${confirmReset.label} to Standard User? They can still sign in and use the transcription tool.`}
          confirmLabel="Reset role"
          cancelLabel="Cancel"
          danger
          onConfirm={confirmRoleReset}
          onCancel={() => setConfirmReset(null)}
        />
      )}

      {alertMsg && (
        <Modal title="Error" message={alertMsg} confirmLabel="OK" onConfirm={() => setAlertMsg(null)} />
      )}
    </div>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label className="field-label">
        {label}
        {required && <span style={{ color: 'var(--danger)' }}> *</span>}
      </label>
      {children}
    </div>
  )
}
