import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLibraryStore } from '../store/libraryStore'
import { localLibrary } from '../catalog/IndexedDbLibrary'
import DropZone from '../components/library/DropZone'
import SongCard from '../components/library/SongCard'
import type { LibraryEntry } from '@multiinstrumental/shared'

export default function LibraryPage() {
  const { entries, setEntries, upsertEntry, setLoading, setError } = useLibraryStore()
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    localLibrary.requestPersistentStorage()
    localLibrary.getAllEntries().then(setEntries)
  }, [setEntries])

  const handleFiles = useCallback(
    async (files: File[]) => {
      setLoading(true)
      for (const file of files) {
        try {
          const bytes = await file.arrayBuffer()
          // We'll extract metadata after alphaTab parses it in the player.
          // For now, save with filename-derived metadata.
          const entry = await localLibrary.add(bytes, {
            title: file.name.replace(/\.[^.]+$/, ''),
            format: file.name.match(/\.(mid|midi)$/i) ? 'midi'
              : file.name.match(/\.(xml|musicxml|mxl)$/i) ? 'musicxml'
              : 'gp',
          })
          upsertEntry(entry as LibraryEntry)
          // Navigate to player for first file
          if (files.indexOf(file) === 0) navigate(`/player/${entry.id}`)
        } catch (err) {
          setError(String(err))
        }
      }
      setLoading(false)
    },
    [navigate, upsertEntry, setLoading, setError],
  )

  const filtered = entries.filter(
    (e) =>
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.artist?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-full p-6 gap-4 overflow-y-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-white">Library</h1>
        <input
          type="search"
          placeholder="Search songs..."
          className="ml-auto bg-surface-raised border border-surface-overlay text-white text-sm rounded-lg px-3 py-1.5 w-64 placeholder-white/30 focus:outline-none focus:border-accent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DropZone onFiles={handleFiles} />

      {filtered.length > 0 && (
        <div className="flex flex-col gap-1 mt-2">
          {filtered.map((e) => (
            <SongCard key={e.id} entry={e as LibraryEntry} />
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <p className="text-center text-white/30 text-sm mt-4">
          No songs yet — drop some files above to get started.
        </p>
      )}
    </div>
  )
}
