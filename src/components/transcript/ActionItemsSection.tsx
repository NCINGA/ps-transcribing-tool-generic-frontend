import { useState, type ReactNode } from 'react'
import { CheckSquare, User, CalendarClock } from 'lucide-react'
import type { ActionItem } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { setActionItemDone } from '../../api'

// Everyone can see every action item, but only the person it is assigned to
// can tick it off. assigned_to is free text from the transcript summary
// (e.g. "Maya" or "Maya Perera"), so every word in it must appear in the
// signed-in user's name, username or email.
const words = (v: string) => v.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

function isAssignee(assignedTo: string, user: { name?: string | null; username?: string | null; email?: string | null } | null): boolean {
  if (!user) return false
  const target = words(assignedTo)
  if (target.length === 0) return false
  const mine = new Set([...words(user.name ?? ''), ...words(user.username ?? ''), ...words((user.email ?? '').split('@')[0])])
  return target.every(w => mine.has(w))
}

export default function ActionItemsSection({ items, jobId, doneIndexes }: { items: ActionItem[]; jobId: string; doneIndexes: number[] }) {
  const { user } = useAuth()
  const [done, setDone] = useState<number[]>(doneIndexes)
  const [error, setError] = useState<string | null>(null)

  // Optimistic update; rolled back if the server refuses (e.g. not the assignee).
  const toggle = async (i: number) => {
    const next = !done.includes(i)
    setError(null)
    setDone(prev => next ? [...prev, i] : prev.filter(n => n !== i))
    try {
      await setActionItemDone(jobId, i, next)
    } catch (e) {
      setDone(prev => next ? prev.filter(n => n !== i) : [...prev, i])
      setError(e instanceof Error ? e.message : 'Could not update the action item')
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
          const canMark = isAssignee(item.assigned_to, user)
          return (
            <label key={i} className={`todo ${isDone ? 'done' : ''}`}
              title={canMark ? undefined : item.assigned_to ? `Only ${item.assigned_to} can mark this as done` : 'Not assigned to anyone'}
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
                aria-label={`Mark "${item.task}" as done`}
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
