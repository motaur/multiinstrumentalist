import { create } from 'zustand'

export type PlayerState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused'
export type ViewMode = 'tab' | 'score' | 'score-tab'

interface PlayerStore {
  state: PlayerState
  currentEntryId: string | null
  title: string
  artist: string
  tickPosition: number
  tickEnd: number
  tempo: number
  playbackSpeed: number
  viewMode: ViewMode
  activeTrackIndex: number
  showFretboard: boolean
  showPiano: boolean

  setState: (s: PlayerState) => void
  setCurrentEntry: (id: string | null, title: string, artist: string) => void
  setPosition: (tick: number, tickEnd: number) => void
  setTempo: (bpm: number) => void
  setPlaybackSpeed: (speed: number) => void
  setViewMode: (mode: ViewMode) => void
  setActiveTrack: (index: number) => void
  toggleFretboard: () => void
  togglePiano: () => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  state: 'idle',
  currentEntryId: null,
  title: '',
  artist: '',
  tickPosition: 0,
  tickEnd: 0,
  tempo: 120,
  playbackSpeed: 1,
  viewMode: 'tab',
  activeTrackIndex: 0,
  showFretboard: true,
  showPiano: false,

  setState: (state) => set({ state }),
  setCurrentEntry: (id, title, artist) => set({ currentEntryId: id, title, artist }),
  setPosition: (tickPosition, tickEnd) => set({ tickPosition, tickEnd }),
  setTempo: (tempo) => set({ tempo }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  setViewMode: (viewMode) => set({ viewMode }),
  setActiveTrack: (activeTrackIndex) => set({ activeTrackIndex }),
  toggleFretboard: () => set((s) => ({ showFretboard: !s.showFretboard })),
  togglePiano: () => set((s) => ({ showPiano: !s.showPiano })),
}))
