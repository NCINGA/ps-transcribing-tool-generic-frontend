import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchJob, updateTranscript } from '../api'
import type { Job } from '../types'
import TranscriptHeader from '../components/transcript/TranscriptHeader'
import AudioPlayerBar from '../components/transcript/AudioPlayerBar'
import SummaryCard from '../components/transcript/SummaryCard'
import TranscriptCard from '../components/transcript/TranscriptCard'
import ActionItemsSection from '../components/transcript/ActionItemsSection'
import DecisionsSection from '../components/transcript/DecisionsSection'
import RisksSection from '../components/transcript/RisksSection'
import OffsetTranscriptCard from '../components/transcript/OffsetTranscriptCard'

export default function TranscriptPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) return
    fetchJob(jobId)
      .then(setJob)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [jobId])

  const handleSaveTranscript = async (text: string) => {
    if (!jobId || !job) return
    await updateTranscript(jobId, text)
    setJob({ ...job, full_transcription: text })
  }

  if (loading) return (
    <div className="page">
      <div className="skeleton" style={{ height: '150px', borderRadius: '16px', marginBottom: '20px' }} />
      <div className="skeleton" style={{ height: '110px', borderRadius: '16px', marginBottom: '20px' }} />
      <div className="skeleton" style={{ height: '320px', borderRadius: '16px' }} />
    </div>
  )

  if (error) return (
    <div className="page">
      <div className="alert danger">{error}</div>
    </div>
  )

  if (!job) return null

  const hasInsights = (job.action_items && job.action_items.length > 0)
    || (job.decisions_made && job.decisions_made.length > 0)
    || (job.risks_and_blockers && job.risks_and_blockers.length > 0)

  const hasAside = !!job.pm_summary || hasInsights

  return (
    <div className="page page-wide">
      <TranscriptHeader job={job} />

      <div className="tx-layout" style={!hasAside ? { gridTemplateColumns: 'minmax(0, 1fr)' } : undefined}>
        <div className="tx-main">
          {job.file_id && <AudioPlayerBar fileId={job.file_id} />}

          {job.full_transcription !== undefined && (
            <OffsetTranscriptCard
              originalTranscription={job.full_transcription}
              jobId={job.id}
              filename={job.filename}
              language={job.language}
            />
          )}

          {job.full_transcription !== undefined && (
            <TranscriptCard
              fullTranscription={job.full_transcription}
              onSave={handleSaveTranscript}
            />
          )}
        </div>

        {hasAside && (
          <aside className="tx-aside">
            {job.pm_summary && <SummaryCard summary={job.pm_summary} />}
            {job.action_items && job.action_items.length > 0 && (
              <ActionItemsSection items={job.action_items} jobId={job.id} doneIndexes={job.action_items_done ?? []} />
            )}
            {job.decisions_made && job.decisions_made.length > 0 && (
              <DecisionsSection decisions={job.decisions_made} />
            )}
            {job.risks_and_blockers && job.risks_and_blockers.length > 0 && (
              <RisksSection risks={job.risks_and_blockers} />
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
