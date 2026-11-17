import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Clipboard, Check, KeyRound, Download } from 'lucide-react'

interface CredentialsModalProps {
  title: string
  email: string
  temporaryPassword: string
  extraWarning?: string
  onClose: () => void
}

export default function CredentialsModal({ title, email, temporaryPassword, extraWarning, onClose }: CredentialsModalProps) {
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null)

  const infoText = `Email: ${email}\nTemporary Password: ${temporaryPassword}`

  const handleCopyField = async (field: 'email' | 'password', value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // clipboard API can fail (permissions, non-secure context) -- fall
      // back silently, the download button still works as an alternative
    }
  }

  const handleDownload = () => {
    const blob = new Blob([infoText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${email}-credentials.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyBtn = (field: 'email' | 'password', value: string, label: string) => (
    <button
      onClick={() => handleCopyField(field, value)}
      title={label}
      className="btn btn-ghost btn-icon"
      style={{ color: copiedField === field ? 'var(--success)' : undefined }}
    >
      {copiedField === field ? <Check size={15} /> : <Clipboard size={15} />}
    </button>
  )

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '460px' }} role="dialog" aria-modal="true">
        <div className="modal-icon"><KeyRound size={22} /></div>
        <div className="modal-title">{title}</div>

        <div style={{
          background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '6px 6px 6px 14px', margin: '14px 0 14px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '13px', color: 'var(--text)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
              <span style={{ color: 'var(--text-muted)' }}>Email </span>{email}
            </span>
            {copyBtn('email', email, 'Copy email')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid var(--border)' }}>
            <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
              <span style={{ color: 'var(--text-muted)' }}>Password </span>{temporaryPassword}
            </span>
            {copyBtn('password', temporaryPassword, 'Copy password')}
          </div>
        </div>

        <button onClick={handleDownload} className="btn btn-secondary btn-sm" style={{ marginBottom: '18px' }}>
          <Download size={14} /> Download as .txt
        </button>

        <div className="alert danger" style={{ marginBottom: extraWarning ? '10px' : '22px', fontWeight: 600 }}>
          You must save this information now. It will not be shown again.
        </div>
        {extraWarning && (
          <div className="alert danger" style={{ marginBottom: '22px', fontWeight: 600 }}>{extraWarning}</div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-primary">Done</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
