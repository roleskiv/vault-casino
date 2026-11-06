import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../components/ui'
import type { Game } from '../data/games'
import { cn, fmt, rand, uid } from '../lib/format'
import { useStore } from '../store'
import { AutoRounds, GameShell, ModeTabs, RecentStrip, ResultBanner, WagerInput, type Mode } from './shared'

const N = 40, DRAW = 10, MAX = 10
const C = (n: number, k: number) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r }
export const hitChance = (p: number, h: number) => (C(p, h) * C(N - p, DRAW - h)) / C(N, DRAW)

export function kenoTable(p: number) {
  if (p === 0) return { pays: [] as number[], rtp: 0 }
  const min = p <= 2 ? 1 : p <= 4 ? 2 : Math.ceil(p * 0.4)
  const raw = Array.from({ length: p + 1 }, (_, h) => (h >= min ? Math.exp(1.3 * (h - min)) * (1 + h - min) : 0))
  const ev = raw.reduce((s, r, h) => s + r * hitChance(p, h), 0)
  const pays = raw.map((r) => { const v = (r * 0.99) / ev; return v >= 10 ? Math.round(v) : Math.round(v * 100) / 100 })
  return { pays, rtp: pays.reduce((s, v, h) => s + v * hitChance(p, h), 0) }
}

export default function Keno({ game }: { game: Game }) {
  const { placeBet, settle, toast } = useStore()
  const [wager, setWager] = useState(10)
  const [picks, setPicks] = useState<number[]>([3, 7, 12, 18, 21, 26, 33, 38])
  const [drawn, setDrawn] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<{ m: number; hits: number } | null>(null)
  const [banner, setBanner] = useState(false)
  const [mode, setMode] = useState<Mode>('manual')
  const [rounds, setRounds] = useState(10)
  const [autoLeft, setAutoLeft] = useState(0)
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>([])
  const stop = useRef(false)
  useEffect(() => () => { stop.current = true }, [])

  const { pays, rtp } = useMemo(() => kenoTable(picks.length), [picks.length])
  const locked = busy || autoLeft > 0

  const toggle = (n: number) => {
    if (locked) return
    setDrawn([]); setRes(null)
    setPicks((p) => (p.includes(n) ? p.filter((x) => x !== n) : p.length >= MAX ? p : [...p, n]))
  }
  const quickPick = () => {
    const all = Array.from({ length: N }, (_, i) => i + 1).sort(() => rand() - 0.5)
    setDrawn([]); setRes(null); setPicks(all.slice(0, picks.length || 8))
  }

  const play = async () => {
    if (!picks.length) { toast({ title: 'Pick at least one number', tone: 'warn' }); return false }
    if (!placeBet(wager)) return false
    setBusy(true); setRes(null); setBanner(false); setDrawn([])
    const pool = Array.from({ length: N }, (_, i) => i + 1)
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]] }
    const d = pool.slice(0, DRAW)
    for (let i = 0; i < DRAW; i++) { await new Promise((r) => setTimeout(r, 110)); setDrawn(d.slice(0, i + 1)) }
    const hits = d.filter((x) => picks.includes(x)).length
    const m = pays[hits] ?? 0
    setRes({ m, hits })
    settle(game.id, game.name, wager, m)
    setRecent((x) => [{ id: uid(), m, win: m > 0 }, ...x])
    if (m > 1) { setBanner(true); setTimeout(() => setBanner(false), 1300) }
    setBusy(false)
    return true
  }
  const runAuto = async () => {
    stop.current = false
    for (let i = rounds; i > 0; i--) {
      if (stop.current) break
      setAutoLeft(i)
      if (!(await play())) break
      await new Promise((r) => setTimeout(r, 500))
    }
    setAutoLeft(0)
    toast({ title: 'Autoplay finished', tone: 'info' })
  }

  return (
    <GameShell
      game={game}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="relative mx-auto w-full max-w-[620px]">
          <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
            {Array.from({ length: N }, (_, i) => i + 1).map((n) => {
              const picked = picks.includes(n), isDrawn = drawn.includes(n), hit = picked && isDrawn
              return (
                <motion.button key={n} onClick={() => toggle(n)} whileTap={!locked ? { scale: 0.94 } : undefined}
                  className={cn('relative aspect-square rounded-lg border num text-sm sm:text-base font-semibold transition-colors duration-150',
                    hit ? 'border-gold gold-fill text-ink' : picked ? 'border-gold/60 bg-gold/10 text-gold-bright' : isDrawn ? 'border-[#4a515d] bg-[#2a3039] text-snow' : 'border-steel bg-[linear-gradient(180deg,#232831,#1a1e25)] text-silver hover:text-snow hover:border-[#3a414d]',
                    locked && 'cursor-default')}>
                  {isDrawn && <motion.span layoutId={undefined} initial={{ scale: 0 }} animate={{ scale: 1 }} className={cn('absolute inset-1 rounded-md', hit ? '' : 'ring-1 ring-white/10')} />}
                  <span className="relative">{n}</span>
                </motion.button>
              )
            })}
          </div>
          <div className="mt-5 overflow-x-auto no-scrollbar">
            <div className="flex gap-1.5 min-w-max">
              {pays.map((m, h) => (
                <div key={h} className={cn('rounded-md border px-2.5 py-1.5 text-center min-w-[52px]', res?.hits === h ? 'border-gold bg-gold/15' : 'border-steel bg-ink')}>
                  <div className={cn('num text-xs font-semibold', m > 0 ? 'text-snow' : 'text-silver/60')}>{m}×</div>
                  <div className="text-[10px] text-silver">{h} hit{h === 1 ? '' : 's'}</div>
                </div>
              ))}
            </div>
          </div>
          <ResultBanner show={banner} win multiplier={res?.m ?? 0} payout={(res?.m ?? 0) * wager} />
        </div>
      }
      panel={
        <>
          <ModeTabs mode={mode} setMode={setMode} disabled={autoLeft > 0} />
          <WagerInput value={wager} onChange={setWager} disabled={locked} />
          <div className="flex items-center justify-between text-xs text-silver">
            <span><span className="num text-snow">{picks.length}</span> / {MAX} picked</span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="dark" onClick={quickPick} disabled={locked}>Auto pick</Button>
              <Button size="sm" variant="ghost" onClick={() => { setPicks([]); setDrawn([]); setRes(null) }} disabled={locked}>Clear</Button>
            </div>
          </div>
          {mode === 'auto' && <AutoRounds value={rounds} onChange={setRounds} disabled={autoLeft > 0} />}
          {mode === 'manual' ? <Button variant="gold" size="lg" className="w-full" onClick={play} loading={busy} disabled={!picks.length}>Draw 10 numbers</Button>
            : autoLeft > 0 ? <Button variant="dark" size="lg" className="w-full" onClick={() => { stop.current = true }}>Stop autoplay · {autoLeft} left</Button>
            : <Button variant="gold" size="lg" className="w-full" onClick={runAuto} disabled={!picks.length}>Start autoplay</Button>}
          <div className="rounded-lg border border-steel bg-ink px-3 py-2 text-xs text-silver">
            {res ? <>Hits <span className="num text-snow">{res.hits}</span> · payout <span className={cn('num', res.m > 0 ? 'text-emerald' : 'text-snow')}>{fmt(wager * res.m)} VC</span></> : <>Displayed RTP for {picks.length} picks: <span className="num text-snow">{(rtp * 100).toFixed(2)}%</span></>}
          </div>
        </>
      }
      info={{
        howTo: ['Pick between 1 and 10 numbers from the 40 on the board, or use Auto pick.', 'Set a demo wager and press Draw. Ten numbers are drawn at random.', 'The more of your numbers that are drawn, the higher the multiplier. The row under the board shows the paytable for your pick count.'],
        fairness: 'The ten numbers are chosen with a Fisher–Yates shuffle of all 40. Each paytable is built from the hypergeometric probabilities for your pick count and scaled to about 99% RTP.',
        odds: (
          <div className="num text-xs grid grid-cols-3 gap-y-1.5">
            <span className="text-silver">Hits</span><span className="text-silver text-right">Chance</span><span className="text-silver text-right">Multi</span>
            {pays.map((m, h) => [<span key={h + 'a'}>{h}</span>, <span key={h + 'b'} className="text-right text-snow">{(hitChance(picks.length, h) * 100).toFixed(3)}%</span>, <span key={h + 'c'} className="text-right text-snow">{m}×</span>])}
          </div>
        ),
      }}
    />
  )
}
