export default function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{
      background: 'var(--bg-surface-2)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 16px',
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 750, letterSpacing: '-0.02em', color: color || 'var(--text)' }}>{value}</div>
    </div>
  )
}
