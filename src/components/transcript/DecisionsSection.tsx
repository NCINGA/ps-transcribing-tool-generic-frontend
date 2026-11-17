import { Scale, Users } from 'lucide-react'
import type { Decision } from '../../types'

export default function DecisionsSection({ decisions }: { decisions: Decision[] }) {
  return (
    <div className="card card-pad mb-20">
      <div className="card-head">
        <span className="icon-chip info"><Scale size={17} /></span>
        <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Decisions</h2>
        <span className="pill" style={{ marginLeft: 'auto' }}>{decisions.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {decisions.map((d, i) => (
          <div key={i} style={{ padding: '14px 14px 14px 16px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #38bdf8' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px', lineHeight: 1.5 }}>
              {d.decision}
            </div>
            {d.context && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
                {d.context}
              </div>
            )}
            {d.stakeholders.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {d.stakeholders.map((s, si) => (
                  <span key={si} className="chip" style={{ padding: '2px 10px', fontSize: '11.5px' }}>
                    <Users size={11} /> {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}