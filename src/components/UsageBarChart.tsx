import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import type { DailyUsage } from '../types'

function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}

export default function UsageBarChart({ data }: { data: DailyUsage[] }) {
  const chartData = data.map(d => ({ ...d, label: formatDateLabel(d.date) }))

  return (
    <div style={{ width: '100%', height: '220px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.7} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <Tooltip
            cursor={{ fill: 'rgba(99,102,241,0.08)' }}
            formatter={(value) => [`${Number(value ?? 0).toFixed(2)}h`, 'Hours']}
            contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12, boxShadow: 'var(--shadow-md)' }}
          />
          <Bar dataKey="hours" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}