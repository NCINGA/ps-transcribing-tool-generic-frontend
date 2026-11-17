import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { fetchJob } from '../api'
import type { FileRecord, TranscriptLanguage } from '../types'

const POLL_INTERVAL_MS = 15000
const LANGUAGES: TranscriptLanguage[] = ['english', 'sinhala', 'tamil', 'raw']

export type TrackedStatus = 'pending' | 'processing'

interface TrackedJob {
  fileId: string
  language: TranscriptLanguage
  status: TrackedStatus
}

export interface ResolvedJobEvent {
  jobId: string
  fileId: string
  language: TranscriptLanguage
  status: 'completed' | 'failed'
}

interface JobTrackerContextValue {
  // jobId -> live status, for any file/language currently mid-flight. Lets
  // StatusCell show "Uploading..." vs "Processing..." without waiting for
  // the next full file-list fetch, and keeps working across route changes
  // since this provider never unmounts (same pattern as UploadContext).
  trackedJobs: Map<string, TrackedJob>
  // Called right after a Generate click succeeds, so tracking survives the
  // user navigating away from Files and back.
  watchJob: (fileId: string, language: TranscriptLanguage, jobId: string) => void
  // Called from FilesPage's own load() -- backfills anything already
  // pending/processing after a hard refresh (which wipes this context).
  syncFromFileList: (files: FileRecord[]) => void
  // Jobs that just resolved (completed or failed) since the last time the
  // consumer looked -- FilesPage uses this to refresh its file list and to
  // show a failure toast, then clears what it has handled.
  resolvedEvents: ResolvedJobEvent[]
  clearResolvedEvents: (jobIds: string[]) => void
}

const JobTrackerContext = createContext<JobTrackerContextValue | undefined>(undefined)

export function JobTrackerProvider({ children }: { children: ReactNode }) {
  const [trackedJobs, setTrackedJobs] = useState<Map<string, TrackedJob>>(new Map())
  const [resolvedEvents, setResolvedEvents] = useState<ResolvedJobEvent[]>([])
  const trackedJobsRef = useRef(trackedJobs)
  useEffect(() => {
    trackedJobsRef.current = trackedJobs
  }, [trackedJobs])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const addTracked = (jobId: string, job: TrackedJob) => {
    setTrackedJobs(prev => {
      if (prev.has(jobId)) return prev
      const next = new Map(prev)
      next.set(jobId, job)
      return next
    })
  }

  const watchJob = (fileId: string, language: TranscriptLanguage, jobId: string) => {
    addTracked(jobId, { fileId, language, status: 'pending' })
  }

  const syncFromFileList = (files: FileRecord[]) => {
    for (const file of files) {
      for (const language of LANGUAGES) {
        const status = file.language_statuses[language]
        const jobId = file.language_job_ids[language]
        if (jobId && (status === 'pending' || status === 'processing')) {
          addTracked(jobId, { fileId: file.id, language, status })
        }
      }
    }
  }

  const clearResolvedEvents = (jobIds: string[]) => {
    setResolvedEvents(prev => prev.filter(e => !jobIds.includes(e.jobId)))
  }

  // Pulled out to component scope (rather than defined inside the interval
  // effect below) so both the interval AND the visibility-change effect can
  // call the exact same check -- it only ever reads trackedJobsRef.current
  // and calls stable setters, so it's always safe to call fresh regardless
  // of which effect triggered it.
  const tick = async () => {
    const current = trackedJobsRef.current
    if (current.size === 0) return

    const results = await Promise.all(
      Array.from(current.entries()).map(async ([jobId, tracked]) => {
        try {
          const job = await fetchJob(jobId)
          return { jobId, tracked, status: job.status }
        } catch {
          return { jobId, tracked, status: null }
        }
      })
    )

    // Decide what resolved and what's still active as plain values FIRST,
    // before touching any state setter -- previously this was computed by
    // mutating an array from inside setTrackedJobs's updater function,
    // which relies on that updater having already run by the time the
    // code below checks it. React doesn't guarantee that ordering, so the
    // "go refresh now" signal could end up never being sent even though
    // the job genuinely finished.
    const resolved: ResolvedJobEvent[] = results
      .filter(r => r.status === 'completed' || r.status === 'failed')
      .map(r => ({
        jobId: r.jobId,
        fileId: r.tracked.fileId,
        language: r.tracked.language,
        status: r.status as 'completed' | 'failed',
      }))
    const stillActive = results.filter(r => r.status === 'pending' || r.status === 'processing')

    setTrackedJobs(prev => {
      const next = new Map(prev)
      for (const { jobId } of resolved) {
        next.delete(jobId)
      }
      for (const { jobId, tracked, status } of stillActive) {
        next.set(jobId, { ...tracked, status: status as TrackedStatus })
      }
      return next
    })
    if (resolved.length > 0) {
      setResolvedEvents(prev => [...prev, ...resolved])
    }
  }

  useEffect(() => {
    if (trackedJobs.size === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    // Guard against a duplicate interval when effects are restarted in development.
    if (intervalRef.current) return

    intervalRef.current = setInterval(tick, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [trackedJobs.size > 0])

  // Background tabs get their timers throttled by the browser (sometimes to
  // once a minute or less), so a long-running job's status can look
  // "stopped" simply because nobody's been looking at the tab. Firing one
  // immediate check the moment the tab becomes visible again means you
  // never have to wait out a throttled interval to see the real state.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && trackedJobsRef.current.size > 0) {
        tick()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <JobTrackerContext.Provider
      value={{ trackedJobs, watchJob, syncFromFileList, resolvedEvents, clearResolvedEvents }}
    >
      {children}
    </JobTrackerContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useJobTracker() {
  const ctx = useContext(JobTrackerContext)
  if (!ctx) throw new Error('useJobTracker must be used within JobTrackerProvider')
  return ctx
}
