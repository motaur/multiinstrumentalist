import type { BeatPosition } from '../../alphatab/AlphaTabService'

interface Props {
  positions: BeatPosition[]
  tuning?: number[] // MIDI pitch per string, low to high
  fretCount?: number
  chordName?: string
}

const DEFAULT_TUNING = [40, 45, 50, 55, 59, 64] // E2 A2 D3 G3 B3 E4

const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e']
const FINGER_COLORS = ['#555', '#e94560', '#f5a623', '#4caf50', '#2196f3', '#9c27b0']
const INLAY_FRETS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21])

const FRET_W = 40
const STRING_H = 22
const LEFT_PAD = 28
const TOP_PAD = 20
const BOTTOM_PAD = 16

export default function Fretboard({
  positions,
  tuning = DEFAULT_TUNING,
  fretCount = 22,
  chordName,
}: Props) {
  const strings = tuning.length
  const svgW = LEFT_PAD + fretCount * FRET_W + 10
  const svgH = TOP_PAD + (strings - 1) * STRING_H + BOTTOM_PAD

  // group positions by string (1-indexed in alphaTab, 1=high e)
  const byString: Record<number, BeatPosition> = {}
  for (const p of positions) byString[p.string] = p

  return (
    <div className="flex flex-col items-center gap-1 px-3 py-2 bg-surface-raised rounded">
      {chordName && (
        <span className="text-white font-semibold text-sm">{chordName}</span>
      )}
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="overflow-visible"
      >
        {/* Nut */}
        <rect x={LEFT_PAD} y={TOP_PAD} width={3} height={(strings - 1) * STRING_H} fill="#ccc" rx={1} />

        {/* Fret wires */}
        {Array.from({ length: fretCount }, (_, i) => i + 1).map((f) => (
          <line
            key={f}
            x1={LEFT_PAD + f * FRET_W}
            y1={TOP_PAD}
            x2={LEFT_PAD + f * FRET_W}
            y2={TOP_PAD + (strings - 1) * STRING_H}
            stroke="#555"
            strokeWidth={1}
          />
        ))}

        {/* Fret inlay dots */}
        {Array.from({ length: fretCount }, (_, i) => i + 1)
          .filter((f) => INLAY_FRETS.has(f) && f <= fretCount)
          .map((f) => (
            <circle
              key={f}
              cx={LEFT_PAD + f * FRET_W - FRET_W / 2}
              cy={svgH - BOTTOM_PAD / 2}
              r={3}
              fill={f === 12 ? '#e94560' : '#444'}
            />
          ))}

        {/* Strings */}
        {Array.from({ length: strings }, (_, i) => i).map((si) => {
          const y = TOP_PAD + si * STRING_H
          const stringNum = strings - si // alphaTab: 1=highest (e), strings=lowest (E)
          const label = STRING_NAMES[si] ?? String(si + 1)
          return (
            <g key={si}>
              <line
                x1={LEFT_PAD}
                y1={y}
                x2={svgW - 5}
                y2={y}
                stroke="#888"
                strokeWidth={0.8 + si * 0.2}
              />
              <text x={LEFT_PAD - 6} y={y + 4} textAnchor="middle" fontSize={10} fill="#aaa">
                {label}
              </text>
              {/* Finger dot */}
              {byString[stringNum] && byString[stringNum].fret > 0 && (
                <g>
                  <circle
                    cx={LEFT_PAD + byString[stringNum].fret * FRET_W - FRET_W / 2}
                    cy={y}
                    r={9}
                    fill={FINGER_COLORS[byString[stringNum].finger] ?? FINGER_COLORS[1]}
                  />
                  <text
                    x={LEFT_PAD + byString[stringNum].fret * FRET_W - FRET_W / 2}
                    y={y + 4}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#fff"
                    fontWeight="bold"
                  >
                    {byString[stringNum].finger || ''}
                  </text>
                </g>
              )}
              {/* Open string marker */}
              {byString[stringNum] && byString[stringNum].fret === 0 && (
                <circle cx={LEFT_PAD - 14} cy={y} r={5} fill="none" stroke="#e94560" strokeWidth={1.5} />
              )}
            </g>
          )
        })}

        {/* Fret numbers */}
        {[3, 5, 7, 9, 12, 15, 17, 19, 21]
          .filter((f) => f <= fretCount)
          .map((f) => (
            <text
              key={f}
              x={LEFT_PAD + f * FRET_W - FRET_W / 2}
              y={TOP_PAD - 6}
              textAnchor="middle"
              fontSize={9}
              fill="#555"
            >
              {f}
            </text>
          ))}
      </svg>
    </div>
  )
}
