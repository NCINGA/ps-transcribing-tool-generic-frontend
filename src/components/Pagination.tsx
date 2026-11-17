import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, total, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '20px' }}>
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn btn-secondary btn-sm">
        <ChevronLeft size={15} /> Prev
      </button>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
        Page {page} of {totalPages}
      </span>
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="btn btn-secondary btn-sm">
        Next <ChevronRight size={15} />
      </button>
    </div>
  )
}
