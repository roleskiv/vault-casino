import { useEffect, useState } from 'react'
import { GAMES } from '../data/games'
import { uid } from './format'

export const NAMES = [
  'nightowl_88', 'kestrel', 'm.vega', 'lumen', 'quietstorm', 'orbit7', 'saffron', 'ironleaf', 'b.harlow', 'nova.k',
  'tidewater', 'cobalt_fox', 'juniper', 'echo.v', 'redwood', 'atlas_m', 'marlow', 'sable', 'frost.j', 'pilot22',
  'onyx.r', 'clover', 'drift.k', 'halcyon', 'zephyr_t', 'arden', 'ventura', 'opal.s', 'cinder', 'wren',
]
const PLAYABLE = GAMES.filter((g) => g.category !== 'live')

export interface FeedRow { id: string; user: string; game: string; gameId: string; wager: number; multiplier: number; payout: number; time: number }

export function makeRow(gameId?: string): FeedRow {
  const g = gameId ? GAMES.find((x) => x.id === gameId)! : PLAYABLE[Math.floor(Math.random() * PLAYABLE.length)]
  const wager = [5, 10, 20, 25, 50, 75, 100, 150, 250, 500, 1000, 2500][Math.floor(Math.random() ** 1.6 * 12)]
  const r = Math.random()
  const multiplier = r < 0.48 ? 0 : r < 0.8 ? 1 + Math.random() * 1.5 : r < 0.95 ? 2.5 + Math.random() * 7 : 10 + Math.random() * 90
  return {
    id: uid(), user: NAMES[Math.floor(Math.random() * NAMES.length)], game: g.name, gameId: g.id,
    wager, multiplier: +multiplier.toFixed(2), payout: +(wager * multiplier).toFixed(2), time: Date.now(),
  }
}

/** A rolling feed of clearly fictional demo activity. */
export function useSimFeed(size = 10, interval = 2200, gameId?: string) {
  const [rows, setRows] = useState<FeedRow[]>(() => Array.from({ length: size }, () => ({ ...makeRow(gameId), time: Date.now() - Math.random() * 60e3 })).sort((a, b) => b.time - a.time))
  useEffect(() => {
    const t = setInterval(() => setRows((r) => [makeRow(gameId), ...r].slice(0, size)), interval + Math.random() * 600)
    return () => clearInterval(t)
  }, [size, interval, gameId])
  return rows
}

export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t) }, [ms])
  return now
}
