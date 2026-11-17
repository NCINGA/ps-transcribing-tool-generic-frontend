// Renders "[00:01:12] Speaker: text" lines as a readable timeline. The
// underlying text is unchanged -- editing still uses the raw string.
const LINE_RE = /^\[([^\]]+)\]\s*([^:]{1,60}?):\s*([\s\S]*)$/

const PALETTE = ['#4f46e5', '#0891b2', '#7c3aed', '#059669', '#d97706', '#e11d48', '#0369a1', '#a21caf']

function colorFor(name: string): string {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const last = parts.length > 1 ? parts[parts.length - 1] : ''
  return ((parts[0]?.[0] ?? '?') + (/^\d+$/.test(last) ? last : (last[0] ?? ''))).toUpperCase()
}

export default function TranscriptLines({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="tl">
      {lines.map((line, i) => {
        const m = LINE_RE.exec(line)
        if (!m) {
          return line.trim() ? <div key={i} className="tl-plain">{line}</div> : null
        }
        const [, ts, speaker, body] = m
        const name = speaker.trim()
        const color = colorFor(name)
        return (
          <div key={i} className="tl-row">
            <span className="tl-avatar" style={{ background: color }}>{initialsOf(name)}</span>
            <div className="tl-body">
              <div className="tl-head">
                <span className="tl-speaker" style={{ color }}>{name}</span>
                <span className="tl-ts">{ts}</span>
              </div>
              <div className="tl-text">{body}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
