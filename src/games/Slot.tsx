import { motion } from 'framer-motion'
import { Crown, Diamond, Star, Bell, Clover } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../components/ui'
import type { Game } from '../data/games'
import { cn, fmt, rand, uid } from '../lib/format'
import { useStore } from '../store'
import { AutoRounds, GameShell, ModeTabs, RecentStrip, ResultBanner, WagerInput, type Mode } from './shared'

export const SYMBOLS = [
  { id: 'crown', w: 2, pay: [0, 0, 200, 800, 3000] },
  { id: 'diamond', w: 3, pay: [0, 0, 130, 440, 1700] },
  { id: 'star', w: 4, pay: [0, 0, 90, 260, 870] },
  { id: 'bell', w: 5, pay: [0, 0, 65, 175, 545] },
  { id: 'clover', w: 6, pay: [0, 0, 44, 110, 330] },
  { id: 'A', w: 7, pay: [0, 0, 26, 65, 175] },
  { id: 'K', w: 8, pay: [0, 0, 22, 55, 130] },
  { id: 'Q', w: 9, pay: [0, 0, 17, 44, 110] },
] as const
const TOTAL_W = SYMBOLS.reduce((s, x) => s + x.w, 0)
export const LINES = [[1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2]]

export function randomSymbol(r = rand) {
  let x = r() * TOTAL_W
  for (let i = 0; i < SYMBOLS.length; i++) { x -= SYMBOLS[i].w; if (x < 0) return i }
  return SYMBOLS.length - 1
}
export function evaluate(grid: number[][]) {
  // grid[reel][row]
  const wins: { line: number; count: number; sym: number; pay: number }[] = []
  LINES.forEach((ln, li) => {
    const first = grid[0][ln[0]]
    let c = 1
    while (c < 5 && grid[c][ln[c]] === first) c++
    const pay = SYMBOLS[first].pay[c - 1]
    if (pay > 0) wins.push({ line: li, count: c, sym: first, pay })
  })
  return { wins, total: wins.reduce((s, w) => s + w.pay, 0) / LINES.length }
}

function Sym({ i, accent }: { i: number; accent: string }) {
  const id = SYMBOLS[i].id
  const icon = { crown: Crown, diamond: Diamond, star: Star, bell: Bell, clover: Clover } as const
  if (id in icon) {
    const I = icon[id as keyof typeof icon]
    return <I className="h-[55%] w-[55%]" style={{ color: i < 2 ? '#F5D778' : accent }} strokeWidth={1.6} fill={i < 2 ? 'rgba(212,175,55,.18)' : 'transparent'} />
  }
  return <span className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: '#c9ced6' }}>{id}</span>
}

export default function Slot({ game }: { game: Game }) {
  const { placeBet, settle, toast } = useStore()
  const [wager, setWager] = useState(5)
  const [grid, setGrid] = useState<number[][]>(() => Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => randomSymbol())))
  const [spinId, setSpinId] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [win, setWin] = useState<ReturnType<typeof evaluate> | null>(null)
  const [banner, setBanner] = useState(false)
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>([])
  const [mode, setMode] = useState<Mode>('manual')
  const [rounds, setRounds] = useState(10)
  const [autoLeft, setAutoLeft] = useState(0)
  const stop = useRef(false)
  useEffect(() => () => { stop.current = true }, [])
  const accent = game.palette[2]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filler = useMemo(() => Array.from({ length: 5 }, () => Array.from({ length: 12 }, () => randomSymbol())), [spinId])

  const spin = async () => {
    if (!placeBet(wager)) return false
    const g = Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => randomSymbol()))
    setWin(null); setBanner(false); setSpinning(true); setGrid(g); setSpinId((n) => n + 1)
    await new Promise((r) => setTimeout(r, 1250))
    const res = evaluate(g)
    setSpinning(false); setWin(res)
    settle(game.id, game.name, wager, res.total)
    setRecent((x) => [{ id: uid(), m: res.total, win: res.total > 0 }, ...x])
    if (res.total > 0) { setBanner(true); setTimeout(() => setBanner(false), 1400) }
    return true
  }
  const runAuto = async () => {
    stop.current = false
    for (let i = rounds; i > 0; i--) {
      if (stop.current) break
      setAutoLeft(i)
      if (!(await spin())) break
      await new Promise((r) => setTimeout(r, 450))
    }
    setAutoLeft(0)
    toast({ title: 'Autoplay finished', tone: 'info' })
  }
  const winCells = new Set(win?.wins.flatMap((w) => Array.from({ length: w.count }, (_, r) => `${r}-${LINES[w.line][r]}`)) ?? [])
  const running = autoLeft > 0

  return (
    <GameShell
      game={game}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="relative mx-auto max-w-[620px]">
          <div className="rounded-2xl p-[2px]" style={{ background: `linear-gradient(180deg, ${accent}88, #2A3039 40%, ${accent}44)` }}>
            <div className="rounded-2xl p-3 sm:p-4" style={{ background: `radial-gradient(ellipse at 50% 0%, ${game.palette[0]}, #0b0c0f 70%)` }}>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {grid.map((col, r) => (
                  <div key={r} className="relative overflow-hidden rounded-xl bg-black/40 border border-white/5" style={{ aspectRatio: '1 / 3' }}>
                    <motion.div key={spinId} className="absolute inset-x-0 top-0"
                      initial={spinId ? { y: '-80%' } : false} animate={{ y: '0%' }}
                      transition={{ duration: 0.7 + r * 0.13, ease: [0.25, 0.9, 0.3, 1.05] }}>
                      {[...col, ...filler[r]].map((s, k) => {
                        const isWin = k < 3 && winCells.has(`${r}-${k}`)
                        return (
                          <div key={k} className="grid aspect-square place-items-center">
                            <div className={cn('grid h-[88%] w-[88%] place-items-center rounded-lg transition-all duration-200', isWin && 'bg-gold/15 ring-1 ring-gold/70 scale-[1.03]')}><Sym i={s} accent={accent} /></div>
                          </div>
                        )
                      })}
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ResultBanner show={banner} win multiplier={win?.total ?? 0} payout={(win?.total ?? 0) * wager} />
          <div className="mt-4 flex justify-between text-xs text-silver"><span>5 lines · fixed</span><span>{win && !spinning ? (win.total > 0 ? <span className="text-emerald">{win.wins.length} winning line{win.wins.length > 1 ? 's' : ''}</span> : 'No win') : spinning ? 'Spinning…' : 'Ready'}</span></div>
        </div>
      }
      panel={
        <>
          <ModeTabs mode={mode} setMode={setMode} disabled={running} />
          <WagerInput value={wager} onChange={setWager} disabled={spinning || running} />
          {mode === 'auto' && <AutoRounds value={rounds} onChange={setRounds} disabled={running} />}
          {mode === 'manual' ? (
            <Button variant="gold" size="lg" className="w-full" onClick={spin} loading={spinning}>Spin</Button>
          ) : running ? (
            <Button variant="dark" size="lg" className="w-full" onClick={() => { stop.current = true }}>Stop autoplay · {autoLeft} left</Button>
          ) : (
            <Button variant="gold" size="lg" className="w-full" onClick={runAuto}>Start autoplay</Button>
          )}
          <div className="rounded-xl border border-steel bg-ink p-3">
            <div className="label mb-2">Paytable · × total wager</div>
            <div className="space-y-1">
              {SYMBOLS.slice(0, 5).map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-graphite"><Sym i={i} accent={accent} /></span>
                  <span className="num ml-auto text-silver">3: <span className="text-snow">{fmt(s.pay[2] / 5, 2)}</span></span>
                  <span className="num w-16 text-right text-silver">4: <span className="text-snow">{fmt(s.pay[3] / 5, 0)}</span></span>
                  <span className="num w-16 text-right text-silver">5: <span className="text-snow">{fmt(s.pay[4] / 5, 0)}</span></span>
                </div>
              ))}
            </div>
          </div>
        </>
      }
      info={{
        howTo: ['Choose a demo wager. It is split evenly across 5 fixed paylines.', 'Press Spin. Reels stop left to right.', 'Three or more matching symbols on a line, starting from the leftmost reel, pay the amount shown in the paytable.', 'Wins on multiple lines are added together.'],
        fairness: `This is a generic demo slot engine themed for ${game.name}. Each reel position is drawn independently from a weighted symbol set. A 2-million-spin simulation of this engine gives an RTP of about 96% with roughly one winning spin in nine.`,
        odds: <p>Symbol weights from most to least common: Q, K, A, clover, bell, star, diamond, crown. Five crowns on a line is the rarest result.</p>,
      }}
    />
  )
}
