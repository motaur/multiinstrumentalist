import type { BeatPosition } from '../../alphatab/AlphaTabService'

interface Props {
  positions: BeatPosition[]
  startOctave?: number
  octaves?: number
}

const BLACK_PATTERN = [false, true, false, true, false, false, true, false, true, false, true, false]
const WHITE_KEY_W = 18
const WHITE_KEY_H = 70
const BLACK_KEY_W = 12
const BLACK_KEY_H = 44
const BLACK_OFFSETS = [0, 11, 0, 31, 0, 0, 11, 0, 21, 0, 31, 0]

function isBlack(pitch: number) {
  return BLACK_PATTERN[pitch % 12]
}

export default function PianoKeyboard({
  positions,
  startOctave = 2,
  octaves = 6,
}: Props) {
  const activePitches = new Set(positions.map((p) => p.midiPitch))
  const startMidi = startOctave * 12 + 12
  const endMidi = startMidi + octaves * 12

  const whites: number[] = []
  for (let p = startMidi; p < endMidi; p++) {
    if (!isBlack(p)) whites.push(p)
  }

  const svgW = whites.length * WHITE_KEY_W
  const svgH = WHITE_KEY_H + 8

  // x position of white key pitch
  const whiteX: Record<number, number> = {}
  whites.forEach((p, i) => { whiteX[p] = i * WHITE_KEY_W })

  return (
    <div className="overflow-x-auto px-3 py-2 bg-surface-raised rounded">
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* White keys */}
        {whites.map((p) => {
          const active = activePitches.has(p)
          return (
            <rect
              key={p}
              x={whiteX[p] + 0.5}
              y={0}
              width={WHITE_KEY_W - 1}
              height={WHITE_KEY_H}
              fill={active ? '#e94560' : '#f0f0f0'}
              stroke="#999"
              strokeWidth={0.5}
              rx={2}
            />
          )
        })}
        {/* Black keys */}
        {Array.from({ length: octaves * 12 }, (_, i) => startMidi + i)
          .filter(isBlack)
          .map((p) => {
            const noteInOctave = p % 12
            const octave = Math.floor(p / 12)
            const refC = octave * 12 + 12
            const refCWhiteIdx = whites.indexOf(refC)
            if (refCWhiteIdx === -1) return null
            const x =
              refCWhiteIdx * WHITE_KEY_W + BLACK_OFFSETS[noteInOctave] + WHITE_KEY_W / 2
            const active = activePitches.has(p)
            return (
              <rect
                key={p}
                x={x - BLACK_KEY_W / 2}
                y={0}
                width={BLACK_KEY_W}
                height={BLACK_KEY_H}
                fill={active ? '#e94560' : '#222'}
                rx={2}
              />
            )
          })}
      </svg>
    </div>
  )
}
