import { motion } from 'framer-motion'
import { RotateCcw, Undo2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '../components/ui'
import type { Game } from '../data/games'
import { cn, fmt, rand, uid } from '../lib/format'
import { useStore } from '../store'
import { GameShell, RecentStrip, ResultBanner, Stat } from './shared'

const ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])
const colorOf = (n: number) => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black')
const FILL = { green: '#1f8a5b', red: '#9e2129', black: '#15171c' }

type BetKey = string // 'n:17' | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | 'd1' | 'd2' | 'd3' | 'c1' | 'c2' | 'c3'
/** Payout multiplier (stake included) if `n` wins for bet `k`. */
export function rouletteMult(k: BetKey, n: number) {
  if (k.startsWith('n:')) return +k.slice(2) === n ? 36 : 0
  if (n === 0) return 0
  switch (k) {
    case 'red': return REDS.has(n) ? 2 : 0
    case 'black': return !REDS.has(n) ? 2 : 0
    case 'odd': return n % 2 ? 2 : 0
    case 'even': return n % 2 ? 0 : 2
    case 'low': return n <= 18 ? 2 : 0
    case 'high': return n >= 19 ? 2 : 0
    case 'd1': return n <= 12 ? 3 : 0
    case 'd2': return n > 12 && n <= 24 ? 3 : 0
    case 'd3': return n > 24 ? 3 : 0
    case 'c1': return n % 3 === 1 ? 3 : 0
    case 'c2': return n % 3 === 2 ? 3 : 0
    case 'c3': return n % 3 === 0 ? 3 : 0
  }
  return 0
}

const CHIPS = [1, 5, 10, 25, 100, 500]
function Chip({ v, small }: { v: number; small?: boolean }) {
  const c = v >= 500 ? '#7a5f14' : v >= 100 ? '#15171c' : v >= 25 ? '#1f8a5b' : v >= 10 ? '#2f5ea8' : v >= 5 ? '#9e2129' : '#6b7280'
  return (
    <span className={cn('grid place-items-center rounded-full border-2 border-dashed border-white/70 font-mono font-bold text-white shadow-md', small ? 'h-6 w-6 text-[8px]' : 'h-9 w-9 text-[10px]')} style={{ background: c, boxShadow: '0 0 0 2px ' + c }}>
      {v >= 1000 ? `${Math.round(v / 100) / 10}k` : v}
    </span>
  )
}

export default function Roulette({ game }: { game: Game }) {
  const { placeBet, settle, balance } = useStore()
  const [chip, setChip] = useState(10)
  const [bets, setBets] = useState<Record<BetKey, number>>({})
  const [history, setHistory] = useState<BetKey[]>([])
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<{ n: number; m: number; payout: number } | null>(null)
  const [banner, setBanner] = useState(false)
  const [lastBets, setLastBets] = useState<Record<BetKey, number> | null>(null)
  const [rot, setRot] = useState(0)
  const rotRef = useRef(0)
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>([])
  const [results, setResults] = useState<number[]>([])

  const total = Object.values(bets).reduce((s, v) => s + v, 0)
  const add = (k: BetKey) => {
    if (spinning) return
    if (total + chip > balance) return
    setResult(null)
    setBets((b) => ({ ...b, [k]: (b[k] ?? 0) + chip }))
    setHistory((h) => [...h, k])
  }
  const undo = () => {
    const k = history[history.length - 1]
    if (!k) return
    setHistory((h) => h.slice(0, -1))
    setBets((b) => { const v = (b[k] ?? 0) - chip; const nb = { ...b }; if (v > 0) nb[k] = v; else delete nb[k]; return nb })
  }

  const seg = 360 / ORDER.length
  const spin = async () => {
    if (!total || !placeBet(total)) return
    setSpinning(true); setResult(null); setBanner(false)
    const n = ORDER[Math.floor(rand() * ORDER.length)]
    const idx = ORDER.indexOf(n)
    const cur = rotRef.current % 360
    const next = rotRef.current - cur + 360 * 6 + (360 - idx * seg)
    rotRef.current = next; setRot(next)
    await new Promise((r) => setTimeout(r, 3300))
    const payout = Object.entries(bets).reduce((s, [k, v]) => s + v * rouletteMult(k, n), 0)
    const m = payout / total
    settle(game.id, game.name, total, m)
    setResult({ n, m, payout })
    setResults((r) => [n, ...r].slice(0, 14))
    setRecent((x) => [{ id: uid(), m, win: payout > total }, ...x])
    if (payout > total) { setBanner(true); setTimeout(() => setBanner(false), 1500) }
    setLastBets(bets); setSpinning(false)
  }
  const rebet = () => { if (lastBets) { setBets(lastBets); setHistory([]); setResult(null) } }

  const Spot = ({ k, children, className, n }: { k: BetKey; children: React.ReactNode; className?: string; n?: number }) => {
    const won = result && rouletteMult(k, result.n) > 0
    const isHit = result && n !== undefined && result.n === n
    return (
      <button onClick={() => add(k)} disabled={spinning}
        className={cn('relative grid place-items-center border border-white/10 text-[13px] font-semibold transition-[filter,box-shadow] duration-150 hover:brightness-125 disabled:cursor-default',
          isHit && 'ring-2 ring-inset ring-gold-bright z-[1]', won && !!bets[k] && 'ring-2 ring-inset ring-emerald', className)}>
        {children}
        {!!bets[k] && <span className="absolute -top-1 -right-1 z-[2]"><Chip v={bets[k]} small /></span>}
      </button>
    )
  }

  return (
    <GameShell
      game={game}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="relative space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-[220px] sm:w-[240px] shrink-0">
              <svg viewBox="0 0 240 240" className="w-full">
                <defs><linearGradient id="rl-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FBE7A1" /><stop offset=".5" stopColor="#D4AF37" /><stop offset="1" stopColor="#7a5f14" /></linearGradient></defs>
                <circle cx="120" cy="120" r="118" fill="#0b0d10" stroke="url(#rl-rim)" strokeWidth="3" />
                <motion.g animate={{ rotate: rot }} transition={{ duration: 3.2, ease: [0.12, 0.8, 0.2, 1] }}>
                  {ORDER.map((n, i) => {
                    const a0 = ((i * seg - 90 - seg / 2) * Math.PI) / 180, a1 = (((i + 1) * seg - 90 - seg / 2) * Math.PI) / 180
                    const p = (a: number, r: number) => `${120 + Math.cos(a) * r} ${120 + Math.sin(a) * r}`
                    const mid = ((i * seg - 90) * Math.PI) / 180
                    return (
                      <g key={n}>
                        <path d={`M${p(a0, 108)} A108 108 0 0 1 ${p(a1, 108)} L${p(a1, 76)} A76 76 0 0 0 ${p(a0, 76)} Z`} fill={FILL[colorOf(n)]} stroke="#D4AF37" strokeOpacity=".35" strokeWidth=".6" />
                        <text x={120 + Math.cos(mid) * 96} y={120 + Math.sin(mid) * 96} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="700" fill="#F7F7F8" fontFamily="JetBrains Mono" transform={`rotate(${i * seg} ${120 + Math.cos(mid) * 96} ${120 + Math.sin(mid) * 96})`}>{n}</text>
                      </g>
                    )
                  })}
                  <circle cx="120" cy="120" r="76" fill="#13161C" stroke="#2A3039" />
                  {[0, 1, 2, 3].map((i) => <rect key={i} x="116" y="56" width="8" height="64" rx="4" fill="url(#rl-rim)" opacity=".85" transform={`rotate(${i * 45} 120 120)`} />)}
                  <circle cx="120" cy="120" r="14" fill="url(#rl-rim)" />
                </motion.g>
                <motion.circle cx="120" cy="18" r="5" fill="#F7F7F8" animate={spinning ? { opacity: [1, 0.6, 1] } : { opacity: 1 }} transition={{ duration: 0.3, repeat: spinning ? Infinity : 0 }} />
                <path d="M120 2 L113 -8 L127 -8 Z" fill="#F7F7F8" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="label">Result</div>
              <div className="mt-1 flex items-center justify-center sm:justify-start gap-3">
                {result ? (
                  <motion.span key={result.n} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid h-16 w-16 place-items-center rounded-xl num text-3xl font-bold text-white" style={{ background: FILL[colorOf(result.n)] }}>{result.n}</motion.span>
                ) : <span className="grid h-16 w-16 place-items-center rounded-xl border border-steel bg-ink text-silver num text-xl">{spinning ? '··' : '–'}</span>}
                <div className="text-sm text-silver">{result ? (result.payout > 0 ? <span className="text-emerald num">+{fmt(result.payout)} VC</span> : 'No winning bets') : spinning ? 'Ball is spinning…' : 'Place chips, then spin.'}</div>
              </div>
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-1.5">
                {results.map((n, i) => <span key={i} className="grid h-7 w-7 place-items-center rounded-md num text-[11px] font-semibold text-white" style={{ background: FILL[colorOf(n)], opacity: i ? 0.75 : 1 }}>{n}</span>)}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar -mx-1 px-1 pt-2">
            <div className="min-w-[600px] select-none">
              <div className="grid grid-cols-[48px_repeat(12,1fr)_48px] grid-rows-[repeat(3,44px)] rounded-lg overflow-hidden border border-gold/30">
                <Spot k="n:0" n={0} className="row-span-3 bg-[#1f8a5b] text-white">0</Spot>
                {[3, 2, 1].map((rowStart) => Array.from({ length: 12 }, (_, c) => {
                  const n = rowStart + c * 3
                  return <Spot key={n} k={`n:${n}`} n={n} className={cn('text-white', REDS.has(n) ? 'bg-[#9e2129]' : 'bg-[#15171c]')}>{n}</Spot>
                }))}
                <Spot k="c3" className="col-start-[14] row-start-1 bg-graphite text-silver text-xs">2:1</Spot>
                <Spot k="c2" className="col-start-[14] row-start-2 bg-graphite text-silver text-xs">2:1</Spot>
                <Spot k="c1" className="col-start-[14] row-start-3 bg-graphite text-silver text-xs">2:1</Spot>
              </div>
              <div className="mt-1.5 grid grid-cols-[48px_repeat(3,1fr)_48px] gap-1.5 h-10">
                <span />
                <Spot k="d1" className="rounded-md bg-graphite text-snow text-xs">1st 12</Spot>
                <Spot k="d2" className="rounded-md bg-graphite text-snow text-xs">2nd 12</Spot>
                <Spot k="d3" className="rounded-md bg-graphite text-snow text-xs">3rd 12</Spot>
              </div>
              <div className="mt-1.5 grid grid-cols-[48px_repeat(6,1fr)_48px] gap-1.5 h-10">
                <span />
                <Spot k="low" className="rounded-md bg-graphite text-snow text-xs">1–18</Spot>
                <Spot k="even" className="rounded-md bg-graphite text-snow text-xs">Even</Spot>
                <Spot k="red" className="rounded-md bg-[#9e2129] text-white text-xs">Red</Spot>
                <Spot k="black" className="rounded-md bg-[#15171c] text-white text-xs">Black</Spot>
                <Spot k="odd" className="rounded-md bg-graphite text-snow text-xs">Odd</Spot>
                <Spot k="high" className="rounded-md bg-graphite text-snow text-xs">19–36</Spot>
              </div>
            </div>
          </div>
          <ResultBanner show={banner} win multiplier={result?.m ?? 0} payout={result?.payout ?? 0} />
        </div>
      }
      panel={
        <>
          <div>
            <div className="mb-2 text-xs font-medium text-silver">Chip value</div>
            <div className="flex flex-wrap gap-2">
              {CHIPS.map((v) => (
                <button key={v} onClick={() => setChip(v)} disabled={spinning} aria-label={`${v} VC chip`} className={cn('rounded-full p-0.5 transition-transform', chip === v ? 'ring-2 ring-gold scale-110' : 'opacity-80 hover:opacity-100')}><Chip v={v} /></button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Total demo bet" value={fmt(total)} suffix="VC" />
            <Stat label="Max possible payout" value={fmt(Math.max(0, ...ORDER.map((n) => Object.entries(bets).reduce((s, [k, v]) => s + v * rouletteMult(k, n), 0))))} suffix="VC" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="dark" size="sm" onClick={undo} disabled={spinning || !history.length}><Undo2 className="h-3.5 w-3.5" />Undo</Button>
            <Button variant="dark" size="sm" onClick={() => { setBets({}); setHistory([]) }} disabled={spinning || !total}>Clear</Button>
            <Button variant="dark" size="sm" onClick={rebet} disabled={spinning || !lastBets || total > 0}><RotateCcw className="h-3.5 w-3.5" />Rebet</Button>
          </div>
          <Button variant="gold" size="lg" className="w-full" onClick={spin} loading={spinning} disabled={!total}>Spin</Button>
          <p className="text-[11px] text-silver leading-relaxed">Tap the table to place your selected chip. Single zero, European layout.</p>
        </>
      }
      info={{
        howTo: ['Choose a chip value, then tap numbers or outside bets on the table to place chips. Tap again to add more.', 'Press Spin. The wheel stops on one of 37 pockets (0–36).', 'Straight numbers pay 35 to 1, dozens and columns 2 to 1, and red/black, odd/even and high/low 1 to 1.', 'Zero loses all outside bets.'],
        fairness: 'Each of the 37 pockets is equally likely. With a single zero every bet carries a 2.70% house edge, which is an RTP of 97.30%.',
        odds: <div className="grid grid-cols-3 gap-y-1.5 num text-xs"><span className="text-silver">Bet</span><span className="text-silver text-right">Pays</span><span className="text-silver text-right">Chance</span>{[['Straight', '35:1', 1], ['Dozen / column', '2:1', 12], ['Red / black', '1:1', 18], ['Odd / even', '1:1', 18]].map(([b, p, c]) => [<span key={b + 'a'}>{b}</span>, <span key={b + 'b'} className="text-right text-snow">{p}</span>, <span key={b + 'c'} className="text-right text-snow">{((+c / 37) * 100).toFixed(2)}%</span>])}</div>,
      }}
    />
  )
}
