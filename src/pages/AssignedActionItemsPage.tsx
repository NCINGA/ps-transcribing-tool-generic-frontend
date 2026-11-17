import { useEffect, useState } from 'react'
import { Loader2, ListChecks, FileAudio } from 'lucide-react'
import { fetchActionItems } from '../api'
import type { ActionItem } from '../types'
import ActionItemsSection from '../components/transcript/ActionItemsSection'
import PageHeader from '../components/PageHeader'

interface JobWithActionItems {
  id: string
  filename: string
  completed_at: string | null
  action_items: ActionItem[]
  action_items_done: number[]
}

export default function AssignedActionItemsPage() {
  const [jobs, setJobs] = useState<JobWithActionItems[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchActionItems()
      .then(setJobs)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load action items'))
  }, [])

  return (
    <div className="page">
      <PageHeader title="Action Items" subtitle="Track shared action items from recent meetings." />

      {error && <div className="alert danger">{error}</div>}

      {!jobs && !error ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Loader2 size={24} className="spin" /></div>
      ) : jobs && jobs.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="icon-chip"><ListChecks size={24} /></span>
            <h3>No action items yet</h3>
          </div>
        </div>
      ) : (
        jobs?.map(job => (
          <div key={job.id} style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 4px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
              <FileAudio size={15} /> {job.filename}
              {job.completed_at && <span style={{ fontWeight: 400 }}>· {new Date(job.completed_at).toLocaleDateString()}</span>}
            </div>
            <ActionItemsSection items={job.action_items} jobId={job.id} doneIndexes={job.action_items_done} />
          </div>
        ))
      )}
    </div>
  )
}
