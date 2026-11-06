import { motion } from 'framer-motion'
import { sfx } from '../lib/sfx'
import { useEffect, useRef, useState } from 'react'
import { Button, Segmented } from '../components/ui'
import type { Game } from '../data/games'
import { cn, rand, uid } from '../lib/format'
import { useStore } from '../store'
import { AutoRounds, GameShell, ModeTabs, RecentStrip, WagerInput, type Mode } from './shared'

type Risk = 'low' | 'medium' | 'high'
export const WHEELS: Record<Risk, number[]> = {
  low: [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
  medium: [0, 1.5, 0, 2, 0, 1.5, 0, 1.8, 0, 4.2, 0, 1.5, 0, 2, 0, 1.5, 0, 1.8, 0, 2],
  high: [29.7, ...Array.from({ length: 29 }, () => 0)],
}
const COLORS: Record<string, string> = { '0': '#262b33', '1.2': '#8a7430', '1.5': '#D4AF37', '1.8': '#9FB4C2', '2': '#31C48D', '4.2': '#e8794a', '29.7': '#E5484D' }
const col = (m: number) => COLORS[String(m)] ?? '#D4AF37'

export default function Wheel({ game }: { game: Game }) {
  const { placeBet, settle, toast } = useStore()
  const [wager, setWager] = useState(10)
  const [risk, setRisk] = useState<Risk>('medium')
  const [rot, setRot] = useState(0)
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<{ m: number; idx: number } | null>(null)
  const [mode, setMode] = useState<Mode>('manual')
  const [rounds, setRounds] = useState(10)
  const [autoLeft, setAutoLeft] = useState(0)
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>([])
  const stop = useRef(false)
  const rotRef = useRef(0)
  useEffect(() => () => { stop.current = true }, [])

  const segs = WHEELS[risk]
  const n = segs.length
  const seg = 360 / n
  const R = 150, C = 170

  const spin = async () => {
    if (!placeBet(wager)) return false
    sfx('spin')
    setBusy(true); setRes(null)
    const idx = Math.floor(rand() * n)
    const jitter = (rand() - 0.5) * seg * 0.7
    const current = rotRef.current % 360
    const targetAngle = 360 - (idx + 0.5) * seg + jitter
    const next = rotRef.current - current + 360 * 5 + targetAngle
    rotRef.current = next
    setRot(next)
    await new Promise((r) => setTimeout(r, 2300))
    const m = segs[idx]
    setRes({ m, idx })
    settle(game.id, game.name, wager, m)
    setRecent((x) => [{ id: uid(), m, win: m > 0 }, ...x])
        setBusy(false)
    return true
  }
  const runAuto = async () => {
    stop.current = false
    for (let i = rounds; i > 0; i--) {
      if (stop.current) break
      setAutoLeft(i)
      if (!(await spin())) break
      await new Promise((r) => setTimeout(r, 400))
    }
    setAutoLeft(0)
    toast({ title: 'Autoplay finished', tone: 'info' })
  }
  const running = autoLeft > 0
  const legend = Array.from(new Set(segs)).sort((a, b) => a - b).map((m) => ({ m, p: segs.filter((x) => x === m).length / n }))

  const arc = (i: number) => {
    const a0 = ((i * seg - 90) * Math.PI) / 180, a1 = (((i + 1) * seg - 90) * Math.PI) / 180
    const p = (a: number, r: number) => `${C + Math.cos(a) * r} ${C + Math.sin(a) * r}`
    return `M${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} L${p(a1, R - 34)} A${R - 34} ${R - 34} 0 0 0 ${p(a0, R - 34)} Z`
  }

  return (
    <GameShell
      game={game}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="relative mx-auto w-full max-w-[420px]">
          <div className="relative">
            <svg viewBox="0 0 340 340" className="w-full">
              <defs>
                <linearGradient id="wh-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FBE7A1" /><stop offset=".5" stopColor="#D4AF37" /><stop offset="1" stopColor="#7a5f14" /></linearGradient>
              </defs>
              <circle cx={C} cy={C} r={R + 12} fill="#0b0d10" stroke="url(#wh-rim)" strokeWidth="3" />
              <motion.g key={risk} animate={{ rotate: rot }} transition={{ duration: 2.2, ease: [0.15, 0.85, 0.25, 1] }}>
                {segs.map((m, i) => (
                  <path key={i} d={arc(i)} fill={col(m)} stroke="#0b0d10" strokeWidth={n > 20 ? 1 : 2} opacity={res && res.idx !== i && !busy ? 0.55 : 1} />
                ))}
              </motion.g>
              <circle cx={C} cy={C} r={R - 40} fill="#13161C" stroke="#2A3039" />
              <path d={`M${C} ${C - R + 6} L${C - 12} ${C - R - 18} L${C + 12} ${C - R - 18} Z`} fill="#F7F7F8" stroke="#0b0d10" strokeWidth="2" />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className={cn('num font-display text-4xl sm:text-5xl font-bold', res ? (res.m > 0 ? 'gold-text' : 'text-silver') : 'text-snow/70')}>{res ? `${res.m.toFixed(2)}×` : busy ? '···' : '0.00×'}</div>
                <div className="mt-1 text-xs text-silver">{res ? (res.m > 0 ? 'Demo win' : 'No payout') : `${n} segments`}</div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {legend.map((l) => (
              <span key={l.m} className="inline-flex items-center gap-1.5 rounded-md border border-steel bg-ink px-2 h-7 text-[11px] num">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: col(l.m) }} />{l.m.toFixed(2)}× <span className="text-silver">{(l.p * 100).toFixed(0)}%</span>
              </span>
            ))}
          </div>
        </div>
      }
      panel={
        <>
          <ModeTabs mode={mode} setMode={setMode} disabled={running} />
          <WagerInput value={wager} onChange={setWager} disabled={running || busy} />
          <div>
            <div className="mb-1.5 text-xs font-medium text-silver">Risk</div>
            <Segmented value={risk} onChange={(r) => { setRisk(r); setRes(null); rotRef.current = 0; setRot(0) }} disabled={running || busy} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
          </div>
          {mode === 'auto' && <AutoRounds value={rounds} onChange={setRounds} disabled={running} />}
          {mode === 'manual' ? <Button variant="gold" size="lg" className="w-full" onClick={spin} loading={busy}>Spin wheel</Button>
            : running ? <Button variant="dark" size="lg" className="w-full" onClick={() => { stop.current = true }}>Stop autoplay · {autoLeft} left</Button>
            : <Button variant="gold" size="lg" className="w-full" onClick={runAuto}>Start autoplay</Button>}
          <p className="text-[11px] text-silver leading-relaxed">Max multiplier <span className="num text-snow">{Math.max(...segs)}×</span> · every risk level has a 99% RTP.</p>
        </>
      }
      info={{
        howTo: ['Choose a demo wager and a risk level.', 'Low risk has 10 segments with frequent small wins. High risk has 30 segments with a single 29.70× segment.', 'Press Spin. The segment under the pointer sets your multiplier.'],
        fairness: 'Each segment is equally likely. The multipliers on every wheel average to 0.99, which is a 99% RTP.',
        odds: <div className="space-y-1.5 num text-xs">{legend.map((l) => <div key={l.m} className="flex justify-between"><span className="text-silver">{l.m.toFixed(2)}×</span><span className="text-snow">{(l.p * 100).toFixed(1)}%</span></div>)}</div>,
      }}
    />
  )
}
