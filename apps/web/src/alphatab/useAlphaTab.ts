import { useEffect, useRef, useCallback } from 'react'
import * as alphaTab from '@coderline/alphatab'
import { AlphaTabService } from './AlphaTabService'
import { usePlayerStore } from '../store/playerStore'
import type { ViewMode } from '../store/playerStore'

const SOUNDFONT_URL = '/soundfont/sonivox.sf2'

const STAVE_PROFILE: Record<ViewMode, alphaTab.StaveProfile> = {
  tab: alphaTab.StaveProfile.Tab,
  score: alphaTab.StaveProfile.Score,
  'score-tab': alphaTab.StaveProfile.ScoreTab,
}

export function useAlphaTab(containerRef: React.RefObject<HTMLDivElement>) {
  const serviceRef = useRef<AlphaTabService | null>(null)
  const { setState, setPosition, viewMode } = usePlayerStore()

  useEffect(() => {
    if (!containerRef.current) return
    const svc = new AlphaTabService()
    serviceRef.current = svc

    svc.init(containerRef.current, SOUNDFONT_URL, {
      onScoreLoaded: () => setState('ready'),
      onRenderFinished: () => {},
      onPlayerStateChanged: (status) => {
        if (status === 'playing') setState('playing')
        else setState('paused')
      },
      onPositionChanged: (tick, tickEnd) => {
        setPosition(tick, tickEnd)
      },
    })

    return () => svc.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef])

  // sync view mode changes
  useEffect(() => {
    serviceRef.current?.setViewMode(STAVE_PROFILE[viewMode])
  }, [viewMode])

  const loadBytes = useCallback((bytes: ArrayBuffer) => {
    setState('loading')
    serviceRef.current?.loadBytes(bytes)
  }, [setState])

  return { service: serviceRef, loadBytes }
}
