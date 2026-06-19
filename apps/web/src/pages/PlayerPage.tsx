import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as alphaTab from '@coderline/alphatab'
import { AlphaTabService } from '../alphatab/AlphaTabService'
import type { ActiveBeats } from '../alphatab/AlphaTabService'
import { usePlayerStore } from '../store/playerStore'
import { useLibraryStore } from '../store/libraryStore'
import { localLibrary } from '../catalog/IndexedDbLibrary'
import { extractMetadata } from '../lib/scoreMetadata'
import Transport from '../components/player/Transport'
import TrackList from '../components/tracks/TrackList'
import Fretboard from '../components/fretboard/Fretboard'
import PianoKeyboard from '../components/piano/PianoKeyboard'
import BottomSheet from '../components/BottomSheet'
import type { LibraryEntry } from '@multiinstrumental/shared'
import type { ViewMode } from '../store/playerStore'

const SOUNDFONT_URL = '/soundfont/sonivox.sf2'

const STAVE_PROFILE: Record<ViewMode, alphaTab.StaveProfile> = {
  tab: alphaTab.StaveProfile.Tab,
  score: alphaTab.StaveProfile.Score,
  'score-tab': alphaTab.StaveProfile.ScoreTab,
}

interface TrackState {
  index: number
  name: string
  instrument: string
  muted: boolean
  solo: boolean
  volume: number
}

const VIEW_MODES: { value: ViewMode; label: string; icon: string }[] = [
  { value: 'tab', label: 'Guitar Tab', icon: '🎸' },
  { value: 'score', label: 'Standard Score', icon: '🎼' },
  { value: 'score-tab', label: 'Both', icon: '📄' },
]

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const serviceRef = useRef<AlphaTabService | null>(null)

  const [activeBeats, setActiveBeats] = useState<ActiveBeats>({ positions: [] })
  const [trackStates, setTrackStates] = useState<TrackState[]>([])
  const [tracksOpen, setTracksOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [vizOpen, setVizOpen] = useState(false)

  const {
    setState,
    setCurrentEntry,
    setPosition,
    setPlaybackSpeed,
    setActiveTrack,
    setViewMode,
    viewMode,
    activeTrackIndex,
    showFretboard,
    showPiano,
    toggleFretboard,
    togglePiano,
    title,
    artist,
  } = usePlayerStore()

  const { upsertEntry } = useLibraryStore()

  // Init alphaTab once
  useEffect(() => {
    if (!containerRef.current) return
    const svc = new AlphaTabService()
    serviceRef.current = svc

    svc.init(containerRef.current, SOUNDFONT_URL, {
      onScoreLoaded: async (score) => {
        setState('ready')
        setTrackStates(
          score.tracks.map((t, i) => ({
            index: i,
            name: t.name,
            instrument: t.playbackInfo?.program?.toString() ?? '',
            muted: false,
            solo: false,
            volume: 1,
          })),
        )
        if (id) {
          const meta = extractMetadata(score, title || id)
          const entry = await localLibrary.add(new ArrayBuffer(0), meta).catch(() => null)
          if (entry) upsertEntry(entry as LibraryEntry)
          setCurrentEntry(id, meta.title ?? title, meta.artist ?? artist)
        }
      },
      onPlayerStateChanged: (status) => setState(status),
      onPositionChanged: (tick, tickEnd) => {
        setPosition(tick, tickEnd)
        if (id) localLibrary.setPosition(id, tick)
      },
      onActiveBeatsChanged: setActiveBeats,
    })

    return () => { svc.destroy(); serviceRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load file when id changes
  useEffect(() => {
    if (!id) return
    setState('loading')
    localLibrary.loadFile({ id, sourceId: 'local-library' } as never)
      .then((bytes) => {
        serviceRef.current?.loadBytes(bytes)
        return localLibrary.getPosition(id)
      })
      .then((tick) => { if (tick > 0) serviceRef.current?.seek(tick) })
      .catch(() => navigate('/library'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Sync view mode
  useEffect(() => {
    serviceRef.current?.setViewMode(STAVE_PROFILE[viewMode])
  }, [viewMode])

  const handleMute = useCallback((index: number, muted: boolean) => {
    serviceRef.current?.muteTrack(index, muted)
    setTrackStates((s) => s.map((t) => t.index === index ? { ...t, muted } : t))
  }, [])

  const handleSolo = useCallback((index: number, solo: boolean) => {
    serviceRef.current?.soloTrack(index, solo)
    setTrackStates((s) => s.map((t) => t.index === index ? { ...t, solo } : t))
  }, [])

  const handleSelectTrack = useCallback((index: number) => {
    setActiveTrack(index)
    serviceRef.current?.renderTrack(index)
    setTracksOpen(false)
  }, [setActiveTrack])

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed)
    serviceRef.current?.setPlaybackSpeed(speed)
  }, [setPlaybackSpeed])

  const handleSeek = useCallback((tick: number) => {
    serviceRef.current?.seek(tick)
  }, [])

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-white/40">
        <span className="text-6xl">🎵</span>
        <p className="text-sm">Open a song from your Library</p>
        <button
          className="mt-2 px-6 py-3 rounded-full bg-accent text-white text-sm font-medium"
          onClick={() => navigate('/library')}
        >
          Go to Library
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">

      {/* Top bar */}
      <div
        className="flex items-center gap-2 px-3 bg-surface-raised border-b border-surface-overlay shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', minHeight: '48px' }}
      >
        <button
          className="w-9 h-9 flex items-center justify-center text-white/60 active:text-white rounded-full active:bg-white/10"
          onClick={() => navigate('/library')}
        >
          ‹
        </button>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-sm font-semibold text-white truncate leading-tight">{title}</p>
          {artist && <p className="text-[10px] text-white/40 truncate">{artist}</p>}
        </div>
        {/* Viz toggle */}
        <button
          className={`w-9 h-9 flex items-center justify-center rounded-full text-base active:bg-white/10 ${
            (showFretboard || showPiano) ? 'text-accent' : 'text-white/40'
          }`}
          onClick={() => setVizOpen(true)}
        >
          🎹
        </button>
      </div>

      {/* Score — fills remaining space */}
      <div className="flex-1 overflow-hidden relative">
        <div
          ref={containerRef}
          className="at-surface w-full h-full overflow-y-auto bg-white"
        />
      </div>

      {/* Fretboard / Piano strip */}
      {(showFretboard || showPiano) && (
        <div className="flex items-center gap-2 px-3 py-2 bg-surface border-t border-surface-overlay shrink-0 overflow-x-auto">
          {showFretboard && (
            <Fretboard
              positions={activeBeats.positions}
              chordName={activeBeats.chordName}
            />
          )}
          {showPiano && (
            <PianoKeyboard positions={activeBeats.positions} />
          )}
        </div>
      )}

      {/* Transport */}
      <Transport
        onPlay={() => serviceRef.current?.play()}
        onPause={() => serviceRef.current?.pause()}
        onStop={() => serviceRef.current?.stop()}
        onSeek={handleSeek}
        onSpeedChange={handleSpeedChange}
        onTracksOpen={() => setTracksOpen(true)}
        onViewOpen={() => setViewOpen(true)}
      />

      {/* Track mixer sheet */}
      <BottomSheet
        open={tracksOpen}
        onClose={() => setTracksOpen(false)}
        title="Tracks"
      >
        <TrackList
          tracks={[]}
          trackStates={trackStates}
          activeTrackIndex={activeTrackIndex}
          onMute={handleMute}
          onSolo={handleSolo}
          onSelect={handleSelectTrack}
        />
      </BottomSheet>

      {/* View mode sheet */}
      <BottomSheet
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Notation"
      >
        <div className="flex flex-col py-2">
          {VIEW_MODES.map((m) => (
            <button
              key={m.value}
              className={`flex items-center gap-4 px-5 py-4 text-left active:bg-surface-overlay ${
                viewMode === m.value ? 'text-accent' : 'text-white'
              }`}
              onClick={() => { setViewMode(m.value); setViewOpen(false) }}
            >
              <span className="text-2xl">{m.icon}</span>
              <span className="text-sm font-medium">{m.label}</span>
              {viewMode === m.value && <span className="ml-auto text-accent">✓</span>}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Visualization sheet */}
      <BottomSheet
        open={vizOpen}
        onClose={() => setVizOpen(false)}
        title="Visualization"
      >
        <div className="flex flex-col py-2">
          <button
            className={`flex items-center gap-4 px-5 py-4 active:bg-surface-overlay ${
              showFretboard ? 'text-accent' : 'text-white'
            }`}
            onClick={toggleFretboard}
          >
            <span className="text-2xl">🎸</span>
            <span className="text-sm font-medium">Fretboard / Fingering</span>
            {showFretboard && <span className="ml-auto text-accent">✓</span>}
          </button>
          <button
            className={`flex items-center gap-4 px-5 py-4 active:bg-surface-overlay ${
              showPiano ? 'text-accent' : 'text-white'
            }`}
            onClick={togglePiano}
          >
            <span className="text-2xl">🎹</span>
            <span className="text-sm font-medium">Piano Keyboard</span>
            {showPiano && <span className="ml-auto text-accent">✓</span>}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
