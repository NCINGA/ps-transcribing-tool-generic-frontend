import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Download, FileText, Languages, Layers, CalendarCheck, ScanSearch } from 'lucide-react'
import type { Job } from '../../types'
import { downloadJobPdf, downloadJobDocx } from '../../api'

export default function TranscriptHeader({ job }: { job: Job }) {
  const navigate = useNavigate()
  return (
    <div style={{ marginBottom: '24px' }}>
      <button onClick={() => navigate('/files')} className="btn btn-ghost btn-sm" style={{ marginLeft: '-10px', marginBottom: '8px' }}>
        <ChevronLeft size={16} /> Back to Files
      </button>

      <div className="tx-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
          <span className="tx-head-icon"><FileText size={24} /></span>
          <div style={{ minWidth: 0 }}>
            <h1 className="tx-title">{job.filename}</h1>
            <div className="tx-meta">
              <Meta icon={<Languages size={14} />} label="Language" value={job.language} />
              <Meta icon={<Layers size={14} />} label="Chunks" value={job.chunk_count ?? '—'} />
              {job.completed_at && <Meta icon={<CalendarCheck size={14} />} label="Completed" value={new Date(job.completed_at).toLocaleString()} />}
              {job.detected_languages && job.detected_languages.length > 0 && (
                <Meta icon={<ScanSearch size={14} />} label="Detected" value={job.detected_languages.join(', ')} />
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={() => downloadJobPdf(job.id, `${job.filename}_${job.language}.pdf`)} className="btn btn-primary">
            <Download size={15} /> Download PDF
          </button>
          <button onClick={() => downloadJobDocx(job.id, `${job.filename}_${job.language}.docx`)} className="btn btn-secondary">
            <Download size={15} /> Download DOCX
          </button>
        </div>
      </div>
    </div>
  )
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <span className="tx-meta-item">
      <span style={{ display: 'inline-flex', color: 'var(--primary)' }}>{icon}</span>
      {label}: <strong>{value}</strong>
    </span>
  )
}
