import { useState, type ReactNode } from 'react'
import { CheckSquare, User, CalendarClock } from 'lucide-react'
import type { ActionItem } from '../../types'
import { setActionItemDone } from '../../api'
import { isPreview } from '../../lib/firebase'

export default function ActionItemsSection({ items, jobId, doneIndexes }: { items: ActionItem[]; jobId: string; doneIndexes: number[] }) {
  const [done, setDone] = useState<number[]>(doneIndexes)
  const [saving, setSaving] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  const toggle = async (i: number) => {
    const next = !done.includes(i)
    setError(null)
    setSaving(prev => [...prev, i])
    setDone(prev => next ? [...prev, i] : prev.filter(n => n !== i))
    try {
      await setActionItemDone(jobId, i, next)
    } catch (e) {
      setDone(prev => next ? prev.filter(n => n !== i) : [...prev, i])
      setError(e instanceof Error ? e.message : 'Could not update the action item')
    } finally {
      setSaving(prev => prev.filter(n => n !== i))
    }
  }
  const doneCount = items.filter((_, i) => done.includes(i)).length

  return (
    <div className="card card-pad mb-20">
      <div className="card-head">
        <span className="icon-chip success"><CheckSquare size={17} /></span>
        <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Action Items</h2>
        <span className={`pill ${doneCount === items.length ? 'success' : ''}`} style={{ marginLeft: 'auto' }}>
          {doneCount}/{items.length} done
        </span>
      </div>
      {error && <div className="alert danger" style={{ marginBottom: '12px' }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((item, i) => {
          const isDone = done.includes(i)
          const canMark = !isPreview && !saving.includes(i)
          return (
            <label key={i} className={`todo ${isDone ? 'done' : ''}`}
              style={{
              padding: '14px 14px 14px 16px', background: 'var(--bg-surface-2)', cursor: canMark ? 'pointer' : 'default',
              borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${PRIORITY_COLOR[item.priority] ?? 'var(--border-strong)'}`,
            }}>
              <input
                type="checkbox"
                className="todo-check"
                checked={isDone}
                disabled={!canMark}
                onChange={() => toggle(i)}
                aria-label={item.task}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="todo-text" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '10px', lineHeight: 1.5 }}>
                  {item.task}
                </div>
                <div className="todo-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <PriorityBadge priority={item.priority} />
                  {item.assigned_to && <Chip><User size={11} /> {item.assigned_to}</Chip>}
                  {item.deadline && <Chip><CalendarClock size={11} /> {item.deadline}</Chip>}
                </div>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

const PRIORITY_COLOR: Record<string, string> = { high: '#f43f5e', medium: '#f59e0b', low: '#10b981' }

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    high: { bg: 'var(--danger-light)', fg: 'var(--danger)' },
    medium: { bg: 'var(--warning-light)', fg: 'var(--warning)' },
    low: { bg: 'var(--success-light)', fg: 'var(--success)' },
  }
  const c = colors[priority] || { bg: 'var(--bg-surface)', fg: 'var(--text-muted)' }
  return (
    <span className="pill upper" style={{ background: c.bg, color: c.fg }}>
      {priority}
    </span>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="chip" style={{ padding: '2px 10px', fontSize: '11.5px' }}>
      {children}
    </span>
  )
}
