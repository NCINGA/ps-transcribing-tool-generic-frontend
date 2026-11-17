import { useEffect, useState } from 'react'
import { PieChart as PieIcon, Languages, Building2, User, Users, ListChecks } from 'lucide-react'
import StatusPill, { LangChip } from '../components/StatusPill'
import { fetchAllJobs, fetchJobStats, fetchUsage, fetchLaptopUsage, fetchOrgUsage, fetchOrgUsageByLaptop } from '../api'
import type { Job, UsageStats, MonthlyUsageGauge, OrgUsageByLaptop } from '../types'
import GaugeCard from '../components/GaugeCard'
import Pagination from '../components/Pagination'
import PieChartCard from '../components/PieChartCard'
import UsageBarChart from '../components/UsageBarChart'
import StatCard from '../components/StatCard'
import TableCard from '../components/TableCard'
import { zeroFillDaily } from '../utils/usage'

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ total: 0, completed: 0, processing: 0, failed: 0, english: 0, sinhala: 0, tamil: 0, raw: 0 })
  const [days, setDays] = useState(7)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [laptopUsage, setLaptopUsage] = useState<UsageStats | null>(null)
  const [orgUsage, setOrgUsage] = useState<MonthlyUsageGauge | null>(null)
  const [orgUsageByLaptop, setOrgUsageByLaptop] = useState<OrgUsageByLaptop | null>(null)
  const PAGE_SIZE = 10

  useEffect(() => {
    Promise.all([fetchAllJobs(page, PAGE_SIZE), fetchJobStats()])
      .then(([jobsData, statsData]) => {
        setJobs(jobsData.jobs)
        setTotal(jobsData.total)
        setStats(statsData)
      })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => {
    Promise.all([fetchUsage(days), fetchLaptopUsage(days)])
      .then(([u, lu]) => {
        setUsage(u)
        setLaptopUsage(lu)
      })
      .catch(() => {
        // best-effort -- usage widgets are supplementary, don't block the rest of the dashboard
      })
  }, [days])

  useEffect(() => {
    Promise.all([fetchOrgUsage(), fetchOrgUsageByLaptop()])
      .then(([gauge, byLaptop]) => {
        setOrgUsage(gauge)
        setOrgUsageByLaptop(byLaptop)
      })
      .catch(() => {
        // best-effort -- org-wide widgets are supplementary, don't block the rest of the dashboard
      })
  }, [])

  if (loading) return (
    <div className="page">
      <div className="skeleton" style={{ height: '28px', width: '220px', marginBottom: '28px' }} />
      <div className="grid grid-2">
        {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '260px', borderRadius: '16px' }} />)}
      </div>
    </div>
  )

  return (
    <div className="page">
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="grid grid-2 mb-20">
        <PieChartCard
          title="Job Status"
          icon={<PieIcon size={17} />}
          decimals={0}
          segments={[
            { label: 'completed', value: stats.completed, color: '#10b981' },
            { label: 'processing', value: stats.processing, color: '#f59e0b' },
            { label: 'failed', value: stats.failed, color: '#f43f5e' },
          ]}
        />
        <PieChartCard
          title="Completed Transcripts by Language"
          icon={<Languages size={17} />}
          decimals={0}
          segments={[
            { label: 'english', value: stats.english, color: '#6366f1' },
            { label: 'sinhala', value: stats.sinhala, color: '#06b6d4' },
            { label: 'tamil', value: stats.tamil, color: '#a855f7' },
            { label: 'raw', value: stats.raw, color: '#94a3b8' },
          ]}
        />
      </div>

      <div className="grid grid-2 mb-28">
        <GaugeCard data={orgUsage} />
        <PieChartCard
          title="Monthly Usage by Workstation"
          icon={<Building2 size={17} />}
          segments={orgUsageByLaptop ? orgUsageByLaptop.laptops.map((l, i) => ({
            label: l.label,
            value: l.hours,
            color: ['#6366f1', '#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#94a3b8'][i % 6],
          })) : null}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700 }}>Usage</h2>
        <select value={days} onChange={e => setDays(Number(e.target.value))} className="input input-sm">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      <div className="grid grid-2-wide mb-28">
        <UsageCard title="Your Usage" icon={<User size={17} />} usage={usage} days={days} />
        <UsageCard title="Organisation-wide Usage" icon={<Users size={17} />} usage={laptopUsage} days={days} />
      </div>

      <div className="card-head" style={{ marginBottom: '14px' }}>
        <span className="icon-chip"><ListChecks size={17} /></span>
        <h2 style={{ fontSize: '17px', fontWeight: 700 }}>Recent Jobs</h2>
      </div>
      <TableCard>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                {['File', 'Language', 'Status', 'Chunks', 'Completed At'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 550 }}>{job.filename}</td>
                  <td><LangChip language={job.language} /></td>
                  <td><StatusPill status={job.status} /></td>
                  <td style={{ color: 'var(--text-muted)' }}>{job.chunk_count ?? '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
                    {job.completed_at ? new Date(job.completed_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  )
}

function UsageCard({ title, icon, usage, days }: { title: string; icon: React.ReactNode; usage: UsageStats | null; days: number }) {
  return (
    <div className="card card-pad">
      <div className="card-head">
        <span className="icon-chip">{icon}</span>
        <div className="card-title">{title}</div>
      </div>
      {!usage ? (
        <div className="skeleton" style={{ height: '260px' }} />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '18px' }}>
            <StatCard label={`Last ${days}d`} value={`${usage.range_total_hours.toFixed(1)}h`} />
            <StatCard label="All-time" value={`${usage.all_time_total_hours.toFixed(1)}h`} />
          </div>
          <UsageBarChart data={zeroFillDaily(usage.daily, days)} />
        </>
      )}
    </div>
  )
}
