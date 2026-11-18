import { useState, type ReactNode } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export interface PieSegment {
  label: string
  value: number
  color: string
}

interface PieChartCardProps {
  title: string
  segments: PieSegment[] | null
  icon?: ReactNode
  /** digits after the decimal point for values (0 for counts, 1 for hours) */
  decimals?: number
  error?: string
}

export default function PieChartCard({ title, segments, icon, decimals = 1, error }: PieChartCardProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const total = segments?.reduce((sum, s) => sum + s.value, 0) ?? 0

  return (
    <div className="card card-pad">
      <div className="card-head">
        {icon && <span className="icon-chip">{icon}</span>}
        <div className="card-title">{title}</div>
      </div>

      {error ? (
        <div className="alert danger" role="alert">{error}</div>
      ) : segments === null ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            width: '160px', height: '160px', borderRadius: '50%', flexShrink: 0,
            border: '20px solid var(--bg-surface-2)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '16px', borderRadius: '4px', background: 'var(--bg-surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        </div>
      ) : total === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '48px 0', textAlign: 'center' }}>
          No data yet
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="72%"
                  outerRadius="100%"
                  paddingAngle={3}
                  cornerRadius={6}
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {segments.map((s, i) => (
                    <Cell
                      key={s.label}
                      fill={s.color}
                      opacity={activeIndex === null || activeIndex === i ? 1 : 0.35}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{ fontSize: '30px', fontWeight: 750, letterSpacing: '-0.03em', color: 'var(--text)' }}>
                {(activeIndex !== null ? segments[activeIndex].value : total).toFixed(decimals)}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {activeIndex !== null ? segments[activeIndex].label : 'Total'}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {segments.map((s, i) => (
              <div
                key={s.label}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                  background: activeIndex === i ? 'var(--bg-surface-2)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-soft)', fontWeight: 500, textTransform: 'capitalize' }}>{s.label}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{s.value.toFixed(decimals)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
