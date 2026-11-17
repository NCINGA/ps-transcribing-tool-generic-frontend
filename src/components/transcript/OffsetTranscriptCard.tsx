import { useState } from 'react'
import { downloadOffsetPdf, downloadOffsetDocx } from '../../api'
import { Clock, Download, RotateCcw, Pencil, Check, X } from 'lucide-react'
import Modal from '../Modal'
import TranscriptLines from '../TranscriptLines'
import { useEditSessionKeepAlive } from '../../hooks/useEditSessionKeepAlive'
import { isPreview } from '../../lib/firebase'

interface OffsetTranscriptCardProps {
  originalTranscription: string
  jobId: string
  filename: string
  language: string
}

const TIMESTAMP_RE = /\[(\d{1,2}):(\d{2}):(\d{2})\]/g

function parseHMM(hmm: string, period: 'AM' | 'PM'): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hmm.trim())
  if (!match) return null
  let h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  if (h < 1 || h > 12 || m < 0 || m > 59) return null
  if (period === 'AM') h = h === 12 ? 0 : h
  else h = h === 12 ? 12 : h + 12
  return h * 3600 + m * 60
}

function formatTimeOfDay(totalSeconds: number): string {
  const wrapped = ((totalSeconds % 86400) + 86400) % 86400
  const h24 = Math.floor(wrapped / 3600)
  const m = Math.floor((wrapped % 3600) / 60)
  const s = wrapped % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  return `[${h12}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} ${period}]`
}

function applyOffset(text: string, offsetSeconds: number): string {
  return text.replace(TIMESTAMP_RE, (_match, hh, mm, ss) => {
    const original = parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60 + parseInt(ss, 10)
    return formatTimeOfDay(original + offsetSeconds)
  })
}

export default function OffsetTranscriptCard({ originalTranscription, jobId, filename, language }: OffsetTranscriptCardProps) {
  const [hmm, setHmm] = useState('')
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM')
  const [inputError, setInputError] = useState<string | null>(null)
  const [offsetText, setOffsetText] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const { sessionAtRisk } = useEditSessionKeepAlive(isEditing)

  function handleApplyOffset() {
    const seconds = parseHMM(hmm, period)
    if (seconds === null) {
      setInputError('Enter a valid time as H:MM (e.g. 2:14)')
      return
    }
    setInputError(null)
    setOffsetText(applyOffset(originalTranscription, seconds))
    setIsEditing(false)
  }

  function handleResetOffset() {
    setOffsetText(null)
    setIsEditing(false)
    setHmm('')
    setInputError(null)
  }

  function handleConfirmCancelEdit() {
    setIsEditing(false)
    setShowCancelConfirm(false)
  }

  async function handleDownload(format: 'pdf' | 'docx') {
    if (offsetText === null) return
    setDownloading(true)
    setDownloadError(null)
    try {
      const textToSend = isEditing ? editedText : offsetText
      if (format === 'pdf') {
        await downloadOffsetPdf(jobId, textToSend, `${filename}_${language}_offset.pdf`)
      } else {
        await downloadOffsetDocx(jobId, textToSend, `${filename}_${language}_offset.docx`)
      }
    } catch (e) {
      setDownloadError((e as Error).message)
    } finally {
      setDownloading(false)
    }
  }

  const displayedText = isEditing ? editedText : offsetText

  return (
    <div className="card card-pad mb-20">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: offsetText !== null || inputError || downloadError ? '16px' : 0 }}>
        <div className="card-head" style={{ marginBottom: 0, marginRight: '8px' }}>
          <span className="icon-chip warning"><Clock size={17} /></span>
          <h2 style={{ fontSize: '15px', fontWeight: 700 }}>View as Time of Day</h2>
        </div>
        <input
          type="text"
          placeholder="H:MM"
          value={hmm}
          onChange={e => setHmm(e.target.value)}
          className="input input-sm"
          style={{ width: '84px' }}
        />
        <select value={period} onChange={e => setPeriod(e.target.value as 'AM' | 'PM')} className="input input-sm" style={{ width: '78px' }}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
        <button onClick={handleApplyOffset} className="btn btn-primary btn-sm">Offset</button>
        {offsetText !== null && (
          <button onClick={handleResetOffset} className="btn btn-secondary btn-sm"><RotateCcw size={13} /> Reset Offset</button>
        )}
        {offsetText !== null && isEditing && (
          <button onClick={() => setShowCancelConfirm(true)} className="btn btn-secondary btn-sm"><X size={13} /> Cancel</button>
        )}
        {offsetText !== null && (
          <button
            onClick={() => {
              if (isEditing) {
                setOffsetText(editedText)
                setIsEditing(false)
              } else {
                setEditedText(offsetText)
                setIsEditing(true)
              }
            }}
            className="btn btn-secondary btn-sm"
          >
            {isEditing ? <Check size={13} /> : <Pencil size={13} />} {isEditing ? 'Done Editing' : 'Edit'}
          </button>
        )}
        {offsetText !== null && (
          <span style={{ display: 'inline-flex', gap: '8px', marginLeft: 'auto' }}>
            <button onClick={() => handleDownload('pdf')} disabled={isPreview || downloading} className="btn btn-soft btn-sm">
              <Download size={13} /> {downloading ? 'Downloading...' : 'PDF'}
            </button>
            <button onClick={() => handleDownload('docx')} disabled={isPreview || downloading} className="btn btn-soft btn-sm">
              <Download size={13} /> {downloading ? 'Downloading...' : 'DOCX'}
            </button>
          </span>
        )}
      </div>

      {inputError && <div className="alert danger">{inputError}</div>}
      {downloadError && <div className="alert danger">{downloadError}</div>}
      {sessionAtRisk && (
        <div className="alert danger">
          Your session may have expired. Please copy your changes somewhere safe soon -- you may need to sign in again.
        </div>
      )}

      {displayedText !== null && (
        isEditing ? (
          <textarea
            value={editedText}
            onChange={e => setEditedText(e.target.value)}
            className="input"
            style={{ minHeight: '400px', padding: '14px' }}
          />
        ) : (
          <TranscriptLines text={displayedText} />
        )
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
