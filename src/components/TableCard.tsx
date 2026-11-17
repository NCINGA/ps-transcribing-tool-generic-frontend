import type { ReactNode } from 'react'

export default function TableCard({ children }: { children: ReactNode }) {
  return <div className="card" style={{ overflow: 'hidden' }}>{children}</div>
}
