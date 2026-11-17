import { Sparkles } from 'lucide-react'

export default function SummaryCard({ summary }: { summary: string }) {
  return (
    <div className="card card-pad mb-20" style={{
      background: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 55%)', borderColor: '#dfe5ff',
    }}>
      <div className="card-head" style={{ marginBottom: '10px' }}>
        <span className="icon-chip"><Sparkles size={17} /></span>
        <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Summary</h2>
      </div>
      <p style={{ color: 'var(--text-soft)', lineHeight: 1.8, fontSize: '14.5px' }}>{summary}</p>
    </div>
  )
}
