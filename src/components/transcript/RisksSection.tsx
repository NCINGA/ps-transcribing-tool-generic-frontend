import { AlertTriangle, ShieldCheck } from 'lucide-react'
import type { Risk } from '../../types'

export default function RisksSection({ risks }: { risks: Risk[] }) {
  return (
    <div className="card card-pad">
      <div className="card-head">
        <span className="icon-chip danger"><AlertTriangle size={17} /></span>
        <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Risks & Blockers</h2>
        <span className="pill" style={{ marginLeft: 'auto' }}>{risks.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {risks.map((r, i) => (
          <div key={i} style={{ padding: '14px 14px 14px 16px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${SEV_COLOR[r.severity] ?? 'var(--border-strong)'}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.5 }}>
                {r.issue}
              </div>
              <SeverityBadge severity={r.severity} />
            </div>
            {r.impact && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: r.mitigation ? '10px' : 0, lineHeight: 1.5 }}>
                {r.impact}
              </div>
            )}
            {r.mitigation && (
              <div style={{
                fontSize: '12px', color: 'var(--text)', lineHeight: 1.5,
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '8px 10px',
                display: 'flex', gap: '8px', alignItems: 'flex-start',
              }}>
                <ShieldCheck size={14} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                <span><strong style={{ color: 'var(--text-muted)' }}>Mitigation: </strong>{r.mitigation}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const SEV_COLOR: Record<string, string> = { high: '#f43f5e', medium: '#f59e0b', low: '#10b981' }

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    high: { bg: 'var(--danger-light)', fg: 'var(--danger)' },
    medium: { bg: 'var(--warning-light)', fg: 'var(--warning)' },
    low: { bg: 'var(--success-light)', fg: 'var(--success)' },
  }
  const c = colors[severity] || { bg: 'var(--bg-surface)', fg: 'var(--text-muted)' }
  return (
    <span className="pill upper" style={{ background: c.bg, color: c.fg, flexShrink: 0 }}>
      {severity}
    </span>
  )
}