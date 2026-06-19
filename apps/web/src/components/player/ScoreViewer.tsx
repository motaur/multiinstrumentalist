import { useRef, useEffect } from 'react'
import { useAlphaTab } from '../../alphatab/useAlphaTab'

interface Props {
  bytes: ArrayBuffer | null
}

export default function ScoreViewer({ bytes }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { loadBytes } = useAlphaTab(containerRef as React.RefObject<HTMLDivElement>)

  useEffect(() => {
    if (bytes) loadBytes(bytes)
  }, [bytes, loadBytes])

  return (
    <div
      ref={containerRef}
      className="at-surface w-full h-full overflow-y-auto bg-white"
    />
  )
}
