import * as alphaTab from '@coderline/alphatab'

export interface BeatPosition {
  string: number
  fret: number
  finger: number // 0=none,1=index,2=middle,3=ring,4=pinky
  midiPitch: number
}

export interface ActiveBeats {
  positions: BeatPosition[]
  chordName?: string
  chordStrings?: number[] // fret per string, -1 = muted, 0 = open
}

export type PlayerStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused'

export interface AlphaTabCallbacks {
  onScoreLoaded?: (score: alphaTab.model.Score) => void
  onRenderFinished?: () => void
  onPlayerStateChanged?: (status: PlayerStatus) => void
  onPositionChanged?: (tick: number, tickEnd: number, currentTempo: number) => void
  onActiveBeatsChanged?: (beats: ActiveBeats) => void
  onError?: (err: Error) => void
}

export class AlphaTabService {
  private api: alphaTab.AlphaTabApi | null = null
  private _score: alphaTab.model.Score | null = null

  get score() { return this._score }

  init(container: HTMLElement, soundFontUrl: string, callbacks: AlphaTabCallbacks) {

    const settings = new alphaTab.Settings()
    settings.core.engine = 'svg'
    settings.core.logLevel = alphaTab.LogLevel.None
    settings.core.scriptFile = '/alphatab/alphaTab.core.mjs'
    // alphaTab derives fontDirectory from scriptFile URL; override to match public/font/
    settings.core.fontDirectory = '/font/'
    settings.player.enablePlayer = true
    settings.player.enableCursor = true
    settings.player.enableElementHighlighting = true
    settings.player.soundFont = soundFontUrl
    settings.player.scrollMode = alphaTab.ScrollMode.Continuous
    settings.display.staveProfile = alphaTab.StaveProfile.Tab

    this.api = new alphaTab.AlphaTabApi(container, settings)

    this.api.scoreLoaded.on((score) => {
      this._score = score
      callbacks.onScoreLoaded?.(score)
    })

    this.api.renderFinished.on(() => {
      callbacks.onRenderFinished?.()
    })

    this.api.playerStateChanged.on((args) => {
      const status: PlayerStatus =
        args.state === alphaTab.synth.PlayerState.Playing ? 'playing' : 'paused'
      callbacks.onPlayerStateChanged?.(status)
    })

    this.api.playerPositionChanged.on((args) => {
      callbacks.onPositionChanged?.(
        args.currentTick,
        args.endTick,
        0, // tempo not in PositionChangedEventArgs in v1.8; read from score.tempo if needed
      )
    })

    this.api.activeBeatsChanged.on((args) => {
      const positions: BeatPosition[] = []
      let chordName: string | undefined
      let chordStrings: number[] | undefined

      for (const beat of args.activeBeats) {
        if (beat.chord) {
          chordName = beat.chord.name
          chordStrings = beat.chord.strings
        }
        for (const note of beat.notes) {
          positions.push({
            string: note.string,
            fret: note.fret,
            finger: (note.leftHandFinger as unknown as number) ?? 0,
            midiPitch: note.realValue,
          })
        }
      }

      callbacks.onActiveBeatsChanged?.({ positions, chordName, chordStrings })
    })

    this.api.error.on((e) => {
      callbacks.onError?.(new Error(String(e)))
    })
  }

  loadBytes(bytes: ArrayBuffer) {
    if (!this.api) return
    this.api.load(bytes)
  }

  play() { this.api?.play() }
  pause() { this.api?.pause() }
  stop() { this.api?.stop() }
  playPause() { this.api?.playPause() }

  seek(tick: number) {
    if (!this.api) return
    this.api.tickPosition = tick
  }

  setPlaybackSpeed(speed: number) {
    if (!this.api) return
    this.api.playbackSpeed = speed
  }

  setViewMode(profile: alphaTab.StaveProfile) {
    if (!this.api) return
    this.api.settings.display.staveProfile = profile
    this.api.render()
  }

  setTrackVolume(trackIndex: number, volume: number) {
    if (!this.api || !this._score) return
    const track = this._score.tracks[trackIndex]
    if (track) this.api.changeTrackVolume([track], volume)
  }

  muteTrack(trackIndex: number, mute: boolean) {
    if (!this.api || !this._score) return
    const track = this._score.tracks[trackIndex]
    if (track) this.api.changeTrackMute([track], mute)
  }

  soloTrack(trackIndex: number, solo: boolean) {
    if (!this.api || !this._score) return
    const track = this._score.tracks[trackIndex]
    if (track) this.api.changeTrackSolo([track], solo)
  }

  renderTrack(trackIndex: number) {
    if (!this.api || !this._score) return
    const track = this._score.tracks[trackIndex]
    if (track) this.api.renderTracks([track])
  }

  renderAllTracks() {
    if (!this.api || !this._score) return
    this.api.renderTracks(this._score.tracks)
  }

  destroy() {
    this.api?.destroy()
    this.api = null
    this._score = null
  }
}
