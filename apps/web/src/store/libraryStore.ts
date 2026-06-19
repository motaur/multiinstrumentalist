import { create } from 'zustand'
import type { LibraryEntry } from '@multiinstrumental/shared'

interface LibraryStore {
  entries: LibraryEntry[]
  loading: boolean
  error: string | null
  setEntries: (entries: LibraryEntry[]) => void
  upsertEntry: (entry: LibraryEntry) => void
  removeEntry: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  entries: [],
  loading: false,
  error: null,
  setEntries: (entries) => set({ entries }),
  upsertEntry: (entry) =>
    set((s) => {
      const idx = s.entries.findIndex((e) => e.id === entry.id)
      if (idx === -1) return { entries: [entry, ...s.entries] }
      const next = [...s.entries]
      next[idx] = entry
      return { entries: next }
    }),
  removeEntry: (id) =>
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
