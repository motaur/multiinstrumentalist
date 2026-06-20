import { useRef } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import type { ViewMode } from '../../store/playerStore'

interface Props {
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSeek: (tick: number) => void
  onSpeedChange: (speed: number) => void
  /** Mobile-only — opens track bottom sheet */
  onTracksOpen: () => void
  /** Mobile-only — opens view-mode bottom sheet */
  onViewOpen: () => void
}

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'tab', label: 'Tab' },
  { value: 'score', label: 'Score' },
  { value: 'score-tab', label: 'Both' },
]

export default function Transport({
  onPlay, onPause, onStop, onSeek, onSpeedChange, onTracksOpen, onViewOpen,
}: Props) {
  const { state, tickPosition, tickEnd, playbackSpeed, viewMode, setViewMode } = usePlayerStore()
  const progressRef = useRef<HTMLDivElement>(null)

  const isPlaying = state === 'playing'
  const isLoading = state === 'loading'
  const canPlay = state === 'ready' || state === 'paused' || state === 'playing'
  const progress = tickEnd > 0 ? tickPosition / tickEnd : 0

  function seek(e: React.MouseEvent | React.TouchEvent) {
    if (!progressRef.current || tickEnd === 0) return
    const rect = progressRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    onSeek(Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * tickEnd))
  }

  const playPauseBtn = (size: 'sm' | 'lg') => (
    <button
      className={`rounded-full bg-accent flex items-center justify-center text-white disabled:opacity-30 active:scale-95 transition-transform ${
        size === 'lg' ? 'w-14 h-14 text-2xl' : 'w-9 h-9 text-base'
      }`}
      disabled={!canPlay || isLoading}
      onClick={isPlaying ? onPause : onPlay}
    >
      {isLoading ? <span className="animate-spin text-sm">◌</span>
        : isPlaying ? '⏸'
        : <span className={size === 'lg' ? 'ml-1' : ''}>▶</span>}
    </button>
  )

  const stopBtn = (
    <button
      className="w-9 h-9 rounded-full bg-surface-overlay flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30"
      disabled={!canPlay}
      onClick={onStop}
    >
      ⏹
    </button>
  )

  const speedSelect = (
    <select
      className="bg-surface-overlay text-white text-xs rounded px-2 py-1 cursor-pointer focus:outline-none"
      value={playbackSpeed}
      onChange={(e) => onSpeedChange(Number(e.target.value))}
    >
      {SPEEDS.map((s) => (
        <option key={s} value={s} className="bg-surface-raised">{s}×</option>
      ))}
    </select>
  )

  return (
    <div
      className="bg-surface-raised border-t border-surface-overlay shrink-0 select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Progress scrubber */}
      <div
        ref={progressRef}
        className="relative h-1 bg-surface-overlay cursor-pointer group"
        onClick={seek}
        onTouchStart={seek}
      >
        <div
          className="absolute inset-y-0 left-0 bg-accent"
          style={{ width: `${progress * 100}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent shadow opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress * 100}% - 6px)` }}
        />
      </div>

      {/* ── MOBILE controls (< md) ── */}
      <div className="flex md:hidden items-center px-4 py-2 gap-3">
        {/* Tracks sheet button */}
        <button
          className="flex flex-col items-center gap-0.5 text-white/50 active:text-white min-w-[40px]"
          onClick={onTracksOpen}
        >
          <span className="text-lg">🎛</span>
          <span className="text-[9px]">Tracks</span>
        </button>

        {stopBtn}

        {/* Big play/pause — center */}
        <div className="mx-auto">{playPauseBtn('lg')}</div>

        {/* Speed */}
        <div className="flex flex-col items-center gap-0.5">
          <select
            className="bg-transparent text-white/60 text-xs text-center appearance-none cursor-pointer focus:outline-none"
            value={playbackSpeed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s} className="bg-surface-raised">{s}×</option>
            ))}
          </select>
          <span className="text-[9px] text-white/30">Speed</span>
        </div>

        {/* View sheet button */}
        <button
          className="flex flex-col items-center gap-0.5 text-white/50 active:text-white min-w-[40px]"
          onClick={onViewOpen}
        >
          <span className="text-lg">🎼</span>
          <span className="text-[9px]">
            {viewMode === 'tab' ? 'Tab' : viewMode === 'score' ? 'Score' : 'Both'}
          </span>
        </button>
      </div>

      {/* ── DESKTOP controls (≥ md) ── */}
      <div className="hidden md:flex items-center gap-3 px-4 py-2">
        {stopBtn}
        {playPauseBtn('sm')}

        {/* Time */}
        <span className="text-xs text-white/40 font-mono w-8 text-center">
          {tickEnd > 0 ? `${Math.round(progress * 100)}%` : '—'}
        </span>

        <div className="w-px h-4 bg-surface-overlay mx-1" />

        {/* Speed */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/40">Speed</span>
          {speedSelect}
        </div>

        <div className="w-px h-4 bg-surface-overlay mx-1" />

        {/* View mode toggle */}
        <div className="flex items-center gap-1">
          {VIEW_MODES.map((m) => (
            <button
              key={m.value}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === m.value
                  ? 'bg-accent text-white'
                  : 'bg-surface-overlay text-white/50 hover:text-white'
              }`}
              onClick={() => setViewMode(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
