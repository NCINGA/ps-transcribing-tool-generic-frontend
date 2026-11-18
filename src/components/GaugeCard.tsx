import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { Gauge } from 'lucide-react'
import type { MonthlyUsageGauge } from '../types'

export default function GaugeCard({ data, error }: { data: MonthlyUsageGauge | null; error?: string }) {
  return (
    <div className="card card-pad">
      <div className="card-head" style={{ marginBottom: '8px' }}>
        <span className="icon-chip"><Gauge size={17} /></span>
        <div className="card-title">Monthly Usage (All Workstations)</div>
      </div>

      {error ? (
        <div className="alert danger" role="alert">{error}</div>
      ) : data === null ? (
        <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '130px', height: '130px', borderRadius: '50%',
            border: '14px solid var(--bg-surface-2)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', width: '100%', height: '190px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={[{ value: Math.min(100, (data.total_hours / data.quota_hours) * 100), fill: 'url(#gaugeGradient)' }]}
                innerRadius="75%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
              >
                <defs>
                  <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'var(--bg-surface-2)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{ fontSize: '32px', fontWeight: 750, letterSpacing: '-0.03em', color: 'var(--text)' }}>
                {data.total_hours.toFixed(1)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                of {data.quota_hours} hrs · {Math.round((data.total_hours / data.quota_hours) * 100)}% used
              </div>
            </div>
          </div>

          {data.overage_hours > 0 && (
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <span style={{
                color: 'var(--warning)', fontSize: '13px', fontWeight: 600,
                background: 'var(--warning-light)', padding: '4px 12px', borderRadius: '999px',
              }}>
                Overage: {data.overage_hours.toFixed(1)} hrs
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
