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
import type { LibraryEntry } from '@multiinstrumental/shared'

const SOUNDFONT_URL = '/soundfont/sonivox.sf2'

const STAVE_PROFILE: Record<string, alphaTab.StaveProfile> = {
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

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const serviceRef = useRef<AlphaTabService | null>(null)
  const [activeBeats, setActiveBeats] = useState<ActiveBeats>({ positions: [] })
  const [trackStates, setTrackStates] = useState<TrackState[]>([])

  const {
    setState,
    setCurrentEntry,
    setPosition,
    setPlaybackSpeed,
    setActiveTrack,
    viewMode,
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
        // Update library entry with parsed metadata
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
        // restore position
        return localLibrary.getPosition(id)
      })
      .then((tick) => { if (tick > 0) serviceRef.current?.seek(tick) })
      .catch(() => navigate('/library'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Sync view mode
  useEffect(() => {
    serviceRef.current?.setViewMode(STAVE_PROFILE[viewMode] ?? alphaTab.StaveProfile.Tab)
  }, [viewMode])

  const handleMute = useCallback((index: number, muted: boolean) => {
    serviceRef.current?.muteTrack(index, muted)
    setTrackStates((s) => s.map((t) => t.index === index ? { ...t, muted } : t))
  }, [])

  const handleSolo = useCallback((index: number, solo: boolean) => {
    serviceRef.current?.soloTrack(index, solo)
    setTrackStates((s) => s.map((t) => t.index === index ? { ...t, solo } : t))
  }, [])

  const handleVolume = useCallback((index: number, volume: number) => {
    serviceRef.current?.setTrackVolume(index, volume)
    setTrackStates((s) => s.map((t) => t.index === index ? { ...t, volume } : t))
  }, [])

  const handleSelectTrack = useCallback((index: number) => {
    setActiveTrack(index)
    serviceRef.current?.renderTrack(index)
  }, [setActiveTrack])

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed)
    serviceRef.current?.setPlaybackSpeed(speed)
  }, [setPlaybackSpeed])

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-white/40">
        <span className="text-5xl">🎸</span>
        <p>Open a song from the Library to start playing.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-surface-raised border-b border-surface-overlay shrink-0">
        <button onClick={() => navigate('/library')} className="text-white/40 hover:text-white text-sm">
          ← Library
        </button>
        <span className="text-white font-medium text-sm truncate">{title}</span>
        {artist && <span className="text-white/40 text-sm">— {artist}</span>}
        <div className="ml-auto flex items-center gap-2">
          <button
            className={`text-xs px-2 py-1 rounded ${showFretboard ? 'bg-accent' : 'bg-surface-overlay text-white/50'}`}
            onClick={toggleFretboard}
          >
            Fretboard
          </button>
          <button
            className={`text-xs px-2 py-1 rounded ${showPiano ? 'bg-accent' : 'bg-surface-overlay text-white/50'}`}
            onClick={togglePiano}
          >
            Piano
          </button>
        </div>
      </div>

      {/* Main area: track list + score */}
      <div className="flex flex-1 overflow-hidden">
        <TrackList
          tracks={[]}
          trackStates={trackStates}
          onMute={handleMute}
          onSolo={handleSolo}
          onVolume={handleVolume}
          onSelect={handleSelectTrack}
        />
        <div className="flex-1 overflow-hidden">
          <div
            ref={containerRef}
            className="at-surface w-full h-full overflow-y-auto bg-white"
          />
        </div>
      </div>

      {/* Live views */}
      {(showFretboard || showPiano) && (
        <div className="flex gap-3 px-4 py-2 bg-surface border-t border-surface-overlay shrink-0 overflow-x-auto">
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
        onSpeedChange={handleSpeedChange}
      />
    </div>
  )
}
