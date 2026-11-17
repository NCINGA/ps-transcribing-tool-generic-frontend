import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react'
import { fetchFilePresignedUrl } from '../../api'

const SEEK_STEP_SECONDS = 5
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const totalSeconds = Math.floor(seconds)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Hotkeys must not hijack typing in the transcript textareas (or native
// keyboard interaction with the speed <select>) -- anything with focus that
// isn't the page background is exempt.
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export default function AudioPlayerBar({ fileId }: { fileId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)

  // Recovery only ever kicks in reactively, off the <audio> element's own
  // 'error' event -- there's no proactive refresh timer. retryingRef guards
  // against looping forever if the retry itself fails (e.g. file genuinely
  // gone); resumeStateRef carries playback position/state across the src
  // swap since reloading the element resets both.
  const retryingRef = useRef(false)
  const resumeStateRef = useRef<{ time: number; wasPlaying: boolean } | null>(null)

  const loadUrl = useCallback(async () => {
    try {
      const { url } = await fetchFilePresignedUrl(fileId)
      setAudioUrl(url)
      setLoadError(null)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load audio')
    }
  }, [fileId])

  useEffect(() => {
    loadUrl()
  }, [loadUrl])

  const handleError = useCallback(() => {
    if (retryingRef.current) {
      setLoadError('Playback failed. Please refresh the page.')
      return
    }
    retryingRef.current = true
    const audio = audioRef.current
    resumeStateRef.current = {
      time: audio?.currentTime ?? 0,
      wasPlaying: !!audio && !audio.paused,
    }
    loadUrl()
  }, [loadUrl])

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (!audio) return
    setDuration(audio.duration)
    const resume = resumeStateRef.current
    if (resume) {
      audio.currentTime = resume.time
      if (resume.wasPlaying) audio.play().catch(() => {})
      resumeStateRef.current = null
    }
  }

  const handlePlaying = () => {
    setIsPlaying(true)
    retryingRef.current = false // a successful resume clears the retry gate for future, unrelated failures
  }
  const handlePause = () => setIsPlaying(false)
  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
  }

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }, [])

  const seekBy = useCallback((delta: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.min(Math.max(audio.currentTime + delta, 0), audio.duration || Infinity)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toLowerCase()
      if (key === 'a') {
        e.preventDefault()
        seekBy(-SEEK_STEP_SECONDS)
      } else if (key === 's') {
        e.preventDefault()
        togglePlayPause()
      } else if (key === 'd') {
        e.preventDefault()
        seekBy(SEEK_STEP_SECONDS)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [seekBy, togglePlayPause])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed
  }, [speed, audioUrl])

  const handleSeekBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const value = Number(e.target.value)
    audio.currentTime = value
    setCurrentTime(value)
  }

  return (
    <div className="card" style={{
      position: 'sticky', top: '12px', zIndex: 10, marginBottom: '20px', padding: '12px 18px',
      display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
      background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
    }}>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onError={handleError}
          onLoadedMetadata={handleLoadedMetadata}
          onPlaying={handlePlaying}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          style={{ display: 'none' }}
        />
      )}

      <button
        onClick={togglePlayPause}
        disabled={!audioUrl}
        title="Play / pause (S)"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="btn btn-primary"
        style={{ width: '42px', height: '42px', padding: 0, borderRadius: '50%' }}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
      </button>

      <button onClick={() => seekBy(-SEEK_STEP_SECONDS)} disabled={!audioUrl} className="btn btn-secondary btn-sm" title="Back 5 seconds (A)">
        <RotateCcw size={14} /> {SEEK_STEP_SECONDS}s <kbd style={kbdStyle}>A</kbd>
      </button>
      <button onClick={() => seekBy(SEEK_STEP_SECONDS)} disabled={!audioUrl} className="btn btn-secondary btn-sm" title="Forward 5 seconds (D)">
        {SEEK_STEP_SECONDS}s <RotateCw size={14} /> <kbd style={kbdStyle}>D</kbd>
      </button>

      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-soft)', fontVariantNumeric: 'tabular-nums', minWidth: '88px', textAlign: 'center' }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={handleSeekBarChange}
        disabled={!audioUrl}
        style={{ flex: 1, minWidth: '160px' }}
      />

      <select value={speed} onChange={e => setSpeed(Number(e.target.value))} disabled={!audioUrl} className="input input-sm" style={{ width: '78px' }}>
        {SPEEDS.map(s => <option key={s} value={s}>{s}x</option>)}
      </select>

      {loadError && <div style={{ color: 'var(--danger)', fontSize: '12px' }}>{loadError}</div>}
    </div>
  )
}

const kbdStyle: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)',
  background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0 5px',
}
