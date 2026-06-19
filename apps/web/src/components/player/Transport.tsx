import { useRef } from 'react'
import { usePlayerStore } from '../../store/playerStore'

interface Props {
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSeek: (tick: number) => void
  onSpeedChange: (speed: number) => void
  onTracksOpen: () => void
  onViewOpen: () => void
}

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]

export default function Transport({
  onPlay, onPause, onStop, onSeek, onSpeedChange, onTracksOpen, onViewOpen,
}: Props) {
  const { state, tickPosition, tickEnd, playbackSpeed, viewMode } = usePlayerStore()
  const progressRef = useRef<HTMLDivElement>(null)

  const isPlaying = state === 'playing'
  const isLoading = state === 'loading'
  const canPlay = state === 'ready' || state === 'paused' || state === 'playing'
  const progress = tickEnd > 0 ? tickPosition / tickEnd : 0

  function handleProgressClick(e: React.MouseEvent | React.TouchEvent) {
    if (!progressRef.current || tickEnd === 0) return
    const rect = progressRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    onSeek(Math.round(frac * tickEnd))
  }

  const viewLabel = viewMode === 'tab' ? 'Tab' : viewMode === 'score' ? 'Score' : 'Both'

  return (
    <div
      className="bg-surface-raised border-t border-surface-overlay shrink-0 select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Progress bar */}
      <div
        ref={progressRef}
        className="relative h-1 bg-surface-overlay cursor-pointer active:h-2 transition-all"
        onClick={handleProgressClick}
        onTouchStart={handleProgressClick}
      >
        <div
          className="absolute inset-y-0 left-0 bg-accent transition-none"
          style={{ width: `${progress * 100}%` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent shadow-md"
          style={{ left: `calc(${progress * 100}% - 6px)` }}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center px-4 py-2 gap-3">
        {/* Tracks button */}
        <button
          className="flex flex-col items-center gap-0.5 text-white/50 active:text-white min-w-[40px]"
          onClick={onTracksOpen}
        >
          <span className="text-lg">🎛</span>
          <span className="text-[9px]">Tracks</span>
        </button>

        {/* Stop */}
        <button
          className="w-9 h-9 rounded-full bg-surface-overlay flex items-center justify-center text-white/60 active:text-white disabled:opacity-30"
          disabled={!canPlay}
          onClick={onStop}
        >
          <span className="text-sm">⏹</span>
        </button>

        {/* Play / Pause — big center button */}
        <button
          className="w-14 h-14 rounded-full bg-accent shadow-lg flex items-center justify-center text-white text-2xl disabled:opacity-30 active:scale-95 transition-transform mx-auto"
          disabled={!canPlay || isLoading}
          onClick={isPlaying ? onPause : onPlay}
        >
          {isLoading ? (
            <span className="text-base animate-spin">◌</span>
          ) : isPlaying ? (
            '⏸'
          ) : (
            <span className="ml-1">▶</span>
          )}
        </button>

        {/* Speed */}
        <div className="flex flex-col items-center gap-0.5">
          <select
            className="bg-transparent text-white/60 text-xs text-center appearance-none cursor-pointer active:text-white focus:outline-none"
            value={playbackSpeed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s} className="bg-surface-raised">
                {s}×
              </option>
            ))}
          </select>
          <span className="text-[9px] text-white/30">Speed</span>
        </div>

        {/* View mode */}
        <button
          className="flex flex-col items-center gap-0.5 text-white/50 active:text-white min-w-[40px]"
          onClick={onViewOpen}
        >
          <span className="text-lg">🎼</span>
          <span className="text-[9px]">{viewLabel}</span>
        </button>
      </div>
    </div>
  )
}
