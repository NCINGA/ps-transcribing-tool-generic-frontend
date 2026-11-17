import { useState } from 'react'
import { Pencil, Check, X, ScrollText } from 'lucide-react'
import Modal from '../Modal'
import TranscriptLines from '../TranscriptLines'
import { useEditSessionKeepAlive } from '../../hooks/useEditSessionKeepAlive'
import { isPreview } from '../../lib/firebase'

interface TranscriptCardProps {
  fullTranscription: string
  onSave: (text: string) => Promise<void>
}

export default function TranscriptCard({ fullTranscription, onSave }: TranscriptCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [showEditConfirm, setShowEditConfirm] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { sessionAtRisk } = useEditSessionKeepAlive(isEditing)

  function handleConfirmEdit() {
    setEditedText(fullTranscription)
    setIsEditing(true)
    setShowEditConfirm(false)
  }

  function handleConfirmCancelEdit() {
    setIsEditing(false)
    setShowCancelConfirm(false)
    setError(null)
  }

  async function handleConfirmSave() {
    setSaving(true)
    try {
      await onSave(editedText)
      setIsEditing(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
      setShowSaveConfirm(false)
    }
  }

  return (
    <div className="card card-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
        <div className="card-head" style={{ marginBottom: 0 }}>
          <span className="icon-chip"><ScrollText size={17} /></span>
          <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Full Transcription</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isEditing && (
            <button onClick={() => setShowCancelConfirm(true)} disabled={saving} className="btn btn-secondary btn-sm">
              <X size={14} /> Cancel
            </button>
          )}
          <button
            onClick={() => isEditing ? setShowSaveConfirm(true) : setShowEditConfirm(true)}
            disabled={isPreview || saving}
            className={`btn btn-sm ${isEditing ? 'btn-primary' : 'btn-secondary'}`}
          >
            {isEditing ? <Check size={14} /> : <Pencil size={14} />}
            {isEditing ? (saving ? 'Saving...' : 'Save') : 'Edit'}
          </button>
        </div>
      </div>

      {error && <div className="alert danger">{error}</div>}

      {sessionAtRisk && (
        <div className="alert danger">
          Your session may have expired. Please copy your changes somewhere safe and save soon -- you may need to sign in again.
        </div>
      )}

      {isEditing ? (
        <textarea
          value={editedText}
          onChange={e => setEditedText(e.target.value)}
          className="input"
          style={{ minHeight: '500px', padding: '14px' }}
        />
      ) : (
        <TranscriptLines text={fullTranscription} />
      )}

      {showEditConfirm && (
        <Modal
          title="Edit Transcript"
          message="Any changes made will overwrite the original transcript. Are you sure you want to overwrite this transcript? Once saved, the original version cannot be retrieved. You may want to download an original copy first."
          confirmLabel="Edit"
          cancelLabel="Cancel"
          onConfirm={handleConfirmEdit}
          onCancel={() => setShowEditConfirm(false)}
        />
      )}

      {showSaveConfirm && (
        <Modal
          title="Save Transcript"
          message="Save this transcript?"
          confirmLabel="Save"
          cancelLabel="Keep Editing"
          onConfirm={handleConfirmSave}
          onCancel={() => setShowSaveConfirm(false)}
        />
      )}

      {showCancelConfirm && (
        <Modal
          title="Cancel Editing"
          message="Are you sure you want to cancel? Any unsaved changes will be lost."
          confirmLabel="Cancel"
          cancelLabel="Back to Editing"
          danger
          onConfirm={handleConfirmCancelEdit}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </div>
  )
}
