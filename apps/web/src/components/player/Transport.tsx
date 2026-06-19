import { usePlayerStore } from '../../store/playerStore'

interface Props {
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSpeedChange: (speed: number) => void
}

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]

function formatTick(tick: number, tickEnd: number): string {
  if (tickEnd === 0) return '0%'
  return `${Math.round((tick / tickEnd) * 100)}%`
}

export default function Transport({ onPlay, onPause, onStop, onSpeedChange }: Props) {
  const { state, tickPosition, tickEnd, tempo, playbackSpeed, viewMode, setViewMode } =
    usePlayerStore()

  const isPlaying = state === 'playing'
  const canPlay = state === 'ready' || state === 'paused' || state === 'playing'

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-surface-raised border-t border-surface-overlay text-sm shrink-0">
      {/* Play / Pause / Stop */}
      <div className="flex items-center gap-2">
        <button
          className="w-8 h-8 rounded bg-accent hover:bg-accent-muted disabled:opacity-30 flex items-center justify-center"
          disabled={!canPlay}
          onClick={isPlaying ? onPause : onPlay}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className="w-8 h-8 rounded bg-surface-overlay hover:bg-surface-raised disabled:opacity-30 flex items-center justify-center"
          disabled={!canPlay}
          onClick={onStop}
          title="Stop"
        >
          ⏹
        </button>
      </div>

      {/* Position */}
      <span className="text-white/50 font-mono text-xs w-10">
        {formatTick(tickPosition, tickEnd)}
      </span>

      {/* Tempo */}
      <span className="text-white/50 text-xs">{tempo} BPM</span>

      {/* Speed */}
      <div className="flex items-center gap-1">
        <span className="text-white/40 text-xs">Speed</span>
        <select
          className="bg-surface-overlay text-white text-xs rounded px-1 py-0.5"
          value={playbackSpeed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </div>

      {/* View mode */}
      <div className="flex items-center gap-1 ml-auto">
        {(['tab', 'score', 'score-tab'] as const).map((m) => (
          <button
            key={m}
            className={`px-2 py-0.5 rounded text-xs ${
              viewMode === m
                ? 'bg-accent text-white'
                : 'bg-surface-overlay text-white/60 hover:text-white'
            }`}
            onClick={() => setViewMode(m)}
          >
            {m === 'tab' ? 'Tab' : m === 'score' ? 'Score' : 'Both'}
          </button>
        ))}
      </div>
    </div>
  )
}
