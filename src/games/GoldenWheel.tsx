import { motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { Button } from '../components/ui'
import type { Game } from '../data/games'
import { cn, rand, uid } from '../lib/format'
import { sfx } from '../lib/sfx'
import { useStore } from '../store'
import { BetSpot, ChipPanel, Felt, Road, useChipBets, wait } from './live'
import { GameShell, RecentStrip, ResultBanner } from './shared'

type K = '2' | '4' | '6' | '12' | '24'
/** Return multiplier → number of segments. Every bet returns 96%: count × multiplier = 48 of 50. */
export const GW_COUNTS: Record<K, number> = { '2': 24, '4': 12, '6': 8, '12': 4, '24': 2 }
export const GW_TOTAL = 50
const KEYS: K[] = ['2', '4', '6', '12', '24']
const COLOR: Record<K, string> = { '2': '#8a7430', '4': '#2f5ea8', '6': '#1f8a5b', '12': '#9e2129', '24': '#F5D778' }

/** Spread the segments around the wheel so equal values are not bunched together. */
export const GW_SEGMENTS: K[] = (() => {
  const slots: { k: K; pos: number }[] = []
  for (const k of KEYS) for (let i = 0; i < GW_COUNTS[k]; i++) slots.push({ k, pos: (i + 0.5) / GW_COUNTS[k] + KEYS.indexOf(k) * 0.013 })
  return slots.sort((a, b) => a.pos - b.pos).map((s) => s.k)
})()

export default function GoldenWheel({ game }: { game: Game }) {
  const { placeBet, settle } = useStore()
  const chips = useChipBets<K>()
  const [rot, setRot] = useState(0)
  const rotRef = useRef(0)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string>()
  const [res, setRes] = useState<{ idx: number; k: K; m: number; payout: number } | null>(null)
  const [banner, setBanner] = useState(false)
  const [road, setRoad] = useState<{ id: string; label: string; color: string }[]>([])
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>([])

  const n = GW_SEGMENTS.length, seg = 360 / n, R = 160, C = 175

  const spin = async () => {
    const stake = chips.total
    if (!stake || !placeBet(stake)) return
    const bets = { ...chips.bets }
    chips.commit()
    setBusy(true); setRes(null); setBanner(false)
    setStatus('No more bets. The wheel is spinning.')
    sfx('spin')
    const idx = Math.floor(rand() * n)
    const jitter = (rand() - 0.5) * seg * 0.6
    const next = rotRef.current - (rotRef.current % 360) + 360 * 5 + (360 - (idx + 0.5) * seg) + jitter
    rotRef.current = next; setRot(next)
    const ticks = setInterval(() => sfx('tick'), 110)
    await wait(4200)
    clearInterval(ticks)
    const k = GW_SEGMENTS[idx]
    const payout = (bets[k] ?? 0) * +k
    const m = payout / stake
    settle(game.id, game.name, stake, m)
    setRes({ idx, k, m, payout })
    setStatus(`The wheel lands on ${k}×.`)
    setRoad((r) => [{ id: uid(), label: k, color: COLOR[k] }, ...r])
    setRecent((x) => [{ id: uid(), m, win: payout > stake }, ...x])
    if (payout > stake) { setBanner(true); setTimeout(() => setBanner(false), 1500) }
    setBusy(false)
  }

  const maxWin = useMemo(() => Math.max(0, ...KEYS.map((k) => (chips.bets[k] ?? 0) * +k)), [chips.bets])

  return (
    <GameShell
      game={game}
      liveStatus={busy || res ? status : undefined}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="relative space-y-4">
          <Felt tone="noir" className="pb-5">
            <div className="relative mx-auto w-full max-w-[380px]">
              <svg viewBox="0 0 350 350" className="w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
                <defs>
                  <linearGradient id="gw-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FBE7A1" /><stop offset=".5" stopColor="#D4AF37" /><stop offset="1" stopColor="#7a5f14" /></linearGradient>
                  <radialGradient id="gw-hub"><stop offset="0" stopColor="#2a2f38" /><stop offset="1" stopColor="#0b0d10" /></radialGradient>
                </defs>
                <circle cx={C} cy={C} r={R + 12} fill="#0b0d10" stroke="url(#gw-rim)" strokeWidth="6" />
                {Array.from({ length: 25 }, (_, i) => { const a = (i / 25) * Math.PI * 2; return <circle key={i} cx={C + Math.cos(a) * (R + 12)} cy={C + Math.sin(a) * (R + 12)} r="3" fill="#FBE7A1" opacity={busy && i % 2 === Math.floor(rot) % 2 ? 1 : 0.55} /> })}
                <motion.g style={{ originX: `${C}px`, originY: `${C}px` }} animate={{ rotate: rot }} transition={{ duration: 4, ease: [0.12, 0.75, 0.15, 1] }}>
                  {GW_SEGMENTS.map((k, i) => {
                    const a0 = ((i * seg - 90) * Math.PI) / 180, a1 = (((i + 1) * seg - 90) * Math.PI) / 180, am = (((i + 0.5) * seg - 90) * Math.PI) / 180
                    const p = (a: number, r: number) => `${C + Math.cos(a) * r} ${C + Math.sin(a) * r}`
                    const tx = C + Math.cos(am) * (R - 22), ty = C + Math.sin(am) * (R - 22)
                    return (
                      <g key={i} opacity={res && !busy && res.idx !== i ? 0.5 : 1}>
                        <path d={`M${p(a0, 46)} L${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} L${p(a1, 46)} Z`} fill={COLOR[k]} stroke="#0b0d10" strokeWidth="1.2" />
                        <text x={tx} y={ty} fill={k === '24' ? '#0b0d10' : '#F7F7F8'} fontSize="11" fontWeight="800" textAnchor="middle" dominantBaseline="middle" fontFamily="JetBrains Mono, monospace" transform={`rotate(${(i + 0.5) * seg} ${tx} ${ty})`}>{k}</text>
                      </g>
                    )
                  })}
                </motion.g>
                <circle cx={C} cy={C} r="46" fill="url(#gw-hub)" stroke="url(#gw-rim)" strokeWidth="3" />
                <text x={C} y={C - 6} fill="#D4AF37" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="Sora, sans-serif" letterSpacing="2">GOLDEN</text>
                <text x={C} y={C + 10} fill="#D4AF37" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="Sora, sans-serif" letterSpacing="2">WHEEL</text>
                <path d={`M${C} ${C - R + 4} L${C - 12} ${C - R - 22} L${C + 12} ${C - R - 22} Z`} fill="#F7F7F8" stroke="#0b0d10" strokeWidth="2" />
              </svg>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-3">
              {KEYS.map((k) => (
                <BetSpot key={k} className="min-h-[70px]" label={<span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[k] }} />{k}×</span>}
                  pays={`${GW_COUNTS[k]} of 50`} amount={chips.bets[k]} onClick={() => chips.add(k)} disabled={busy} result={res && res.k === k && !busy ? 'win' : undefined} />
              ))}
            </div>
          </Felt>
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-silver">Results this session</div>
            {road.length ? <Road items={road} /> : <div className="text-xs text-silver/70">No spins yet.</div>}
          </div>
          <ResultBanner show={banner} win multiplier={res?.m ?? 0} payout={res?.payout ?? 0} />
        </div>
      }
      panel={
        <>
          <ChipPanel chips={chips} locked={busy} maxWin={maxWin} />
          <Button variant="gold" size="lg" className="w-full" onClick={spin} loading={busy} disabled={!chips.total}>Spin the wheel</Button>
          <p className={cn('text-[11px] text-silver leading-relaxed')}>Bet on one or more segment values. If the wheel stops on your value, that bet returns its multiplier.</p>
        </>
      }
      info={{
        howTo: ['Pick a chip and place it on 2×, 4×, 6×, 12× or 24×. You can cover several values.', 'Press Spin. The host spins a 50-segment wheel.', 'If the pointer stops on a value you bet on, that bet returns stake × the value. Other bets lose.'],
        fairness: 'All 50 segments are equally likely. Each value appears often enough that every bet returns exactly 96% over the long run (for example, 24 of 50 segments are 2×, and 24 × 2 = 48 of 50).',
        odds: <div className="grid grid-cols-3 gap-y-1.5 num text-xs"><span className="text-silver">Value</span><span className="text-silver text-right">Segments</span><span className="text-silver text-right">Chance</span>{KEYS.map((k) => [<span key={k + 1}>{k}×</span>, <span key={k + 2} className="text-right text-snow">{GW_COUNTS[k]}</span>, <span key={k + 3} className="text-right text-snow">{(GW_COUNTS[k] / GW_TOTAL * 100).toFixed(0)}%</span>])}</div>,
      }}
    />
  )
}
