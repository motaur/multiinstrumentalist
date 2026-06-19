import type * as alphaTab from '@coderline/alphatab'
import type { CatalogEntry } from '@multiinstrumental/shared'

export function extractMetadata(
  score: alphaTab.model.Score,
  filename: string,
): Partial<CatalogEntry> {
  const instruments = score.tracks.map((t) => t.name).filter(Boolean)

  const guessFormat = (name: string): CatalogEntry['format'] => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'mid' || ext === 'midi') return 'midi'
    if (ext === 'xml' || ext === 'musicxml' || ext === 'mxl') return 'musicxml'
    return 'gp'
  }

  return {
    title: score.title || filename.replace(/\.[^.]+$/, ''),
    artist: score.artist || undefined,
    album: score.album || undefined,
    instruments,
    format: guessFormat(filename),
  }
}
