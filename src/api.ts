import type { ActionItem, FileRecord, Job, TranscriptLanguage, KeycloakUserRecord, UserGroup, UsageStats, MonthlyUsageGauge, OrgUsageByLaptop } from './types'
import keycloak from './lib/keycloak'

// Injected at container start via config.js -- see keycloak.ts for details.
const BASE = (window as { __APP_CONFIG__?: Record<string, string> }).__APP_CONFIG__?.apiBaseUrl
if (!BASE) throw new Error('Missing __APP_CONFIG__.apiBaseUrl -- config.js was not injected correctly')

async function authHeaders(extra?: HeadersInit): Promise<HeadersInit> {
  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(30)
    } catch {
      keycloak.login()
    }
  }
  return {
    ...(keycloak.token ? { Authorization: `Bearer ${keycloak.token}` } : {}),
    ...extra,
  }
}

function extractErrorMessage(detail: unknown): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map(d => (d && typeof d === 'object' && 'msg' in d) ? String((d as { msg: unknown }).msg) : String(d))
      .join('; ')
  }
  return 'Request failed'
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    await keycloak.login()
    throw new Error('Session expired. Please sign in again.')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractErrorMessage(err.detail))
  }
  return res.json()
}

export async function fetchFiles(page = 1, pageSize = 10): Promise<{ files: FileRecord[]; total: number }> {
  const res = await fetch(`${BASE}/v1/files?page=${page}&page_size=${pageSize}`, { headers: await authHeaders() })
  return handle(res)
}

export async function triggerJob(file_id: string, language: TranscriptLanguage): Promise<{ job_id: string }> {
  const res = await fetch(`${BASE}/v1/jobs`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ file_id, language }),
  })
  return handle(res)
}

export async function fetchJob(job_id: string): Promise<Job> {
  const res = await fetch(`${BASE}/v1/jobs/${job_id}`, { headers: await authHeaders() })
  return handle(res)
}

export async function fetchAllJobs(page = 1, pageSize = 10): Promise<{ jobs: Job[]; total: number }> {
  const res = await fetch(`${BASE}/v1/jobs?page=${page}&page_size=${pageSize}`, { headers: await authHeaders() })
  return handle(res)
}

export async function fetchJobStats(): Promise<{
  total: number; completed: number; processing: number; failed: number
  english: number; sinhala: number; tamil: number; raw: number
}> {
  const res = await fetch(`${BASE}/v1/jobs/stats`, { headers: await authHeaders() })
  const data = await handle<{ stats: {
    total: number; completed: number; processing: number; failed: number
    english: number; sinhala: number; tamil: number; raw: number
  } }>(res)
  return data.stats
}

async function reportUploadFailed(fileId: string): Promise<void> {
  try {
    await fetch(`${BASE}/v1/files/${fileId}/fail`, {
      method: 'POST',
      headers: await authHeaders(),
    })
  } catch {
    // best-effort cleanup signal — swallow errors here so the original
    // upload failure is what surfaces to the user, not this
  }
}

export async function uploadFile(file: File): Promise<{ file_id: string }> {
  const urlRes = await fetch(`${BASE}/v1/files/upload-url`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      filename: file.name,
      content_type: file.type || 'application/octet-stream',
      size: file.size,
    }),
  })
  const { file_id, upload_url } = await handle<{ file_id: string; upload_url: string }>(urlRes)

  try {
    const uploadRes = await fetch(upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    if (!uploadRes.ok) {
      throw new Error('Failed to upload file to storage')
    }
  } catch (err) {
    await reportUploadFailed(file_id)
    throw err
  }

  const confirmRes = await fetch(`${BASE}/v1/files/${file_id}/confirm`, {
    method: 'POST',
    headers: await authHeaders(),
  })
  await handle(confirmRes)

  return { file_id }
}

export async function deleteFile(fileId: string): Promise<void> {
  const res = await fetch(`${BASE}/v1/files/${fileId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  await handle(res)
}

export async function fetchFilePresignedUrl(fileId: string): Promise<{ url: string }> {
  const res = await fetch(`${BASE}/v1/files/${fileId}/presigned-url`, { headers: await authHeaders() })
  return handle(res)
}

export async function updateTranscript(job_id: string, full_transcription: string): Promise<void> {
  const res = await fetch(`${BASE}/v1/jobs/${job_id}/transcript`, {
    method: 'PATCH',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ full_transcription }),
  })
  await handle(res)
}

export async function fetchAssignedActionItems(): Promise<{
  id: string; filename: string; completed_at: string | null
  action_items: ActionItem[]; action_items_done: number[]
}[]> {
  const res = await fetch(`${BASE}/v1/jobs/action-items/assigned`, { headers: await authHeaders() })
  const data = await handle<{ jobs: { id: string; filename: string; completed_at: string | null; action_items: ActionItem[]; action_items_done: number[] }[] }>(res)
  return data.jobs
}

export async function setActionItemDone(job_id: string, index: number, done: boolean): Promise<void> {
  const res = await fetch(`${BASE}/v1/jobs/${job_id}/action-items/${index}`, {
    method: 'PUT',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ done }),
  })
  await handle(res)
}

export async function downloadJobPdf(job_id: string, filenameHint: string): Promise<void> {
  const res = await fetch(`${BASE}/v1/jobs/${job_id}/pdf`, { headers: await authHeaders() })
  if (!res.ok) throw new Error('Failed to generate PDF')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filenameHint
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadOffsetPdf(job_id: string, transcript_text: string, filenameHint: string): Promise<void> {
  const res = await fetch(`${BASE}/v1/jobs/${job_id}/offset-pdf`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ transcript_text }),
  })
  if (!res.ok) throw new Error('Failed to generate PDF')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filenameHint
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadJobDocx(job_id: string, filenameHint: string): Promise<void> {
  const res = await fetch(`${BASE}/v1/jobs/${job_id}/docx`, { headers: await authHeaders() })
  if (!res.ok) throw new Error('Failed to generate DOCX')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filenameHint
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadOffsetDocx(job_id: string, transcript_text: string, filenameHint: string): Promise<void> {
  const res = await fetch(`${BASE}/v1/jobs/${job_id}/offset-docx`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ transcript_text }),
  })
  if (!res.ok) throw new Error('Failed to generate DOCX')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filenameHint
  a.click()
  URL.revokeObjectURL(url)
}

// --- User management (admin-only) ---

export async function fetchUsers(): Promise<KeycloakUserRecord[]> {
  const res = await fetch(`${BASE}/v1/users`, { headers: await authHeaders() })
  const data = await handle<{ users: KeycloakUserRecord[] }>(res)
  return data.users
}

export async function createUser(input: {
  email: string
  first_name: string
  last_name: string
  group: UserGroup
  department: string
}): Promise<{ user_id: string; email: string; group: string; temporary_password: string }> {
  const res = await fetch(`${BASE}/v1/users`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  })
  return handle(res)
}

export async function deleteUser(userId: string): Promise<void> {
  const res = await fetch(`${BASE}/v1/users/${userId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  await handle(res)
}

export async function fetchUsage(days = 30): Promise<UsageStats> {
  const res = await fetch(`${BASE}/v1/jobs/usage?days=${days}`, { headers: await authHeaders() })
  return handle(res)
}

export async function fetchLaptopUsage(days = 30): Promise<UsageStats> {
  const res = await fetch(`${BASE}/v1/jobs/usage/laptop?days=${days}`, { headers: await authHeaders() })
  return handle(res)
}

export async function resetPassword(userId: string): Promise<{ user_id: string; temporary_password: string }> {
  const res = await fetch(`${BASE}/v1/users/${userId}/reset-password`, {
    method: 'POST',
    headers: await authHeaders(),
  })
  return handle(res)
}

export async function fetchOrgUsage(): Promise<MonthlyUsageGauge> {
  const res = await fetch(`${BASE}/v1/jobs/org-usage`, { headers: await authHeaders() })
  return handle(res)
}

export async function fetchOrgUsageByLaptop(): Promise<OrgUsageByLaptop> {
  const res = await fetch(`${BASE}/v1/jobs/org-usage/by-laptop`, { headers: await authHeaders() })
  return handle(res)
}
