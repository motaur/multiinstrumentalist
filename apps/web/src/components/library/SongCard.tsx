import { useNavigate } from 'react-router-dom'
import type { LibraryEntry } from '@multiinstrumental/shared'
import { localLibrary } from '../../catalog/IndexedDbLibrary'
import { useLibraryStore } from '../../store/libraryStore'

interface Props {
  entry: LibraryEntry
}

const FORMAT_ICON: Record<string, string> = {
  midi: '🎹',
  musicxml: '🎼',
  gp: '🎸',
}

function fmtSize(bytes: number) {
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
    if (!confirm(`Remove "${entry.title}"?`)) return
    await localLibrary.remove(entry.id)
    removeEntry(entry.id)
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-overlay cursor-pointer"
      onClick={() => navigate(`/player/${entry.id}`)}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-surface-overlay flex items-center justify-center text-xl shrink-0">
        {FORMAT_ICON[entry.format] ?? '🎵'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{entry.title}</p>
        <p className="text-xs text-white/40 truncate mt-0.5">
          {[entry.artist, fmtSize(entry.sizeBytes)].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* Favorite */}
      <button
        className="w-9 h-9 flex items-center justify-center text-lg shrink-0"
        onClick={toggleFavorite}
      >
        <span className={entry.favorite ? 'text-beat' : 'text-white/20'}>
          {entry.favorite ? '★' : '☆'}
        </span>
      </button>

      {/* Remove */}
      <button
        className="w-9 h-9 flex items-center justify-center text-white/20 active:text-accent shrink-0"
        onClick={remove}
      >
        ⋯
      </button>
    </div>
  )
}
