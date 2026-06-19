import { useState, useCallback } from 'react'

interface Props {
  onFiles: (files: File[]) => void
}

const ACCEPT = '.gp,.gp3,.gp4,.gp5,.gpx,.mid,.midi,.xml,.musicxml,.mxl'

export default function DropZone({ onFiles }: Props) {
  const [dragging, setDragging] = useState(false)

  const handle = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return
      onFiles(Array.from(files))
    },
    [onFiles],
  )

  return (
    <label
      className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors ${
        dragging
          ? 'border-accent bg-accent/10'
          : 'border-surface-overlay hover:border-white/30'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files) }}
    >
      <span className="text-4xl">🎸</span>
      <span className="text-white/70 text-sm text-center">
        Drop Guitar Pro, MIDI, or MusicXML files here<br />
        <span className="text-white/40 text-xs">or click to browse</span>
      </span>
      <input
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
    </label>
  )
}
