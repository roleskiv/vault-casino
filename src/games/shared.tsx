import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Info, ShieldCheck, Maximize2, BookOpen, History, Scale } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ActivityTable } from '../components/Activity'
import { Segmented, DemoPill } from '../components/ui'
import { SoundButton } from '../components/Polish'
import type { Game } from '../data/games'
import { cn, fmt } from '../lib/format'
import { useStore } from '../store'

export function WagerInput({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const { balance } = useStore()
  const [text, setText] = useState(String(value))
  const set = (v: number) => { const n = Math.max(0, +v.toFixed(2)); onChange(n); setText(String(n)) }
  return (
    <div>
      <div className="flex justify-between mb-1.5"><span className="text-xs font-medium text-silver">Demo wager</span><span className="text-xs text-silver num">{fmt(balance)} VC</span></div>
      <div className={cn('flex h-11 items-center rounded-lg border border-steel bg-ink focus-within:border-gold/60 transition-colors', disabled && 'opacity-50')}>
        <span className="pl-3 pr-1 text-[11px] font-bold text-gold">VC</span>
        <input
          inputMode="decimal" disabled={disabled} value={text}
          onChange={(e) => { setText(e.target.value); const n = parseFloat(e.target.value); onChange(Number.isFinite(n) ? n : 0) }}
          onBlur={() => setText(String(value))}
          className="num min-w-0 flex-1 bg-transparent px-1 text-sm outline-none" aria-label="Demo wager amount"
        />
        {[['½', () => set(value / 2)], ['2×', () => set(value * 2)], ['Max', () => set(Math.floor(balance * 100) / 100)]].map(([l, f]) => (
          <button key={l as string} disabled={disabled} onClick={f as () => void} className="h-8 mr-1 px-2.5 rounded-md bg-graphite text-xs font-semibold text-silver hover:text-snow hover:bg-[#262c36] disabled:pointer-events-none">{l as string}</button>
        ))}
      </div>
    </div>
  )
}

export function PayoutRow({ multiplier, wager, label = 'Payout on win' }: { multiplier: number; wager: number; label?: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Stat label="Multiplier" value={`${multiplier.toFixed(4).replace(/0{1,2}$/, '')}×`} />
      <Stat label={label} value={`${fmt(wager * multiplier)}`} suffix="VC" />
    </div>
  )
}

export function Stat({ label, value, suffix, tone }: { label: string; value: ReactNode; suffix?: string; tone?: 'gold' | 'win' }) {
  return (
    <div className="rounded-lg border border-steel bg-ink px-3 py-2">
      <div className="text-[11px] text-silver">{label}</div>
      <div className={cn('num text-sm font-semibold truncate', tone === 'gold' && 'text-gold-bright', tone === 'win' && 'text-emerald')}>{value}{suffix && <span className="ml-1 text-[10px] text-gold font-sans font-bold">{suffix}</span>}</div>
    </div>
  )
}

export type Mode = 'manual' | 'auto'
export function ModeTabs({ mode, setMode, disabled }: { mode: Mode; setMode: (m: Mode) => void; disabled?: boolean }) {
  return <Segmented value={mode} onChange={setMode} disabled={disabled} options={[{ value: 'manual', label: 'Manual' }, { value: 'auto', label: 'Auto (demo)' }]} />
}

export function AutoRounds({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-silver">Number of rounds</div>
      <div className="grid grid-cols-4 gap-1.5">
        {[5, 10, 25, 50].map((n) => (
          <button key={n} disabled={disabled} onClick={() => onChange(n)} className={cn('h-9 rounded-lg border text-xs font-semibold num transition-colors disabled:opacity-50', value === n ? 'border-gold/60 bg-gold/10 text-gold-bright' : 'border-steel bg-ink text-silver hover:text-snow')}>{n}</button>
        ))}
      </div>
    </div>
  )
}

/** Recent outcome chips shown above the stage. */
export function RecentStrip({ items }: { items: { id: string; m: number; win: boolean }[] }) {
  return (
    <div className="flex h-8 items-center gap-1.5 overflow-hidden">
      <AnimatePresence initial={false}>
        {items.slice(0, 12).map((it) => (
          <motion.span key={it.id} layout initial={{ opacity: 0, scale: 0.7, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className={cn('num shrink-0 rounded-md px-2 h-7 inline-flex items-center text-[11.5px] font-semibold border',
              it.win ? (it.m >= 10 ? 'border-gold/50 bg-gold/15 text-gold-bright' : 'border-emerald/30 bg-emerald/10 text-emerald') : 'border-steel bg-graphite text-silver')}>
            {it.m.toFixed(2)}×
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}

export interface GameInfo { howTo: string[]; fairness: string; odds: ReactNode }

export function GameShell({ game, stage, panel, info, top }: { game: Game; stage: ReactNode; panel: ReactNode; info: GameInfo; top?: ReactNode }) {
  const { favorites, toggleFavorite } = useStore()
  const fav = favorites.includes(game.id)
  const [tab, setTab] = useState<'how' | 'fair' | 'odds'>('how')
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="label text-gold-bright">{game.provider}</div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">{game.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <DemoPill />
          <button onClick={() => toggleFavorite(game.id)} aria-label="Favourite" className={cn('grid h-9 w-9 place-items-center rounded-lg border border-steel bg-coal transition-colors', fav ? 'text-gold border-gold/40' : 'text-silver hover:text-snow')}><Heart className={cn('h-4 w-4', fav && 'fill-current')} /></button>
          <SoundButton />
          <button onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})} aria-label="Fullscreen" className="hidden sm:grid h-9 w-9 place-items-center rounded-lg border border-steel bg-coal text-silver hover:text-snow"><Maximize2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-steel/70 bg-coal">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative order-1 min-w-0 border-b lg:border-b-0 lg:border-r border-steel/70 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,175,55,0.07),transparent_60%)]">
            {top && <div className="px-4 sm:px-6 pt-4">{top}</div>}
            <div className="p-4 sm:p-6">{stage}</div>
          </div>
          <div className="order-2 min-w-0 p-4 sm:p-5 space-y-4 bg-coal">{panel}</div>
        </div>
        <div className="flex items-center gap-2 border-t border-steel/70 px-4 sm:px-6 h-11 text-xs text-silver">
          <ShieldCheck className="h-3.5 w-3.5 text-gold" /> Demo mode · outcomes generated locally · RTP ≈ <span className="num text-snow">{game.rtp}%</span>
          <span className="ml-auto hidden sm:inline">Vault Credits have no cash value</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="panel p-5 sm:p-6">
          <Segmented value={tab} onChange={setTab} className="max-w-sm" options={[{ value: 'how', label: <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />How to play</span> }, { value: 'odds', label: <span className="inline-flex items-center gap-1.5"><Scale className="h-3.5 w-3.5" />Odds</span> }, { value: 'fair', label: <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Fairness</span> }]} />
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="mt-5 text-sm text-silver leading-relaxed">
              {tab === 'how' && <ol className="space-y-3">{info.howTo.map((s, i) => <li key={i} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gold/10 text-[11px] font-bold text-gold-bright">{i + 1}</span><span>{s}</span></li>)}</ol>}
              {tab === 'odds' && info.odds}
              {tab === 'fair' && (
                <div className="space-y-3">
                  <p>{info.fairness}</p>
                  <div className="flex gap-2.5 rounded-lg border border-steel bg-ink p-3 text-xs"><Info className="h-4 w-4 shrink-0 text-gold" />In this prototype, outcomes come from your browser's cryptographic random number generator. A production platform would publish a verifiable seed scheme and audit reports here.</div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <MyHistory gameId={game.id} />
      </div>
      <ActivityTable gameId={game.id} title={`${game.name} activity`} />
    </div>
  )
}

function MyHistory({ gameId }: { gameId: string }) {
  const { bets } = useStore()
  const mine = bets.filter((b) => b.gameId === gameId).slice(0, 8)
  const net = mine.reduce((s, b) => s + b.payout - b.wager, 0)
  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold"><History className="h-4 w-4 text-gold" />Your recent rounds</div>
        {mine.length > 0 && <span className={cn('num text-xs', net >= 0 ? 'text-emerald' : 'text-silver')}>Net {net >= 0 ? '+' : ''}{fmt(net)} VC</span>}
      </div>
      {mine.length === 0 ? <p className="mt-6 text-sm text-silver">No rounds yet. Your demo history appears here.</p> : (
        <div className="mt-4 divide-y divide-steel/50">
          {mine.map((b) => (
            <div key={b.id} className="flex items-center justify-between h-10 text-sm">
              <span className="text-silver text-xs">{new Date(b.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span className="num text-snow/90">{fmt(b.wager)}</span>
              <span className={cn('num', b.multiplier > 0 ? 'text-snow' : 'text-silver')}>{b.multiplier.toFixed(2)}×</span>
              <span className={cn('num w-24 text-right', b.payout > 0 ? 'text-emerald' : 'text-silver')}>{b.payout > 0 ? `+${fmt(b.payout)}` : `-${fmt(b.wager)}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ResultBanner({ show, win, multiplier, payout }: { show: boolean; win: boolean; multiplier: number; payout: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
          className={cn('pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border px-6 py-4 text-center backdrop-blur-md shadow-2xl',
            win ? 'border-gold/60 bg-ink/85' : 'border-steel bg-ink/85')}>
          <div className={cn('num font-display text-3xl font-bold', win ? 'gold-text' : 'text-silver')}>{multiplier.toFixed(2)}×</div>
          <div className="mt-1 text-xs text-silver">{win ? <>Demo payout <span className="num text-emerald">+{fmt(payout)} VC</span></> : 'No payout this round'}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
