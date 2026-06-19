import type * as alphaTab from '@coderline/alphatab'
import { usePlayerStore } from '../../store/playerStore'

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
  onMute: (index: number, muted: boolean) => void
  onSolo: (index: number, solo: boolean) => void
  onVolume?: (index: number, volume: number) => void
  onSelect: (index: number) => void
}

export default function TrackList({ tracks: _tracks, trackStates, onMute, onSolo, onSelect }: Props) {
  const { activeTrackIndex } = usePlayerStore()

  if (!trackStates.length) return null

  return (
    <div className="flex flex-col gap-0.5 p-2 bg-surface-raised border-r border-surface-overlay w-52 shrink-0 overflow-y-auto">
      <p className="text-xs text-white/40 uppercase tracking-widest px-1 mb-1">Tracks</p>
      {trackStates.map((t) => (
        <div
          key={t.index}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer text-xs ${
            activeTrackIndex === t.index
              ? 'bg-accent/20 text-white'
              : 'hover:bg-surface-overlay text-white/70'
          }`}
          onClick={() => onSelect(t.index)}
        >
          <span className="flex-1 truncate">{t.name || `Track ${t.index + 1}`}</span>
          <button
            className={`w-5 h-5 rounded text-[10px] ${t.muted ? 'bg-accent text-white' : 'bg-surface-overlay text-white/50'}`}
            title="Mute"
            onClick={(e) => { e.stopPropagation(); onMute(t.index, !t.muted) }}
          >
            M
          </button>
          <button
            className={`w-5 h-5 rounded text-[10px] ${t.solo ? 'bg-beat text-black' : 'bg-surface-overlay text-white/50'}`}
            title="Solo"
            onClick={(e) => { e.stopPropagation(); onSolo(t.index, !t.solo) }}
          >
            S
          </button>
        </div>
      ))}
    </div>
  )
}
