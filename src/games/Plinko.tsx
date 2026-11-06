import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Segmented } from '../components/ui'
import type { Game } from '../data/games'
import { cn, rand, uid } from '../lib/format'
import { useStore } from '../store'
import { AutoRounds, GameShell, ModeTabs, RecentStrip, WagerInput, type Mode } from './shared'

type Risk = 'low' | 'medium' | 'high'
const binom = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r }
const round = (v: number) => (v >= 10 ? Math.round(v) : v >= 2 ? Math.round(v * 10) / 10 : Math.max(0.1, Math.round(v * 100) / 100))

export function plinkoTable(n: number, risk: Risk) {
  const [a, p] = risk === 'low' ? [2.0, 2.2] : risk === 'medium' ? [3.6, 1.9] : [6.0, 1.5]
  const raw = Array.from({ length: n + 1 }, (_, k) => Math.exp(a * Math.pow(Math.abs(k - n / 2) / (n / 2), p)))
  const ev = raw.reduce((s, r, k) => s + r * binom(n, k) / 2 ** n, 0)
  const mults = raw.map((r) => round((r * 0.99) / ev))
  const rtp = mults.reduce((s, m, k) => s + m * binom(n, k) / 2 ** n, 0)
  return { mults, rtp }
}

const W = 600
interface Ball { id: string; xs: number[]; ys: number[]; times: number[]; pocket: number; wager: number; dur: number }

function color(m: number) {
  if (m >= 10) return ['#E5484D', '#fff']
  if (m >= 3) return ['#e8794a', '#fff']
  if (m >= 1.5) return ['#D4AF37', '#0b0c0f']
  if (m >= 1) return ['#8a7430', '#fff']
  return ['#2A3039', '#c9ced6']
}

export default function Plinko({ game }: { game: Game }) {
  const { placeBet, settle, toast } = useStore()
  const [wager, setWager] = useState(10)
  const [rows, setRows] = useState(12)
  const [risk, setRisk] = useState<Risk>('medium')
  const [balls, setBalls] = useState<Ball[]>([])
  const [hit, setHit] = useState<{ k: number; id: string } | null>(null)
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>([])
  const [mode, setMode] = useState<Mode>('manual')
  const [rounds, setRounds] = useState(10)
  const [autoLeft, setAutoLeft] = useState(0)
  const stop = useRef(false)
  useEffect(() => () => { stop.current = true }, [])

  const { mults, rtp } = useMemo(() => plinkoTable(rows, risk), [rows, risk])
  const s = W / (rows + 2)
  const rowH = s * 0.86
  const top = 30
  const H = top + rows * rowH + 56
  const cx = W / 2
  const pinR = Math.max(3, s * 0.09)
  const ballR = Math.max(6, s * 0.2)

  const drop = () => {
    if (!placeBet(wager)) return false
    let R = 0
    const xs: number[] = [cx + (rand() - 0.5) * 4], ys: number[] = [top - 26]
    for (let r = 0; r < rows; r++) {
      const px = cx + (R - r / 2) * s
      const py = top + r * rowH - pinR - ballR
      if (r > 0) { xs.push((xs[xs.length - 1] + px) / 2); ys.push(py - rowH * 0.45) }
      xs.push(px); ys.push(py)
      if (rand() < 0.5) R++
    }
    const fx = cx + (R - rows / 2) * s
    xs.push((xs[xs.length - 1] + fx) / 2); ys.push(top + (rows - 1) * rowH - rowH * 0.3)
    xs.push(fx); ys.push(top + rows * rowH + 14)
    const times = xs.map((_, i) => i / (xs.length - 1))
    const ball: Ball = { id: uid(), xs, ys, times, pocket: R, wager, dur: 0.16 * rows + 0.3 }
    setBalls((b) => [...b, ball])
    return true
  }

  const land = (b: Ball) => {
    const m = mults[b.pocket]
    setBalls((all) => all.filter((x) => x.id !== b.id))
    setHit({ k: b.pocket, id: b.id })
    settle(game.id, game.name, b.wager, m)
    setRecent((r) => [{ id: b.id, m, win: m >= 1 }, ...r])
  }

  const runAuto = async () => {
    stop.current = false
    for (let i = rounds; i > 0; i--) {
      if (stop.current) break
      setAutoLeft(i)
      if (!drop()) break
      await new Promise((res) => setTimeout(res, 420))
    }
    setAutoLeft(0)
    toast({ title: 'Autoplay finished', tone: 'info' })
  }
  const running = autoLeft > 0
  const locked = balls.length > 0 || running

  return (
    <GameShell
      game={game}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="mx-auto w-full max-w-[640px]">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <defs>
              <radialGradient id="pk-pin" cx=".35" cy=".35" r=".7"><stop offset="0" stopColor="#FBE7A1" /><stop offset=".6" stopColor="#D4AF37" /><stop offset="1" stopColor="#7a5f14" /></radialGradient>
              <radialGradient id="pk-ball" cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="#ffffff" /><stop offset=".35" stopColor="#F5D778" /><stop offset="1" stopColor="#B8932A" /></radialGradient>
            </defs>
            {Array.from({ length: rows }, (_, r) => Array.from({ length: r + 3 }, (_, j) => (
              <circle key={`${r}-${j}`} cx={cx + (j - (r + 2) / 2) * s} cy={top + r * rowH} r={pinR} fill="url(#pk-pin)" />
            )))}
            {mults.map((m, k) => {
              const [bg, fg] = color(m)
              const x = cx + (k - rows / 2) * s
              const isHit = hit?.k === k
              return (
                <motion.g key={`${rows}-${risk}-${k}-${isHit ? hit!.id : ''}`} initial={isHit ? { y: 0 } : false} animate={isHit ? { y: [0, 6, 0] } : {}} transition={{ duration: 0.3 }}>
                  <rect x={x - s / 2 + 2} y={top + rows * rowH + 6} width={s - 4} height={30} rx="5" fill={bg} stroke={isHit ? '#F5D778' : 'transparent'} strokeWidth="2" />
                  <text x={x} y={top + rows * rowH + 25} textAnchor="middle" fontSize={rows >= 16 ? 10 : rows >= 12 ? 11.5 : 13} fontWeight="700" fill={fg} fontFamily="JetBrains Mono">{m}{rows < 16 && m < 100 ? '×' : ''}</text>
                </motion.g>
              )
            })}
            {balls.map((b) => (
              <motion.circle key={b.id} r={ballR} fill="url(#pk-ball)"
                initial={{ cx: b.xs[0], cy: b.ys[0] }}
                animate={{ cx: b.xs, cy: b.ys }}
                transition={{ duration: b.dur, times: b.times, ease: 'linear' }}
                onAnimationComplete={() => land(b)}
                style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.6))' }} />
            ))}
          </svg>
        </div>
      }
      panel={
        <>
          <ModeTabs mode={mode} setMode={setMode} disabled={running} />
          <WagerInput value={wager} onChange={setWager} disabled={running} />
          <div>
            <div className="mb-1.5 text-xs font-medium text-silver">Risk</div>
            <Segmented value={risk} onChange={setRisk} disabled={locked} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
          </div>
          <div>
            <div className="mb-1.5 text-xs font-medium text-silver">Rows</div>
            <div className="grid grid-cols-3 gap-1.5">
              {[8, 12, 16].map((n) => (
                <button key={n} disabled={locked} onClick={() => setRows(n)} className={cn('h-9 rounded-lg border text-xs font-semibold num transition-colors disabled:opacity-50', rows === n ? 'border-gold/60 bg-gold/10 text-gold-bright' : 'border-steel bg-ink text-silver hover:text-snow')}>{n}</button>
              ))}
            </div>
          </div>
          {mode === 'auto' && <AutoRounds value={rounds} onChange={setRounds} disabled={running} />}
          {mode === 'manual' ? (
            <Button variant="gold" size="lg" className="w-full" onClick={drop}>Drop ball</Button>
          ) : running ? (
            <Button variant="dark" size="lg" className="w-full" onClick={() => { stop.current = true }}>Stop autoplay · {autoLeft} left</Button>
          ) : (
            <Button variant="gold" size="lg" className="w-full" onClick={runAuto}>Start autoplay</Button>
          )}
          <p className="text-[11px] text-silver leading-relaxed">Max multiplier <span className="num text-snow">{Math.max(...mults)}×</span> · displayed RTP <span className="num text-snow">{(rtp * 100).toFixed(2)}%</span></p>
        </>
      }
      info={{
        howTo: ['Choose a demo wager, a risk level and 8, 12 or 16 rows.', 'Press Drop ball. At every pin the ball goes left or right with equal probability.', 'The pocket it lands in sets your multiplier. Centre pockets are most likely; edges are rare.', 'You can drop several balls at once.'],
        fairness: `Pocket probabilities follow a binomial distribution: for ${rows} rows, pocket k has probability C(${rows},k) ÷ 2^${rows}. Multipliers are scaled so the displayed RTP is about 99%.`,
        odds: (
          <div className="num text-xs grid grid-cols-3 gap-y-1.5">
            <span className="text-silver">Pocket</span><span className="text-silver text-right">Chance</span><span className="text-silver text-right">Multi</span>
            {mults.slice(0, Math.floor(rows / 2) + 1).map((m, k) => [
              <span key={k + 'a'}>{k} / {rows - k}</span>, <span key={k + 'b'} className="text-right text-snow">{((binom(rows, k) / 2 ** rows) * 200 / (k === rows / 2 ? 2 : 1)).toFixed(3)}%</span>, <span key={k + 'c'} className="text-right text-snow">{m}×</span>,
            ])}
          </div>
        ),
      }}
    />
  )
}
