import { useNavigate } from 'react-router-dom'
import type { LibraryEntry } from '@multiinstrumental/shared'
import { localLibrary } from '../../catalog/IndexedDbLibrary'
import { useLibraryStore } from '../../store/libraryStore'

interface Props {
  entry: LibraryEntry
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function SongCard({ entry }: Props) {
  const navigate = useNavigate()
  const { removeEntry, upsertEntry } = useLibraryStore()

  async function toggleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    await localLibrary.setFavorite(entry.id, !entry.favorite)
    upsertEntry({ ...entry, favorite: !entry.favorite })
  }

  async function remove(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Remove "${entry.title}" from library?`)) return
    await localLibrary.remove(entry.id)
    removeEntry(entry.id)
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-raised hover:bg-surface-overlay cursor-pointer group transition-colors"
      onClick={() => navigate(`/player/${entry.id}`)}
    >
      <div className="text-2xl select-none">
        {entry.format === 'midi' ? '🎹' : entry.format === 'musicxml' ? '🎼' : '🎸'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-white truncate">{entry.title}</p>
        <p className="text-xs text-white/50 truncate">
          {entry.artist ?? 'Unknown artist'} · {fmtSize(entry.sizeBytes)}
        </p>
        {entry.instruments?.length ? (
          <p className="text-xs text-white/30 truncate mt-0.5">
            {entry.instruments.join(' · ')}
          </p>
        ) : null}
      </div>
      <button
        className="text-lg opacity-0 group-hover:opacity-100 transition-opacity"
        title={entry.favorite ? 'Unfavorite' : 'Favorite'}
        onClick={toggleFavorite}
      >
        {entry.favorite ? '★' : '☆'}
      </button>
      <button
        className="text-white/30 hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity text-sm"
        title="Remove"
        onClick={remove}
      >
        ✕
      </button>
    </div>
  )
}
