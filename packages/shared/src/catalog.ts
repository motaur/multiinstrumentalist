export interface CatalogEntry {
  id: string;
  sourceId: string;
  title: string;
  artist?: string;
  album?: string;
  instruments?: string[];
  format: 'gp' | 'musicxml' | 'midi';
  license?: string;
  attribution?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}

export interface SearchQuery {
  text?: string;
  instrument?: string;
  limit?: number;
  cursor?: string;
}

export interface SearchResult {
  entries: CatalogEntry[];
  nextCursor?: string;
}

/** Read-only source — implement to plug in any catalog (local or remote). */
export interface CatalogSource {
  readonly id: string;
  readonly name: string;
  readonly kind: 'local' | 'remote';
  search(query: SearchQuery): Promise<SearchResult>;
  loadFile(entry: CatalogEntry): Promise<ArrayBuffer>;
  isAvailable?(): Promise<boolean>;
}

/** Write side — only the on-device library implements this. */
export interface LibraryStore {
  add(bytes: ArrayBuffer, meta: Partial<CatalogEntry>): Promise<CatalogEntry>;
  remove(id: string): Promise<void>;
  setFavorite(id: string, favorite: boolean): Promise<void>;
  setPosition(id: string, tick: number): Promise<void>;
  getFavorites(): Promise<CatalogEntry[]>;
  getRecent(): Promise<CatalogEntry[]>;
  getPosition(id: string): Promise<number>;
}

export interface LibraryEntry extends CatalogEntry {
  favorite: boolean;
  lastPlayedAt?: number;
  lastTickPosition?: number;
  addedAt: number;
  contentHash: string;
  sizeBytes: number;
}
