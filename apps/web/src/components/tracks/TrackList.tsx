import type * as alphaTab from '@coderline/alphatab'

interface TrackInfo {
  index: number
  name: string
  instrument: string
  muted: boolean
  solo: boolean
  volume: number
}

interface Props {
  tracks: alphaTab.model.Track[]
  trackStates: TrackInfo[]
  activeTrackIndex: number
  onMute: (index: number, muted: boolean) => void
  onSolo: (index: number, solo: boolean) => void
  onSelect: (index: number) => void
}

const INSTRUMENT_EMOJI: Record<string, string> = {
  guitar: '🎸', bass: '🎸', drums: '🥁', piano: '🎹',
  vocals: '🎤', violin: '🎻', trumpet: '🎺', saxophone: '🎷',
}

function instrumentIcon(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, icon] of Object.entries(INSTRUMENT_EMOJI)) {
    if (lower.includes(key)) return icon
  }
  return '🎵'
}

export default function TrackList({
  trackStates, activeTrackIndex, onMute, onSolo, onSelect,
}: Props) {
  if (!trackStates.length) return (
    <div className="py-8 text-center text-white/30 text-sm">No tracks loaded</div>
  )

  return (
    <div className="flex flex-col">
      {trackStates.map((t) => {
        const isActive = activeTrackIndex === t.index
        return (
          <div
            key={t.index}
            className={`flex items-center gap-3 px-4 py-3 border-b border-surface-overlay active:bg-surface-overlay ${
              isActive ? 'bg-accent/10' : ''
            }`}
            onClick={() => onSelect(t.index)}
          >
            <span className="text-xl w-8 text-center">{instrumentIcon(t.name)}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isActive ? 'text-accent' : 'text-white'}`}>
                {t.name || `Track ${t.index + 1}`}
              </p>
              {t.instrument && (
                <p className="text-xs text-white/30">Program {t.instrument}</p>
              )}
            </div>
            {/* Solo */}
            <button
              className={`w-9 h-9 rounded-full text-xs font-bold shrink-0 ${
                t.solo ? 'bg-beat text-black' : 'bg-surface-overlay text-white/50'
              }`}
              onClick={(e) => { e.stopPropagation(); onSolo(t.index, !t.solo) }}
            >
              S
            </button>
            {/* Mute */}
            <button
              className={`w-9 h-9 rounded-full text-xs font-bold shrink-0 ${
                t.muted ? 'bg-accent text-white' : 'bg-surface-overlay text-white/50'
              }`}
              onClick={(e) => { e.stopPropagation(); onMute(t.index, !t.muted) }}
            >
              M
            </button>
          </div>
        )
      })}
    </div>
  )
}
