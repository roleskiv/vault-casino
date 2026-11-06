import { ArrowDown, ArrowUp, Equal, SkipForward } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui'
import type { Game } from '../data/games'
import { cn, fmt, uid } from '../lib/format'
import { useStore } from '../store'
import { drawCard, PlayingCard, RANKS, type PCard } from './cards'
import { GameShell, RecentStrip, ResultBanner, Stat, WagerInput } from './shared'

type Guess = 'hi' | 'lo' | 'same' | 'higher' | 'lower'
/** Options for a rank, with probability of success. Ace and King swap the "or same" bet for strict + same. */
export function hiloOptions(r: number): { g: Guess; label: string; p: number }[] {
  if (r === 1) return [{ g: 'higher', label: 'Higher', p: 12 / 13 }, { g: 'same', label: 'Same', p: 1 / 13 }]
  if (r === 13) return [{ g: 'lower', label: 'Lower', p: 12 / 13 }, { g: 'same', label: 'Same', p: 1 / 13 }]
  return [{ g: 'hi', label: 'Higher or same', p: (14 - r) / 13 }, { g: 'lo', label: 'Lower or same', p: r / 13 }]
}
const wins = (g: Guess, a: number, b: number) => (g === 'hi' ? b >= a : g === 'lo' ? b <= a : g === 'higher' ? b > a : g === 'lower' ? b < a : b === a)

export default function HiLo({ game }: { game: Game }) {
  const { placeBet, settle } = useStore()
  const [wager, setWager] = useState(10)
  const [card, setCard] = useState<PCard>(drawCard)
  const [trail, setTrail] = useState<{ c: PCard; g?: Guess }[]>([])
  const [active, setActive] = useState(false)
  const [mult, setMult] = useState(1)
  const [res, setRes] = useState<{ win: boolean; m: number } | null>(null)
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>([])
  const [skips, setSkips] = useState(0)

  const opts = hiloOptions(card.rank)

  const start = () => {
    if (!placeBet(wager)) return
    setActive(true); setMult(1); setRes(null); setTrail([{ c: card }]); setSkips(0)
  }
  const finish = (win: boolean, m: number) => {
    setActive(false)
    settle(game.id, game.name, wager, win ? m : 0)
    setRes({ win, m: win ? m : 0 })
    setRecent((x) => [{ id: uid(), m: win ? m : 0, win }, ...x])
    setTimeout(() => setRes(null), 1600)
  }
  const guess = (g: Guess, p: number) => {
    const next = drawCard()
    const ok = wins(g, card.rank, next.rank)
    setTrail((t) => [...t, { c: next, g }])
    setCard(next)
    if (!ok) { setTimeout(() => finish(false, 0), 250); return }
    setMult((m) => +(m * 0.99 / p).toFixed(4))
  }
  const skip = () => {
    const next = drawCard()
    setCard(next); setSkips((s) => s + 1)
    if (active) setTrail((t) => [...t, { c: next }])
  }

  return (
    <GameShell
      game={game}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="relative flex min-h-[360px] sm:min-h-[420px] flex-col items-center justify-center gap-8">
          <div className="flex items-center gap-6 sm:gap-10">
            <div className="hidden sm:flex flex-col items-center gap-2 text-xs text-silver">
              <span className="grid h-10 w-10 place-items-center rounded-lg border border-steel bg-ink num font-semibold text-snow">K</span>King is highest
            </div>
            <PlayingCard key={card.id} card={card} size="lg" />
            <div className="hidden sm:flex flex-col items-center gap-2 text-xs text-silver">
              <span className="grid h-10 w-10 place-items-center rounded-lg border border-steel bg-ink num font-semibold text-snow">A</span>Ace is lowest
            </div>
          </div>
          <div className="w-full overflow-x-auto no-scrollbar">
            <div className="mx-auto flex w-max gap-2 px-1">
              {trail.length === 0 && <span className="text-xs text-silver">Your card history for the round appears here.</span>}
              {trail.map((t, i) => (
                <div key={t.c.id} className="flex flex-col items-center gap-1">
                  <PlayingCard card={t.c} size="sm" dim={i < trail.length - 1} />
                  <span className="text-[10px] text-silver h-3">{t.g ? (t.g === 'hi' || t.g === 'higher' ? '↑' : t.g === 'same' ? '=' : '↓') : i === 0 ? 'start' : 'skip'}</span>
                </div>
              ))}
            </div>
          </div>
          <ResultBanner show={!!res} win={!!res?.win} multiplier={res?.m ?? 0} payout={(res?.m ?? 0) * wager} />
        </div>
      }
      panel={
        <>
          <WagerInput value={wager} onChange={setWager} disabled={active} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Current multiplier" value={`${mult.toFixed(2)}×`} tone={active && mult > 1 ? 'gold' : undefined} />
            <Stat label="Cash-out value" value={fmt(active ? wager * mult : 0)} suffix="VC" />
          </div>
          <div className="space-y-2">
            {opts.map((o) => (
              <button key={o.g} disabled={!active} onClick={() => guess(o.g, o.p)}
                className="flex w-full items-center gap-3 rounded-lg border border-steel bg-ink px-3 h-12 text-left transition-colors hover:border-gold/50 disabled:opacity-45 disabled:hover:border-steel">
                <span className={cn('grid h-7 w-7 place-items-center rounded-md', o.g === 'same' ? 'bg-white/5 text-snow' : o.g === 'hi' || o.g === 'higher' ? 'bg-emerald/10 text-emerald' : 'bg-ruby/10 text-ruby')}>
                  {o.g === 'same' ? <Equal className="h-4 w-4" /> : o.g === 'hi' || o.g === 'higher' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </span>
                <span className="flex-1 text-sm font-semibold">{o.label}</span>
                <span className="text-right"><span className="num block text-sm">{(0.99 / o.p).toFixed(2)}×</span><span className="num block text-[10px] text-silver">{(o.p * 100).toFixed(1)}%</span></span>
              </button>
            ))}
          </div>
          {active ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Button variant="gold" size="lg" onClick={() => finish(true, mult)} disabled={mult <= 1}>Cash out <span className="num">{fmt(wager * mult)}</span></Button>
              <Button variant="dark" size="lg" onClick={skip} aria-label="Skip card"><SkipForward className="h-4 w-4" /></Button>
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Button variant="gold" size="lg" onClick={start}>Start round</Button>
              <Button variant="dark" size="lg" onClick={skip} aria-label="Skip card"><SkipForward className="h-4 w-4" /></Button>
            </div>
          )}
          <p className="text-[11px] text-silver leading-relaxed">Current card: <span className="text-snow">{RANKS[card.rank]}</span>{skips > 0 && <> · skipped {skips}</>}. Skipping is free and does not change your multiplier.</p>
        </>
      }
      info={{
        howTo: ['Set a demo wager and press Start round. Skip the first card if you would like a different one.', 'Guess whether the next card will be higher or lower. Each correct guess multiplies your total.', 'A wrong guess ends the round with no payout. Cash out at any time after your first correct guess.', 'Ace is low and King is high. Suits do not matter.'],
        fairness: 'Each card is drawn independently from 13 equally likely ranks (an infinite deck). Each guess pays 0.99 ÷ its probability, so every step keeps a 99% RTP.',
        odds: <div className="grid grid-cols-3 gap-y-1.5 num text-xs"><span className="text-silver">Card</span><span className="text-silver text-right">Higher/same</span><span className="text-silver text-right">Lower/same</span>{[2, 4, 7, 10, 12].map((r) => [<span key={r + 'a'}>{RANKS[r]}</span>, <span key={r + 'b'} className="text-right text-snow">{(0.99 * 13 / (14 - r)).toFixed(2)}×</span>, <span key={r + 'c'} className="text-right text-snow">{(0.99 * 13 / r).toFixed(2)}×</span>])}</div>,
      }}
    />
  )
}
