import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchUsers, createUser, deleteUser, resetPassword } from '../api'
import type { KeycloakUserRecord, UserGroup } from '../types'
import Modal from '../components/Modal'
import CredentialsModal from '../components/CredentialsModal'
import PageHeader from '../components/PageHeader'
import { UserPlus, KeyRound, UserMinus, Loader2, ShieldAlert, UsersRound, Mail } from 'lucide-react'

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

const EMPTY_USER_FORM = { email: '', first_name: '', last_name: '', group: 'user' as UserGroup, department: '' }

const DEPARTMENTS = ['Cyber Security', 'Multi-Cloud', 'Data and AI', 'Networking', 'Application Services']

const EMAIL_REGEX = /^[^\s@]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/
const NAME_REGEX = /^[A-Za-z\s]+$/

function validateUserForm(form: { email: string; first_name: string; last_name: string; department: string }): string | null {
  const email = form.email.trim()
  const firstName = form.first_name.trim()
  const lastName = form.last_name.trim()

  if (!email) return 'Email is required in order to create the user'
  if (!firstName) return 'First name is required in order to create the user'
  if (!lastName) return 'Last name is required in order to create the user'
  if (!form.department) return 'Department is required in order to create the user'
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address'
  if (!NAME_REGEX.test(firstName)) return 'First name must only contain letters'
  if (!NAME_REGEX.test(lastName)) return 'Last name must only contain letters'
  return null
}

export default function UsersPage() {
  const { isAdmin, isSuperAdmin, user, logout } = useAuth()
  const navigate = useNavigate()

  const canDeleteUser = (target: KeycloakUserRecord): boolean => {
    if (target.user_id === user?.uid) return false
    if (isSuperAdmin) return true
    return target.group === 'user'
  }

  const canResetPassword = (target: KeycloakUserRecord): boolean => {
    if (isSuperAdmin) return true
    if (target.user_id === user?.uid) return true
    return target.group === 'user'
  }

  const [users, setUsers] = useState<KeycloakUserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_USER_FORM)

  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; temporary_password: string } | null>(null)
  const [resetCredentials, setResetCredentials] = useState<{ email: string; temporary_password: string; isSelf: boolean } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; label: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState<KeycloakUserRecord | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
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
      const result = await createUser({
        ...form,
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      })
      setShowCreate(false)
      setForm(EMPTY_USER_FORM)
      setCreatedCredentials({ email: result.email, temporary_password: result.temporary_password })
      await load()
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreate(false)
    setForm(EMPTY_USER_FORM)
    setCreateError(null)
  }

  const handleDeleteClick = (u: KeycloakUserRecord) => {
    setConfirmDelete({ id: u.user_id, label: u.email || u.user_id })
  }

  const confirmDeleteUser = async () => {
    if (!confirmDelete) return
    const { id } = confirmDelete
    setConfirmDelete(null)
    setDeleting(id)
    try {
      await deleteUser(id)
      await load()
    } catch (e: unknown) {
      setAlertMsg(e instanceof Error ? e.message : 'Failed to delete user')
    } finally {
      setDeleting(null)
    }
  }

  const handleResetPassword = async (u: KeycloakUserRecord) => {
    setResetting(u.user_id)
    try {
      const result = await resetPassword(u.user_id)
      setResetCredentials({
        email: u.email || u.user_id,
        temporary_password: result.temporary_password,
        isSelf: u.user_id === user?.uid,
      })
    } catch (e: unknown) {
      setAlertMsg(e instanceof Error ? e.message : 'Failed to reset password')
    } finally {
      setResetting(null)
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Users"
        subtitle="Manage who can use the transcription tool"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <UserPlus size={16} /> New User
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
                  {canResetPassword(u) && (
                    <button onClick={() => setConfirmReset(u)} disabled={resetting === u.user_id} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                      {resetting === u.user_id ? <Loader2 size={13} className="spin" /> : <KeyRound size={13} />} Reset Password
                    </button>
                  )}
                  {canDeleteUser(u) && (
                    <button
                      onClick={() => handleDeleteClick(u)}
                      disabled={deleting === u.user_id}
                      className="btn btn-outline-danger btn-sm"
                    >
                      {deleting === u.user_id ? <Loader2 size={13} className="spin" /> : <UserMinus size={13} />} Remove
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
            <div className="modal-title" style={{ marginBottom: '18px' }}>New User</div>

            <FormField label="Email" required>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" />
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
              <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="input">
                <option value="" disabled>Select a department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </FormField>

            <FormField label="Group" required>
              <select value={form.group} onChange={e => setForm({ ...form, group: e.target.value as UserGroup })} className="input">
                {availableGroups(isSuperAdmin).map(g => <option key={g} value={g}>{groupLabel(g)}</option>)}
              </select>
            </FormField>

            {createError && <div className="alert danger" style={{ marginTop: '14px' }}>{createError}</div>}

            <div className="modal-actions" style={{ marginTop: '22px' }}>
              <button onClick={handleCancelCreate} className="btn btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="btn btn-primary">
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {createdCredentials && (
        <CredentialsModal
          title="User Created"
          email={createdCredentials.email}
          temporaryPassword={createdCredentials.temporary_password}
          onClose={() => setCreatedCredentials(null)}
        />
      )}

      {resetCredentials && (
        <CredentialsModal
          title="Password Reset"
          email={resetCredentials.email}
          temporaryPassword={resetCredentials.temporary_password}
          extraWarning={resetCredentials.isSelf ? 'You will be logged out immediately when this modal closes.' : undefined}
          onClose={() => {
            const wasSelf = resetCredentials.isSelf
            setResetCredentials(null)
            if (wasSelf) logout()
          }}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Remove user"
          message={`Remove "${confirmDelete.label}" from Keycloak? This cannot be undone.`}
          confirmLabel="Remove"
          cancelLabel="Cancel"
          danger
          onConfirm={confirmDeleteUser}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmReset && (
        <Modal
          title="Reset password"
          message={
            confirmReset.user_id === user?.uid
              ? 'Reset your own password? You will be issued a new temporary password and logged out immediately.'
              : `Reset the password for "${confirmReset.email || confirmReset.user_id}"? They will be issued a new temporary password immediately.`
          }
          confirmLabel="Reset"
          cancelLabel="Cancel"
          danger
          onConfirm={() => {
            const target = confirmReset
            setConfirmReset(null)
            handleResetPassword(target)
          }}
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
