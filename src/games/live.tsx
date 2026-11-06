import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, Undo2 } from 'lucide-react'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '../components/ui'
import { cn, fmt, rand } from '../lib/format'
import { sfx } from '../lib/sfx'
import { useStore } from '../store'
import type { PCard } from './cards'
import { Stat } from './shared'

/* ------------------------------------------------------------------ live context */

export interface LiveInfo { host: string; table: string }
export const LiveCtx = createContext<LiveInfo | null>(null)
export const useLive = () => useContext(LiveCtx)

const IDLE_LINES = ['Welcome to the table.', 'Place your bets whenever you are ready.', 'Good luck, and play within your limits.', 'Take your time. The table waits for you.']

/** Illustrated host bar shown above live-style tables. Everything here is simulated. */
export function LiveHostBar({ status }: { status?: string }) {
  const live = useLive()
  const [idle, setIdle] = useState(0)
  useEffect(() => { if (status) return; const t = setInterval(() => setIdle((i) => (i + 1) % IDLE_LINES.length), 5000); return () => clearInterval(t) }, [status])
  if (!live) return null
  const line = status ?? IDLE_LINES[idle]
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gold/25 bg-[linear-gradient(90deg,rgba(212,175,55,0.09),transparent_70%)] p-2.5 pr-4">
      <HostAvatar name={live.host} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-snow">{live.host}</span>
          <span className="rounded border border-steel px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.12em] text-silver">Simulated host</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={line} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="mt-0.5 truncate text-[13px] text-silver">“{line}”</motion.div>
        </AnimatePresence>
      </div>
      <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-bright">
        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ruby/60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-ruby" /></span>
        Live-style · no stream
      </span>
    </div>
  )
}

function HostAvatar({ name }: { name: string }) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360
  return (
    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-gold/60 bg-[#14171d]">
      <svg viewBox="0 0 44 44" className="h-full w-full">
        <defs><linearGradient id={`hv-${h}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={`hsl(${h} 30% 30%)`} /><stop offset="1" stopColor="#0b0d10" /></linearGradient></defs>
        <rect width="44" height="44" fill={`url(#hv-${h})`} />
        <circle cx="22" cy="18" r="8" fill="#D4AF37" opacity=".85" />
        <path d="M6 44c2-10 9-14 16-14s14 4 16 14z" fill="#D4AF37" opacity=".85" />
        <path d="M18 31l4 5 4-5" fill="none" stroke="#0b0d10" strokeWidth="2" />
      </svg>
    </span>
  )
}

/** Green-felt table surface used by the card tables. */
export function Felt({ children, tone = 'green', className }: { children: ReactNode; tone?: 'green' | 'red' | 'blue' | 'noir'; className?: string }) {
  const bg = { green: 'bg-[radial-gradient(ellipse_at_50%_25%,#14392a,#0a1a14_72%)] border-[#1d3a2e]', red: 'bg-[radial-gradient(ellipse_at_50%_25%,#3a1416,#140708_72%)] border-[#3a1d1f]', blue: 'bg-[radial-gradient(ellipse_at_50%_25%,#142a3a,#070f16_72%)] border-[#1d2e3a]', noir: 'bg-[radial-gradient(ellipse_at_50%_25%,#22222c,#09090d_72%)] border-[#2a2a36]' }[tone]
  return <div className={cn('relative overflow-hidden rounded-2xl border p-4 sm:p-6', bg, className)}>{children}</div>
}

/* ------------------------------------------------------------------ shoe */

/** A multi-deck shoe that reshuffles when it runs low. */
export function makeShoe(decks: number) {
  let cards: PCard[] = []
  let n = 0
  const fill = () => {
    cards = []
    for (let d = 0; d < decks; d++) for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) cards.push({ rank: r, suit: s as PCard['suit'], id: '' })
    for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]] }
  }
  fill()
  return {
    draw(): PCard { const c = cards.pop()!; sfx('card'); return { ...c, id: `s${++n}` } },
    /** Call between rounds: reshuffles when fewer than `min` cards remain. Returns true if it reshuffled. */
    check(min: number) { if (cards.length < min) { fill(); return true } return false },
    get left() { return cards.length },
  }
}

/* ------------------------------------------------------------------ chips and bet spots */

export const CHIPS = [1, 5, 10, 25, 100, 500]
export function Chip({ v, small }: { v: number; small?: boolean }) {
  const c = v >= 500 ? '#7a5f14' : v >= 100 ? '#15171c' : v >= 25 ? '#1f8a5b' : v >= 10 ? '#2f5ea8' : v >= 5 ? '#9e2129' : '#6b7280'
  return (
    <span className={cn('grid place-items-center rounded-full border-2 border-dashed border-white/70 font-mono font-bold text-white shadow-md', small ? 'h-6 w-6 text-[8px]' : 'h-9 w-9 text-[10px]')} style={{ background: c, boxShadow: '0 0 0 2px ' + c }}>
      {v >= 1000 ? `${Math.round(v / 100) / 10}k` : v}
    </span>
  )
}

/** Chip-based betting state shared by the live tables. */
export function useChipBets<K extends string>() {
  const { balance } = useStore()
  const [chip, setChip] = useState(10)
  const [bets, setBets] = useState<Partial<Record<K, number>>>({})
  const [hist, setHist] = useState<K[]>([])
  const last = useRef<Partial<Record<K, number>> | null>(null)
  const total = (Object.values(bets) as number[]).reduce((s, v) => s + (v || 0), 0)
  return {
    chip, setChip, bets, total,
    add(k: K) { if (total + chip > balance) return; sfx('click'); setBets((b) => ({ ...b, [k]: (b[k] ?? 0) + chip })); setHist((h) => [...h, k]) },
    undo() { const k = hist[hist.length - 1]; if (!k) return; setHist((h) => h.slice(0, -1)); setBets((b) => { const nb = { ...b }; const v = (nb[k] ?? 0) - chip; if (v > 0) nb[k] = v; else delete nb[k]; return nb }) },
    clear() { setBets({}); setHist([]) },
    commit() { last.current = bets },
    rebet() { if (last.current) { setBets(last.current); setHist([]) } },
    canUndo: hist.length > 0, canRebet: !!last.current,
  }
}

export function BetSpot({ label, pays, amount, onClick, disabled, result, className }: { label: ReactNode; pays: string; amount?: number; onClick: () => void; disabled?: boolean; result?: 'win' | 'push' | 'lose'; className?: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn('relative flex min-h-[64px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-2 py-2 text-center transition-colors disabled:cursor-default',
        result === 'win' ? 'border-gold bg-gold/15' : result === 'push' ? 'border-white/30 bg-white/5' : 'border-white/15 bg-black/20 hover:border-gold/50 hover:bg-black/30', className)}>
      <span className="text-sm font-bold text-snow">{label}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold/80">{pays}</span>
      {!!amount && <motion.span initial={{ scale: 0.4, y: -10 }} animate={{ scale: 1, y: 0 }} className="absolute -top-2.5 -right-2"><Chip v={amount} small /></motion.span>}
    </button>
  )
}

export interface ChipCtl { chip: number; setChip: (v: number) => void; total: number; undo: () => void; clear: () => void; rebet: () => void; canUndo: boolean; canRebet: boolean }
export function ChipPanel({ chips, locked, maxWin }: { chips: ChipCtl; locked: boolean; maxWin?: number }) {
  return (
    <>
      <div>
        <div className="mb-2 text-xs font-medium text-silver">Chip value</div>
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((v) => (
            <button key={v} onClick={() => chips.setChip(v)} disabled={locked} aria-label={`${v} VC chip`} className={cn('rounded-full p-0.5 transition-transform', chips.chip === v ? 'ring-2 ring-gold scale-110' : 'opacity-80 hover:opacity-100')}><Chip v={v} /></button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Total demo bet" value={fmt(chips.total)} suffix="VC" />
        <Stat label="Max possible payout" value={fmt(maxWin ?? 0)} suffix="VC" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="dark" size="sm" onClick={chips.undo} disabled={locked || !chips.canUndo}><Undo2 className="h-3.5 w-3.5" />Undo</Button>
        <Button variant="dark" size="sm" onClick={chips.clear} disabled={locked || !chips.total}>Clear</Button>
        <Button variant="dark" size="sm" onClick={chips.rebet} disabled={locked || !chips.canRebet || chips.total > 0}><RotateCcw className="h-3.5 w-3.5" />Rebet</Button>
      </div>
    </>
  )
}

/** Small "bead road" style results history. */
export function Road({ items }: { items: { id: string; label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, 24).map((it, i) => (
        <span key={it.id} className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: it.color, opacity: i ? 0.8 : 1 }}>{it.label}</span>
      ))}
    </div>
  )
}

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
