import {useEffect, useRef, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, UploadCloud, RefreshCw, Trash2, FileAudio, FileVideo, Sparkles, Eye, RotateCcw, FolderOpen, Clock, HardDrive, CalendarDays, CheckCircle2 } from 'lucide-react'
import { fetchFiles, triggerJob, deleteFile } from '../api'
import { useConnectivity } from '../contexts/ConnectivityContext'
import { useUpload } from '../contexts/UploadContext'
import { useJobTracker } from '../contexts/JobTrackerContext'
import type { FileRecord, TranscriptLanguage } from '../types'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import PageHeader from '../components/PageHeader'
import { isPreview } from '../lib/firebase'

const LANGUAGES: TranscriptLanguage[] = ['english', 'sinhala', 'tamil', 'raw']

const MAX_UPLOAD_SIZE = 500 * 1024 * 1024 // 500MB
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg', '.mp4', '.mov', '.mkv', '.webm', '.avi']

function formatBytes(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '-'
  const totalSeconds = Math.round(seconds)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

const LANG_LABEL: Record<TranscriptLanguage, string> = { english: 'English', sinhala: 'Sinhala', tamil: 'Tamil', raw: 'Raw' }
const LANG_HINT: Record<TranscriptLanguage, string> = {
  english: 'Translated to English', sinhala: 'Translated to Sinhala', tamil: 'Translated to Tamil', raw: 'Original, verbatim',
}

function LanguageTile({
  status,
  jobId,
  fileId,
  language,
  busy,
  onGenerate,
}: {
  status: string | null
  jobId: string | null
  fileId: string
  language: TranscriptLanguage
  busy: boolean
  onGenerate: (fileId: string, language: TranscriptLanguage) => void
}) {
  const navigate = useNavigate()
  const state = busy ? 'processing'
    : status === 'pending' || status === 'processing' ? 'processing'
    : status === 'completed' && jobId ? 'completed'
    : status === 'failed' ? 'failed'
    : 'idle'

  return (
    <div className={`lang-tile ${state}`}>
      <div className="lang-tile-top">
        <span className="lang-tile-name">{LANG_LABEL[language]}</span>
        {state === 'completed' && <CheckCircle2 size={16} className="lang-tile-check" />}
      </div>
      <div className="lang-tile-hint">
        {state === 'processing' ? (status === 'pending' ? 'Queued…' : 'Transcribing…')
          : state === 'failed' ? 'Something went wrong'
          : state === 'completed' ? 'Ready to read'
          : LANG_HINT[language]}
      </div>
      {state === 'processing' && (
        <div className="lang-tile-btn pill warning" style={{ justifyContent: 'center' }}>
          <Loader2 size={13} className="spin" /> In progress
        </div>
      )}
      {state === 'idle' && (
        <button onClick={() => onGenerate(fileId, language)} disabled={isPreview} className="btn btn-soft btn-sm lang-tile-btn">
          <Sparkles size={13} /> Generate
        </button>
      )}
      {state === 'completed' && (
        <button onClick={() => navigate(`/transcript/${jobId}`)} className="btn btn-success btn-sm lang-tile-btn">
          <Eye size={13} /> View transcript
        </button>
      )}
      {state === 'failed' && (
        <button onClick={() => onGenerate(fileId, language)} className="btn btn-danger-soft btn-sm lang-tile-btn">
          <RotateCcw size={13} /> Retry
        </button>
      )}
    </div>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function FilesPage() {
  const { isOnline, markOffline } = useConnectivity()
  const { activeUpload, uploadVersion, startUpload } = useUpload()
  const { trackedJobs, watchJob, syncFromFileList, resolvedEvents, clearResolvedEvents } = useJobTracker()
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [triggering, setTriggering] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [uploadLanguage, setUploadLanguage] = useState<TranscriptLanguage>('raw')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; filename: string } | null>(null)
  const [alertMsg, setAlertMsg] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 10

  const showUploadError = (msg: string) => {
    setUploadError(msg)
    setTimeout(() => setUploadError(null), 10000)
  }

  // Every load() call is allowed to actually run -- it used to bail out
  // immediately via `if (busy) return` whenever another call was already in
  // flight, which was fine back when the only callers were a user click or
  // the one-time mount effect, but silently drops a call now that the job
  // tracker also calls load() on its own after a job resolves, with nothing
  // else to retry it. Each call gets a ticket instead; only the most
  // recently issued one is allowed to apply its result, so an older,
  // slower response can never overwrite a newer one, and nothing important
  // is ever thrown away unactioned. `busy` itself is kept only for the
  // Refresh button's disabled/"Working..." display.
  const requestSeqRef = useRef(0)

  const load = async () => {
    const seq = ++requestSeqRef.current
    setBusy(true)
    try {
      const data = await fetchFiles(page, PAGE_SIZE)
      if (seq !== requestSeqRef.current) return // superseded by a newer request
      setFiles(data.files)
      setTotal(data.total)
      setError(null)
      syncFromFileList(data.files)
    } catch (e: unknown) {
      if (seq !== requestSeqRef.current) return
      setError(e instanceof Error ? e.message : 'Failed to load files')
    } finally {
      setLoading(false)
      if (seq === requestSeqRef.current) setBusy(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, uploadVersion])

  // Picks up jobs the global tracker just saw resolve (completed or failed)
  // -- refreshes the file list once so statuses/transcripts are current,
  // and surfaces a friendly error for anything that failed.
  useEffect(() => {
    if (resolvedEvents.length === 0) return
    const failed = resolvedEvents.filter(e => e.status === 'failed')
    if (failed.length > 0) {
      showUploadError('Transcription failed. Please check your connection and try again.')
    }
    load()
    clearResolvedEvents(resolvedEvents.map(e => e.jobId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedEvents])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const processFile = async (file: File) => {
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      showUploadError(`Unsupported file format. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`)
      return
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      showUploadError('File exceeds 500MB limit.')
      return
    }

    setUploadError(null)
    try {
      const { file_id, job_id } = await startUpload(file, uploadLanguage)
      watchJob(file_id, uploadLanguage, job_id)
      await load()
    } catch (err: unknown) {
      showUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
    e.target.value = ''
  }

  const handleDelete = (fileId: string, filename: string) => {
    setConfirmDelete({ id: fileId, filename })
  }

  const confirmDeleteFile = async () => {
    if (!confirmDelete) return
    const { id } = confirmDelete
    setConfirmDelete(null)
    setDeleting(id)
    try {
      await deleteFile(id)
      await load()
    } catch (e: unknown) {
      setAlertMsg(e instanceof Error ? e.message : 'Failed to delete file')
    } finally {
      setDeleting(null)
    }
  }

  const handleGenerate = async (fileId: string, language: TranscriptLanguage) => {
    if (!isOnline) {
      showUploadError('Cannot connect to the internet. Your network may be connected but without internet access. Please try again once your connection is restored.')
      return
    }

    const key = `${fileId}-${language}`
    setTriggering(prev => new Set(prev).add(key))
    try {
      const { job_id } = await triggerJob(fileId, language)
      watchJob(fileId, language, job_id)
      await load()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e: unknown) {
      markOffline()
      showUploadError('Cannot connect to the internet. Your network may be connected but without internet access. Please try again once your connection is restored.')
    } finally {
      setTriggering(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Session Files"
        subtitle="Max file size: 500MB"
        actions={
          <>
            <button onClick={load} disabled={busy} className="btn btn-secondary">
              <RefreshCw size={15} className={busy ? 'spin' : ''} /> {busy ? 'Working...' : 'Refresh'}
            </button>
            <select aria-label="Transcription language" className="input"
              value={uploadLanguage} onChange={event => setUploadLanguage(event.target.value as TranscriptLanguage)}
              disabled={isPreview || !!activeUpload}>
              {LANGUAGES.map(language => <option key={language} value={language}>{LANG_LABEL[language]}</option>)}
            </select>
            <button onClick={handleUploadClick} disabled={isPreview || !!activeUpload} className="btn btn-primary">
              {activeUpload ? <Loader2 size={16} className="spin" /> : <UploadCloud size={16} />}
              {activeUpload ? 'Uploading...' : 'Upload'}
            </button>
          </>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(',')}
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />

      {activeUpload && (
        <div className="alert info" style={{ alignItems: 'center', minWidth: 0 }}>
          <Loader2 size={16} className="spin" style={{ flexShrink: 0 }} />
          <span title={activeUpload.filename} style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Uploading: <strong>{activeUpload.filename}</strong>
          </span>
        </div>
      )}

      {uploadError && <div className="alert danger">{uploadError}</div>}
      {error && <div className="alert danger">{error}</div>}

      {loading && files.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '168px', borderRadius: '16px' }} />)}
        </div>
      ) : files.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="icon-chip"><FolderOpen size={24} /></span>
            <h3>No files yet</h3>
            <p>Upload audio or video files to get started.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="file-list">
            {files.map((file) => {
              const isVideo = (file.content_type || '').startsWith('video')
              const done = LANGUAGES.filter(l => file.language_statuses[l] === 'completed').length
              return (
                <article key={file.id} className="card file-card">
                  <header className="file-card-head">
                    <span className={`file-icon ${isVideo ? 'video' : ''}`}>
                      {isVideo ? <FileVideo size={22} /> : <FileAudio size={22} />}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 className="file-name" title={file.filename}>{file.filename}</h3>
                      <div className="file-meta">
                        <span><Clock size={13} /> {formatDuration(file.duration_seconds)}</span>
                        <span><HardDrive size={13} /> {formatBytes(file.file_size)}</span>
                        <span><CalendarDays size={13} /> {formatDate(file.discovered_at)}</span>
                        <span className="pill" style={{ textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.05em' }}>
                          {isVideo ? 'Video' : 'Audio'}
                        </span>
                      </div>
                    </div>
                    <span className={`pill ${done > 0 ? 'success' : ''}`} title="Completed transcripts">
                      {done}/{LANGUAGES.length} done
                    </span>
                    <button
                      onClick={() => handleDelete(file.id, file.filename)}
                      disabled={isPreview || deleting === file.id}
                      className="btn btn-ghost btn-icon"
                      title="Delete file"
                      aria-label={`Delete ${file.filename}`}
                      style={{ color: 'var(--danger)' }}
                    >
                      {deleting === file.id ? <Loader2 size={17} className="spin" /> : <Trash2 size={17} />}
                    </button>
                  </header>

                  <div className="lang-grid">
                    {LANGUAGES.map((lang) => {
                      const jobId = file.language_job_ids[lang]
                      const liveStatus = jobId ? trackedJobs.get(jobId)?.status : undefined
                      return (
                        <LanguageTile
                          key={lang}
                          status={liveStatus || file.language_statuses[lang]}
                          jobId={jobId}
                          fileId={file.id}
                          language={lang}
                          busy={triggering.has(`${file.id}-${lang}`)}
                          onGenerate={handleGenerate}
                        />
                      )
                    })}
                  </div>
                </article>
              )
            })}
          </div>
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}

      {confirmDelete && (
        <Modal
          title="Delete file"
          message={`Delete "${confirmDelete.filename}"? This removes the file and all its transcripts. This cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={confirmDeleteFile}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {alertMsg && (
        <Modal
          title="Error"
          message={alertMsg}
          confirmLabel="OK"
          onConfirm={() => setAlertMsg(null)}
        />
      )}
    </div>
  )
}
