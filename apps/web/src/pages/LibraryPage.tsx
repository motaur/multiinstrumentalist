import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLibraryStore } from '../store/libraryStore'
import { localLibrary } from '../catalog/IndexedDbLibrary'
import SongCard from '../components/library/SongCard'
import DropZone from '../components/library/DropZone'
import type { LibraryEntry } from '@multiinstrumental/shared'

const ACCEPT = '.gp,.gp3,.gp4,.gp5,.gpx,.mid,.midi,.xml,.musicxml,.mxl'

export default function LibraryPage() {
  const { entries, setEntries, upsertEntry, loading, setLoading, setError } = useLibraryStore()
  const [search, setSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    localLibrary.requestPersistentStorage()
    localLibrary.getAllEntries().then(setEntries)
  }, [setEntries])

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return
      setLoading(true)
      let firstId: string | null = null
      for (const file of files) {
        try {
          const bytes = await file.arrayBuffer()
          const entry = await localLibrary.add(bytes, {
            title: file.name.replace(/\.[^.]+$/, ''),
            format: file.name.match(/\.(mid|midi)$/i) ? 'midi'
              : file.name.match(/\.(xml|musicxml|mxl)$/i) ? 'musicxml'
              : 'gp',
          })
          upsertEntry(entry as LibraryEntry)
          if (!firstId) firstId = entry.id
        } catch (err) {
          setError(String(err))
        }
      }
      setLoading(false)
      if (firstId) navigate(`/player/${firstId}`)
    },
    [navigate, upsertEntry, setLoading, setError],
  )

  const filtered = entries.filter(
    (e) =>
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.artist?.toLowerCase().includes(search.toLowerCase()),
  )

  const isEmpty = entries.length === 0

  return (
    <div
      className="flex flex-col h-full bg-surface"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); handleFiles(Array.from(e.dataTransfer.files)) }}
    >
      {/* Header */}
      <div
        className="shrink-0 bg-surface px-4 pt-4 pb-3 md:px-6 md:pb-4"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">My Library</h1>
          {/* Desktop: add button in header */}
          <button
            className="hidden md:flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-muted disabled:opacity-50 transition-colors"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
          >
            {loading ? <span className="animate-spin">◌</span> : '+'}
            Add files
          </button>
        </div>
        <div className="relative mt-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
          <input
            type="search"
            placeholder="Search songs, artists..."
            className="w-full bg-surface-raised text-white text-sm rounded-xl pl-9 pr-4 py-2.5 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-accent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop: two-column layout (song list + drop zone) */}
      <div className="hidden md:flex flex-1 overflow-hidden gap-0">
        {/* Song list */}
        <div className="flex-1 overflow-y-auto border-r border-surface-overlay">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30 px-8">
              <span className="text-5xl">🎸</span>
              <p className="text-sm text-center">Drop files here or click Add files to get started</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-white/30">
              <span className="text-4xl">🔍</span>
              <p className="text-sm">No results for "{search}"</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-surface-overlay/50">
              {filtered.map((e) => <SongCard key={e.id} entry={e as LibraryEntry} />)}
            </div>
          )}
        </div>

        {/* Drop zone panel */}
        <div className="w-72 shrink-0 flex flex-col items-center justify-center p-6 gap-4">
          <DropZone onFiles={handleFiles} />
          <p className="text-xs text-white/20 text-center">
            Supports .gp, .gp3–5, .gpx, .mid, .xml
          </p>
        </div>
      </div>

      {/* Mobile: single column */}
      <div className="md:hidden flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <span className="text-6xl">🎸</span>
            <p className="text-white/60 text-sm leading-relaxed">
              Your library is empty.<br />
              Tap <strong className="text-white">+</strong> to add files.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-white/30">
            <span className="text-4xl">🔍</span>
            <p className="text-sm">No results for "{search}"</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-surface-overlay/50">
            {filtered.map((e) => <SongCard key={e.id} entry={e as LibraryEntry} />)}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <div
        className="md:hidden absolute"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)', right: '16px' }}
      >
        <button
          className="w-14 h-14 rounded-full bg-accent shadow-lg flex items-center justify-center text-white text-3xl active:scale-95 transition-transform disabled:opacity-50"
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
        >
          {loading ? <span className="text-base animate-spin">◌</span> : '+'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
      />
    </div>
  )
}
