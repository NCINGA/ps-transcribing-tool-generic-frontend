export type TranscriptLanguage = 'english' | 'sinhala' | 'tamil' | 'raw';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | null;

export interface LanguageStatuses {
  english: JobStatus;
  sinhala: JobStatus;
  tamil: JobStatus;
  raw: JobStatus;
}

export interface LanguageJobIds {
  english: string | null;
  sinhala: string | null;
  tamil: string | null;
  raw: string | null;
}

export interface FileRecord {
  id: string;
  file_key: string;
  filename: string;
  file_size: number | null;
  content_type: string | null;
  duration_seconds: number | null;
  bucket: string;
  discovered_at: string | null;
  language_statuses: LanguageStatuses;
  language_job_ids: LanguageJobIds;
}

export interface Job {
  id: string;
  file_id?: string;
  file_key?: string;
  filename: string;
  language: TranscriptLanguage;
  status: string;
  chunk_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  full_transcription?: string;
  pm_summary?: string;
  detected_languages?: string[];
  action_items?: ActionItem[];
  action_items_done?: number[];
  decisions_made?: Decision[];
  risks_and_blockers?: Risk[];
}

export interface ActionItem {
  task: string;
  assigned_to: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Decision {
  decision: string;
  context: string;
  stakeholders: string[];
}

export interface Risk {
  issue: string;
  severity: 'high' | 'medium' | 'low';
  impact: string;
  mitigation: string;
}

export type UserGroup = 'user' | 'admin' | 'superadmin';

export interface UserRecord {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  enabled: boolean;
  group: UserGroup | null;
  department?: string;
}

export interface DailyUsage {
  date: string;
  hours: number;
}

export interface UsageStats {
  range_days: number;
  range_total_hours: number;
  all_time_total_hours: number;
  daily: DailyUsage[];
}

export interface MonthlyUsageGauge {
  quota_hours: number;
  total_hours: number;
  used_within_quota: number;
  overage_hours: number;
}

export interface LaptopUsageEntry {
  laptop_id: string;
  label: string;
  hours: number;
}

export interface OrgUsageByLaptop {
  laptops: LaptopUsageEntry[];
}

export interface OrgUsageByDepartment {
  departments: { department: string; label: string; hours: number }[];
}
