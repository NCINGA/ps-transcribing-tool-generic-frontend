const MAP: Record<string, { cls: string; label?: string }> = {
  completed: { cls: 'success' },
  processing: { cls: 'warning' },
  pending: { cls: 'warning', label: 'uploading' },
  failed: { cls: 'danger' },
}

export default function StatusPill({ status }: { status: string }) {
  const m = MAP[status] ?? { cls: '' }
  return (
    <span className={`pill ${m.cls}`} style={{ textTransform: 'capitalize' }}>
      <span className="dot" />
      {m.label ?? status}
    </span>
  )
}

const LANG_STYLE: Record<string, { bg: string; fg: string }> = {
  english: { bg: '#e0e7ff', fg: '#3730a3' },
  sinhala: { bg: '#cffafe', fg: '#155e75' },
  tamil: { bg: '#ede9fe', fg: '#5b21b6' },
  raw: { bg: '#e2e8f0', fg: '#334155' },
}

export function LangChip({ language }: { language: string }) {
  const s = LANG_STYLE[language] ?? LANG_STYLE.raw
  return (
    <span className="pill" style={{ background: s.bg, color: s.fg, textTransform: 'capitalize' }}>
      {language}
    </span>
  )
}
