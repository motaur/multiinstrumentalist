import type { CatalogSource, SearchQuery, SearchResult } from '@multiinstrumental/shared'
import { localLibrary } from './IndexedDbLibrary'

const sources = new Map<string, CatalogSource>()

export function registerSource(source: CatalogSource) {
  sources.set(source.id, source)
}

export function getSource(id: string): CatalogSource | undefined {
  return sources.get(id)
}

export function getSources(): CatalogSource[] {
  return [...sources.values()]
}

export async function searchAll(query: SearchQuery): Promise<SearchResult> {
  const results = await Promise.all(getSources().map((s) => s.search(query)))
  return { entries: results.flatMap((r) => r.entries) }
}

// Register built-in local library
registerSource(localLibrary)
