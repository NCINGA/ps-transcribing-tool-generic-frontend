import type { ActionItem, FileRecord, Job } from './types'

const date = new Date().toISOString()
const actionItems: ActionItem[] = [
  { task: 'Share the onboarding checklist with the team.', assigned_to: 'Maya', deadline: 'Friday', priority: 'medium' },
]

export const previewJob: Job = {
  id: 'sample-meeting',
  filename: 'Project kickoff.wav',
  language: 'english',
  status: 'completed',
  chunk_count: 1,
  created_at: date,
  updated_at: date,
  started_at: date,
  completed_at: date,
  error_message: null,
  full_transcription: '[00:00:00] Maya: Let’s confirm the scope for the first release.\n[00:00:08] Sam: We’ll start with file uploads and transcript review.\n[00:00:17] Maya: I’ll share the onboarding checklist by Friday.',
  pm_summary: 'The team agreed to focus the first release on file uploads and transcript review.',
  action_items: actionItems,
  decisions_made: [
    { decision: 'Focus the first release on uploads and transcript review.', context: 'The team agreed on the initial release scope.', stakeholders: ['Maya', 'Sam'] },
  ],
}

export const previewFile: FileRecord = {
  id: 'sample-recording',
  file_key: 'sample-recording',
  filename: previewJob.filename,
  file_size: 7_680_000,
  content_type: 'audio/wav',
  duration_seconds: 480,
  bucket: '',
  discovered_at: date,
  language_statuses: { english: 'completed', sinhala: null, tamil: null, raw: null },
  language_job_ids: { english: previewJob.id, sinhala: null, tamil: null, raw: null },
}

export function previewUsage(days: number) {
  return {
    range_days: days,
    range_total_hours: 480 / 3600,
    all_time_total_hours: 480 / 3600,
    daily: [{ date: date.slice(0, 10), hours: 480 / 3600 }],
  }
}
