# MultiInstrumental — Implementation Plan

A Songsterr-style web app for viewing and playing Guitar Pro / MIDI tablature, with desktop and mobile builds from a single codebase.

---

## 1. Product Goal

Recreate the core Songsterr experience, **local-first**:

- Open **local** Guitar Pro files (`.gp3/.gp4/.gp5/.gpx/.gp`), MusicXML, and MIDI.
- Render **tablature + standard notation** for multiple tracks/instruments.
- **Synchronized playback** with a moving cursor highlighting the current beat/bar.
- Per-track controls: mute, solo, volume, instrument selection.
- **Real-time playback** via the alphaTab synth (Web Audio), low-latency, with the
  cursor + active notes updating live as the song plays.
- **Fretboard / fingering view ("applicature")** — a Guitar Pro–style fretboard
  and chord diagram showing **where to place fingers** (string / fret / finger
  number) for the selected beat or chord. Can optionally highlight live during
  playback, but live animation is **not required** — a static finger diagram is
  the core. Per-instrument (guitar/bass).
- **View-mode switch: guitar tab ↔ piano / standard score** — toggle how a track
  renders: tablature, standard notation (grand staff for piano), or both. Plus a
  **live piano keyboard** that highlights the currently-sounding keys in real time
  (the piano counterpart of the fretboard view).
- Tempo control (speed up/slow down), loop a section, count-in/metronome.
- Track switcher (guitar, bass, drums, vocals, etc.).
- Local library, search, and favorites (stored on-device, no server required).
- **Auto-add to local library:** every file the user opens is automatically saved
  into the on-device library (file bytes + parsed metadata), persisted across
  sessions — **no login, no backend.** Re-opening the app shows everything added.
- **Pluggable external catalog sources** — a clean adapter interface so external
  databases can be connected later (implemented separately, not part of core).
- Works on **web, desktop (Tauri), and mobile (Capacitor)** from one codebase.

**No backend is required.** The app runs fully client-side. External catalogs are
optional plug-ins behind a `CatalogSource` interface.

### Non-goals (explicitly out of scope)

- **Tab editing/authoring** — this is a **viewer/player**, not an editor. (alphaTab
  is render-focused; editing is a separate, much larger effort.)
- **Mic-based scoring / pitch detection** (Rocksmith/Yousician "did you play it right").
- **Web MIDI input** (driving views from a connected MIDI instrument).
- **Realistic animated guitar / note-highway** — the fretboard is a Guitar Pro–style
  finger diagram, not a real-time animated neck.
- **Learning mode beyond tempo** — only tempo adjustment (slow down / speed up),
  no graded lessons or speed-trainer automation.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript | Strict mode |
| Core engine | **alphaTab** (JS/TS build) | Parsing, notation rendering, MIDI synth, cursor |
| UI framework | **React 18** + Vite | Fast dev, large ecosystem |
| State | Zustand | Lightweight, simple for player state |
| Styling | Tailwind CSS | Rapid, consistent UI |
| Routing | React Router | Library / player / search routes |
| Desktop | **Tauri** | Small binaries, Rust shell |
| Mobile | **Capacitor** | Reuse the web build on iOS/Android |
| Audio | alphaTab synth + SoundFont (SF2/SF3) | Bundle a free GM soundfont |
| Local storage | IndexedDB (via `idb`) | Library metadata, favorites, recent |
| File access | File System Access API / OPFS; native dialogs on desktop/mobile | Bring-your-own-files |
| External catalogs | `CatalogSource` adapter interface (pluggable) | Implemented separately, optional |
| Tests | Vitest + Playwright | Unit + e2e |

> **No backend in the core stack.** Everything above runs client-side. A server is
> only needed if *you* later add accounts/sync — and even then it lives behind the
> same `CatalogSource` interface, so the core app doesn't change.

> **Licensing note:** alphaTab is MPL-2.0 (commercial-friendly, file-level copyleft). Bundle a freely-licensed General MIDI SoundFont. Do **not** redistribute proprietary Guitar Pro content.

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────┐
│                  UI (React)                  │
│  Library · Search · Player · Track controls  │
└───────┬───────────────────────────┬─────────┘
        │ (Zustand: player state)    │ (Zustand: library state)
┌───────▼───────────────────┐  ┌────▼──────────────────────────────────┐
│    alphaTab Service        │  │      Catalog Layer                    │
│  load · render · play ·    │  │  CatalogSource (read) ·               │
│  seek · mute/solo/volume · │  │  LibraryStore (write)                 │
│  tempo · loop · cursor     │  │  ┌──────────────────────────────────┐ │
└───────┬────────────────────┘  │  │ • IndexedDbLibrary ✅ (read+write)│ │
        │                        │  │ • LocalFilesSource ✅ (read)      │ │
┌───────▼────────────────────┐  │  │ • <ExternalDbSource> 🔌 read-only │ │
│  alphaTab core             │  │  │   (you implement)                 │ │
│  parse + render + synth    │  │  └──────────────────────────────────┘ │
│  + SoundFont (Web Audio)   │  └───────────────────────────────────────┘
└────────────────────────────┘

Packaging:  Web (Vite) ──► Tauri (desktop) ──► Capacitor (mobile)
No backend required. External DBs plug in behind CatalogSource.
```

---

## 4. Project Structure

```
multiInstrumental/
├── apps/
│   └── web/                    # React + Vite app (the core)
│       ├── src/
│       │   ├── alphatab/       # alphaTab wrapper/service
│       │   │   ├── AlphaTabService.ts
│       │   │   ├── useAlphaTab.ts
│       │   │   └── soundfont/  # bundled SF2/SF3
│       │   ├── catalog/        # catalog source adapters
│       │   │   ├── CatalogSource.ts      # the interface (extension point)
│       │   │   ├── LocalFilesSource.ts   # open local files ✅
│       │   │   ├── IndexedDbLibrary.ts   # on-device library ✅
│       │   │   └── registry.ts           # register/discover sources
│       │   ├── components/
│       │   │   ├── player/     # Score, Controls, Cursor, Timeline
│       │   │   ├── tracks/     # TrackList, TrackRow, mixer
│       │   │   └── library/    # SongList, SongCard, SearchBar
│       │   ├── store/          # Zustand stores
│       │   ├── pages/          # Library, Player, Search
│       │   ├── lib/            # utils, file loaders
│       │   └── main.tsx
│       └── public/
├── apps/
│   └── desktop/                # Tauri config wrapping web build
├── apps/
│   └── mobile/                 # Capacitor config wrapping web build
├── packages/
│   └── shared/                 # shared types (Song, Track, CatalogSource…)
└── IMPLEMENTATION_PLAN.md
```

> Use a pnpm workspace monorepo so desktop/mobile reuse the web build output.
> External database adapters live in `apps/web/src/catalog/` (or their own package)
> and just implement `CatalogSource` — no changes to player or UI needed.

---

## 5. Implementation Phases

### Phase 0 — Project Setup
- [ ] Init pnpm workspace monorepo.
- [ ] Scaffold `apps/web` with Vite + React + TypeScript (strict).
- [ ] Add Tailwind, React Router, Zustand, Vitest.
- [ ] Install `@coderline/alphatab`.
- [ ] Add a free GM SoundFont to `public/` and configure alphaTab settings.
- [ ] CI: lint + typecheck + test on push.

### Phase 1 — Render a Tab (the "hello world")
- [ ] `AlphaTabService`: init alphaTab API against a container element.
- [ ] Load a bundled sample `.gp5` and render tab + standard notation.
- [ ] Handle render-finished / resize events; responsive layout.
- [ ] File open: drag-and-drop + file picker → render any GP/MusicXML/MIDI.
- **Milestone:** open a file → see correct, scrollable notation.

### Phase 2 — Playback + Cursor
- [ ] Wire SoundFont; play / pause / stop.
- [ ] Synced cursor (beat + bar highlight) following audio.
- [ ] Seek by clicking a bar; scroll-follow current position.
- [ ] Tempo slider (0.25×–2×), count-in, metronome toggle.
- [ ] A–B loop selection.
- **Milestone:** Songsterr-style playback with a moving cursor.

### Phase 3 — Multi-track / Mixer
- [ ] Track list: name, instrument, mute/solo/volume.
- [ ] Switch the rendered track(s); show all or one.
- [ ] Per-track volume + mute/solo applied to synth.
- [ ] Instrument/MIDI program display per track.
- **Milestone:** flip between guitar/bass/drums, mute/solo each.

### Phase 3.5 — Fretboard / Fingering View ("applicature")
- [ ] `Fretboard` component: Guitar Pro–style SVG fretboard sized to the active
      track's tuning (6-string guitar, 4/5-string bass) and fret count.
- [ ] Show finger placement (dot per string/fret + finger number) for the
      selected beat / chord — a clear "where to put your fingers" diagram.
- [ ] Chord diagram panel: when a beat is a chord (or has an attached `Chord`),
      render the chord shape + name.
- [ ] Optional live highlight: subscribe to `activeBeatsChanged` to follow the
      current beat during playback (nice-to-have, not required for the feature).
- [ ] Handle tuning/capo from the track; map MIDI notes → fret when a track has
      no explicit string/fret (best-effort for MIDI sources).
- [ ] Toggle the panel; choose which track the fretboard follows.
- **Milestone:** for any beat/chord the fretboard clearly shows which strings,
  frets, and fingers to use (Guitar Pro style).

### Phase 3.6 — View Modes: Tab ↔ Piano / Standard Score
- [ ] Per-track display-mode toggle: **Tab** / **Standard notation** / **Both**,
      driven by alphaTab `StaveProfile` (`Tab`, `Score`, `ScoreTab`).
- [ ] "Piano mode" preset: standard notation grand staff, tab hidden.
- [ ] Persist the chosen mode per track; sensible default per instrument
      (guitar/bass → tab; piano/keys/vocals → standard score).
- [ ] **Live piano keyboard** component (SVG, e.g. 88 keys): subscribe to
      `activeBeatsChanged`, map each note's pitch (MIDI number) to a key and
      highlight it live during playback. Mirrors the fretboard view.
- [ ] Re-render safely on mode change without interrupting playback position.
- **Milestone:** switch a song between guitar-tab and piano-score views; the
  piano keyboard lights up keys in time with the audio.

### Phase 4 — Player UX Polish
- [ ] Transport bar, timeline, bar/beat counter.
- [ ] Zoom, layout toggle (page vs horizontal scroll).
- [ ] Keyboard shortcuts (space = play/pause, etc.).
- [ ] Dark/light theme; loading & error states.
- [ ] Print / export to PDF (via alphaTab rendering).

### Phase 5 — Local Library & Search (no login, no backend)
- [ ] `LocalFilesSource`: open files via picker / drag-drop / native dialog.
- [ ] `IndexedDbLibrary`: implements **both** `CatalogSource` (read) and
      `LibraryStore` (write); stores the file **blob + parsed metadata** on-device.
- [ ] **Auto-add on open:** opening any file parses it once (alphaTab `Score` →
      title/artist/tracks), then `LibraryStore.add(bytes, meta)` upserts it.
      Dedupe by content hash so re-opening the same file isn't duplicated.
      No "import" step, no login — it just persists.
- [ ] Library survives reload/app restart; load any saved song straight from
      IndexedDB (no re-pick needed).
- [ ] Storage management: show usage, remove a song, request persistent storage
      (`navigator.storage.persist()`) so the browser won't evict the library.
- [ ] Song list, cards, sort/filter, favorites.
- [ ] Search by title/artist/instrument.
- [ ] Recently played, continue where you left off (persisted position).

### Phase 6 — Catalog Source Adapter (extension point)
- [ ] Define the `CatalogSource` interface (see §10) in `packages/shared`.
- [ ] Refactor local library + file open to implement `CatalogSource`.
- [ ] Source `registry`: register sources, unified search across enabled sources.
- [ ] UI: source picker / "browse from <source>" with per-result license + attribution.
- [ ] Document how to add a source so an **external DB can be plugged in later**
      (implemented separately — this phase only ships the seam + the two local sources).

### Phase 7 — Desktop & Mobile Packaging
- [ ] Add Tauri; wrap web build; native file open dialogs.
- [ ] Desktop builds for Windows/macOS/Linux.
- [ ] Add Capacitor; iOS/Android shells; native file access.
- [ ] Test audio/Web Audio behavior on each platform.

---

## 6. Key alphaTab Integration Notes

- Use the **low-level API** (`AlphaTabApi`) directly rather than the jQuery plugin.
- Configure: `core.engine = 'svg'`, `core.file`/`tex`, `player.enablePlayer = true`, `player.soundFont = <path>`, `player.scrollElement`.
- Subscribe to events: `scoreLoaded`, `renderFinished`, `playerStateChanged`, `playerPositionChanged`, `activeBeatsChanged`.
- Track control via `api.renderTracks([...])`, and per-track volume/mute/solo via `api.changeTrackVolume` / `changeTrackMute` / `changeTrackSolo`.
- Tempo via `api.playbackSpeed`. Loop via `api.isLooping` + playback range.
- **Fretboard / fingering data:** for the selected `Beat`, iterate `beat.notes` and
  read `note.string`, `note.fret`, and `note.leftHandFinger` / `note.fingering`.
  Render those onto a Guitar Pro–style SVG fretboard. Optionally subscribe to
  `api.activeBeatsChanged` to follow the current beat during playback.
- **Tuning/capo:** read from the active `Track`/`Staff` (`staff.tuning`,
  `staff.capo`) to lay out the fretboard correctly and label open strings.
- **Chord diagrams:** `Beat.chord` (a `Chord` with `strings`/`firstFret`) gives
  shape data; alphaTab can also render chord diagrams natively if preferred.
- **MIDI-only sources:** MIDI has no string/fret, so map pitch → a playable
  fretboard position (nearest-fret heuristic given tuning) for the fingering view.
- **Tab ↔ piano/standard view switch:** set `settings.display.staveProfile` to
  `StaveProfile.Tab` (tab only), `StaveProfile.Score` (standard notation only —
  use for piano mode), or `StaveProfile.ScoreTab` (both), then re-render. Can be
  scoped per track via the track's staff settings. Toggling profile re-renders
  notation but does **not** affect the synth, so playback continues.
- **Live piano keyboard:** same event source as the fretboard — `activeBeatsChanged`
  → `beat.notes` → `note.realValue` (MIDI pitch). Map MIDI number to a key on an
  SVG keyboard and highlight; no string/fret needed, so it works for any
  instrument/source including MIDI.
- Web Worker + AudioWorklet are used internally — ensure correct asset paths in Vite (alphaTab ships worker/font/soundfont assets that must be served).

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| alphaTab asset paths break under Vite/bundlers | Use alphaTab's documented Vite/webpack setup; copy worker + soundfont to served paths |
| Audio autoplay policies (browser/mobile) | Require a user gesture to start the AudioContext |
| Large SoundFont size on mobile | Use a compact SF3; lazy-load |
| iOS WebView/Web Audio quirks via Capacitor | Test early in Phase 6; fall back to native audio bridge if needed |
| Proprietary GP content licensing | Only let users open their own files; no bundled copyrighted tabs |

---

## 8. Suggested First Sprint

1. Phase 0 setup (workspace + web app + alphaTab installed).
2. Phase 1: render a bundled `.gp5`.
3. Phase 2: play/pause + synced cursor.

That delivers a working, demoable Songsterr-style player in the browser. Catalog
adapters, desktop/mobile packaging come after the player feels right.

---

## 9. Open Decisions

- [ ] React vs Vue — **defaulting to React** (change before Phase 0 if preferred).
- [ ] Tauri vs Electron for desktop — **defaulting to Tauri**.
- [x] Local-first vs backend — **local-first, no backend.** External DBs plug in via `CatalogSource`.
- [ ] Which free SoundFont to bundle.

---

## 10. Catalog Source Interface (the extension point)

The whole "connect external databases" story lives behind one small interface.
Local files and the on-device library implement it now; any external DB you build
later implements the same contract and registers itself — **nothing else changes.**

```ts
// packages/shared/src/catalog.ts

/** A song as surfaced by any catalog source. */
export interface CatalogEntry {
  id: string;                 // unique within the source
  sourceId: string;           // which CatalogSource produced it
  title: string;
  artist?: string;
  instruments?: string[];     // e.g. ["guitar", "bass", "drums"]
  format: 'gp' | 'musicxml' | 'midi';
  license?: string;           // e.g. "Public Domain", "CC-BY-4.0"
  attribution?: string;       // required for CC; shown in UI
  thumbnailUrl?: string;
}

export interface SearchQuery {
  text?: string;
  instrument?: string;
  limit?: number;
  cursor?: string;            // for pagination
}

export interface SearchResult {
  entries: CatalogEntry[];
  nextCursor?: string;
}

/** Read side — implement to plug in a new source (local, remote DB, API, …). */
export interface CatalogSource {
  readonly id: string;        // stable unique id, e.g. "local-files"
  readonly name: string;      // display name
  readonly kind: 'local' | 'remote';

  /** Search/browse this source. */
  search(query: SearchQuery): Promise<SearchResult>;

  /** Resolve an entry to actual file bytes alphaTab can load. */
  loadFile(entry: CatalogEntry): Promise<ArrayBuffer>;

  /** Optional capabilities. */
  isAvailable?(): Promise<boolean>;   // e.g. network reachable
}

/**
 * Write side — for sources you can save into (the on-device library).
 * Kept SEPARATE from CatalogSource: read-only sources (e.g. a remote DB) don't
 * implement this. The IndexedDB local library implements BOTH interfaces.
 */
export interface LibraryStore {
  /** Persist a file + metadata; dedupe by content hash. Returns the entry. */
  add(bytes: ArrayBuffer, meta: Partial<CatalogEntry>): Promise<CatalogEntry>;
  remove(id: string): Promise<void>;
  setFavorite(id: string, favorite: boolean): Promise<void>;
  /** Persisted playback position for "continue where you left off". */
  setPosition(id: string, tick: number): Promise<void>;
}
```

```ts
// apps/web/src/catalog/registry.ts
const sources = new Map<string, CatalogSource>();

export function registerSource(s: CatalogSource) { sources.set(s.id, s); }
export function getSources() { return [...sources.values()]; }

/** Unified search across all enabled sources. */
export async function searchAll(q: SearchQuery): Promise<SearchResult> {
  const results = await Promise.all(getSources().map(s => s.search(q)));
  return { entries: results.flatMap(r => r.entries) };
}
```

**To connect an external database (your work later):** create a class implementing
`CatalogSource` (read-only is fine — don't implement `LibraryStore`), call
`registerSource(new MyDbSource())` at startup. The library UI, search, and player
consume it through the registry — they never know the difference between a local
file and a remote DB. Return bytes from `loadFile()` and alphaTab renders + plays
it exactly the same way.

> Keep `loadFile` returning raw bytes (`ArrayBuffer`) regardless of source — that's
> the single contract the alphaTab service depends on.

**Metadata for auto-add comes from alphaTab, not hand-typed.** On open, parse the
file once and read `score.title`, `score.artist`, `score.album`, and track names /
instruments from the parsed `Score`; pass them to `LibraryStore.add()` along with the
raw bytes. Dedupe by a content hash (e.g. SHA-256 of the bytes) so re-opening the
same file updates rather than duplicates.
