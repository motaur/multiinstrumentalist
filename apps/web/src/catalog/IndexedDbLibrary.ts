import { openDB, type IDBPDatabase } from 'idb'
import type {
  CatalogEntry,
  CatalogSource,
  LibraryEntry,
  LibraryStore,
  SearchQuery,
  SearchResult,
} from '@multiinstrumental/shared'

const DB_NAME = 'multiinstrumental'
const DB_VERSION = 1

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('library', { keyPath: 'id' })
      store.createIndex('contentHash', 'contentHash', { unique: true })
      store.createIndex('addedAt', 'addedAt')
      store.createIndex('lastPlayedAt', 'lastPlayedAt')
      db.createObjectStore('blobs', { keyPath: 'id' })
    },
  })
}

async function contentHash(bytes: ArrayBuffer): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export class IndexedDbLibrary implements CatalogSource, LibraryStore {
  readonly id = 'local-library'
  readonly name = 'My Library'
  readonly kind = 'local' as const

  async search(query: SearchQuery): Promise<SearchResult> {
    const db = await getDb()
    const all: LibraryEntry[] = await db.getAll('library')
    const text = query.text?.toLowerCase()
    const filtered = text
      ? all.filter(
          (e) =>
            e.title.toLowerCase().includes(text) ||
            e.artist?.toLowerCase().includes(text) ||
            e.instruments?.some((i) => i.toLowerCase().includes(text)),
        )
      : all
    filtered.sort((a, b) => b.addedAt - a.addedAt)
    const limit = query.limit ?? 100
    return { entries: filtered.slice(0, limit) }
  }

  async loadFile(entry: CatalogEntry): Promise<ArrayBuffer> {
    const db = await getDb()
    const row = await db.get('blobs', entry.id)
    if (!row) throw new Error(`File not found in library: ${entry.id}`)
    return row.bytes as ArrayBuffer
  }

  async add(bytes: ArrayBuffer, meta: Partial<CatalogEntry>): Promise<CatalogEntry> {
    const db = await getDb()
    const hash = await contentHash(bytes)

    // dedupe by content hash
    const existing = await db.getFromIndex('library', 'contentHash', hash)
    if (existing) {
      await db.put('library', { ...existing, ...meta, contentHash: hash })
      return existing as CatalogEntry
    }

    const entry: LibraryEntry = {
      id: crypto.randomUUID(),
      sourceId: this.id,
      title: meta.title ?? 'Unknown',
      artist: meta.artist,
      album: meta.album,
      instruments: meta.instruments,
      format: meta.format ?? 'gp',
      favorite: false,
      addedAt: Date.now(),
      contentHash: hash,
      sizeBytes: bytes.byteLength,
    }

    await db.put('library', entry)
    await db.put('blobs', { id: entry.id, bytes })
    return entry
  }

  async remove(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('library', id)
    await db.delete('blobs', id)
  }

  async setFavorite(id: string, favorite: boolean): Promise<void> {
    const db = await getDb()
    const entry = await db.get('library', id)
    if (entry) await db.put('library', { ...entry, favorite })
  }

  async setPosition(id: string, tick: number): Promise<void> {
    const db = await getDb()
    const entry = await db.get('library', id)
    if (entry)
      await db.put('library', { ...entry, lastTickPosition: tick, lastPlayedAt: Date.now() })
  }

  async getPosition(id: string): Promise<number> {
    const db = await getDb()
    const entry = await db.get('library', id)
    return (entry?.lastTickPosition as number) ?? 0
  }

  async getFavorites(): Promise<CatalogEntry[]> {
    const db = await getDb()
    const all: LibraryEntry[] = await db.getAll('library')
    return all.filter((e) => e.favorite)
  }

  async getRecent(): Promise<CatalogEntry[]> {
    const db = await getDb()
    const all: LibraryEntry[] = await db.getAll('library')
    return all
      .filter((e) => e.lastPlayedAt)
      .sort((a, b) => (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0))
      .slice(0, 20)
  }

  async getAllEntries(): Promise<LibraryEntry[]> {
    const db = await getDb()
    const all: LibraryEntry[] = await db.getAll('library')
    return all.sort((a, b) => b.addedAt - a.addedAt)
  }

  async requestPersistentStorage(): Promise<boolean> {
    if (navigator.storage?.persist) {
      return navigator.storage.persist()
    }
    return false
  }

  async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
    if (navigator.storage?.estimate) {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate()
      return { usage, quota }
    }
    return { usage: 0, quota: 0 }
  }
}

export const localLibrary = new IndexedDbLibrary()
