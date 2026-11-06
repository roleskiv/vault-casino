import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '../components/ui'
import type { Game } from '../data/games'
import { cn, fmt, uid } from '../lib/format'
import { useStore } from '../store'
import { drawCard, PlayingCard, type PCard } from './cards'
import { GameShell, RecentStrip, WagerInput } from './shared'

const val = (r: number) => (r === 1 ? 11 : Math.min(10, r))
export function handValue(cards: PCard[]) {
  let total = 0, aces = 0
  for (const c of cards) { total += val(c.rank); if (c.rank === 1) aces++ }
  while (total > 21 && aces) { total -= 10; aces-- }
  return { total, soft: aces > 0 }
}
const isBJ = (cards: PCard[], split: boolean) => !split && cards.length === 2 && handValue(cards).total === 21

interface Hand { cards: PCard[]; wager: number; done: boolean; doubled: boolean; result?: { m: number; label: string } }
type Phase = 'idle' | 'player' | 'dealer' | 'done'
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function resolve(h: Hand, dealer: PCard[], split: boolean): { m: number; label: string } {
  const p = handValue(h.cards).total, d = handValue(dealer).total
  const pbj = isBJ(h.cards, split), dbj = isBJ(dealer, false)
  if (p > 21) return { m: 0, label: 'Bust' }
  if (pbj && dbj) return { m: 1, label: 'Push' }
  if (pbj) return { m: 2.5, label: 'Blackjack' }
  if (dbj) return { m: 0, label: 'Dealer blackjack' }
  if (d > 21) return { m: 2, label: 'Dealer bust' }
  if (p > d) return { m: 2, label: 'Win' }
  if (p === d) return { m: 1, label: 'Push' }
  return { m: 0, label: 'Lose' }
}

export default function Blackjack({ game }: { game: Game }) {
  const { placeBet, settle } = useStore()
  const [wager, setWager] = useState(25)
  const [phase, setPhase] = useState<Phase>('idle')
  const [hands, setHands] = useState<Hand[]>([])
  const [active, setActive] = useState(0)
  const [dealer, setDealer] = useState<PCard[]>([])
  const [busy, setBusy] = useState(false)
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>([])
  const split = hands.length > 1

  const finishRound = async (hs: Hand[], d: PCard[], isSplit: boolean) => {
    setPhase('dealer'); setBusy(true)
    let dc = [...d]
    const anyLive = hs.some((h) => handValue(h.cards).total <= 21 && !isBJ(h.cards, isSplit))
    await wait(450)
    if (anyLive) {
      while (handValue(dc).total < 17) { dc = [...dc, drawCard()]; setDealer(dc); await wait(520) }
    }
    const final = hs.map((h) => ({ ...h, done: true, result: resolve(h, dc, isSplit) }))
    setHands(final)
    final.forEach((h) => settle(game.id, game.name, h.wager, h.result!.m))
    const totalW = final.reduce((s, h) => s + h.wager, 0)
    const totalP = final.reduce((s, h) => s + h.wager * h.result!.m, 0)
    setRecent((x) => [{ id: uid(), m: totalP / totalW, win: totalP > totalW }, ...x])
    setPhase('done'); setBusy(false)
  }

  const deal = async () => {
    if (!placeBet(wager)) return
    setBusy(true); setPhase('player'); setActive(0)
    const p1 = drawCard(), d1 = drawCard(), p2 = drawCard(), d2 = drawCard()
    setHands([{ cards: [p1], wager, done: false, doubled: false }]); setDealer([])
    await wait(220); setDealer([d1])
    await wait(220); setHands([{ cards: [p1, p2], wager, done: false, doubled: false }])
    await wait(220); setDealer([d1, d2])
    setBusy(false)
    const h = { cards: [p1, p2], wager, done: false, doubled: false }
    if (isBJ(h.cards, false) || isBJ([d1, d2], false)) await finishRound([h], [d1, d2], false)
  }

  const advance = async (hs: Hand[], from: number) => {
    const next = hs.findIndex((h, i) => i > from && !h.done)
    if (next >= 0) { setActive(next); return }
    await finishRound(hs, dealer, hs.length > 1)
  }

  const hit = async () => {
    const hs = hands.map((h) => ({ ...h, cards: [...h.cards] }))
    const h = hs[active]
    h.cards.push(drawCard())
    const t = handValue(h.cards).total
    if (t >= 21) h.done = true
    setHands(hs)
    if (h.done) { await wait(300); await advance(hs, active) }
  }
  const stand = async () => {
    const hs = hands.map((h, i) => (i === active ? { ...h, done: true } : h))
    setHands(hs)
    await advance(hs, active)
  }
  const double = async () => {
    if (!placeBet(hands[active].wager)) return
    const hs = hands.map((h, i) => (i === active ? { ...h, cards: [...h.cards, drawCard()], wager: h.wager * 2, doubled: true, done: true } : h))
    setHands(hs)
    await wait(350)
    await advance(hs, active)
  }
  const doSplit = async () => {
    const h = hands[0]
    if (!placeBet(h.wager)) return
    const a: Hand = { cards: [h.cards[0], drawCard()], wager: h.wager, done: false, doubled: false }
    const b: Hand = { cards: [h.cards[1], drawCard()], wager: h.wager, done: false, doubled: false }
    // split aces receive one card each
    if (h.cards[0].rank === 1) { a.done = true; b.done = true; const hs = [a, b]; setHands(hs); await wait(350); await finishRound(hs, dealer, true); return }
    setHands([a, b]); setActive(0)
  }

  const cur = hands[active]
  const canAct = phase === 'player' && !busy && cur && !cur.done
  const canDouble = canAct && cur.cards.length === 2
  const canSplit = canAct && !split && cur.cards.length === 2 && val(cur.cards[0].rank) === val(cur.cards[1].rank)
  const dealerShown = phase === 'player' ? dealer.slice(0, 1) : dealer
  const dv = handValue(dealerShown)

  return (
    <GameShell
      game={game}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="relative min-h-[420px] sm:min-h-[480px] rounded-2xl border border-[#1d3a2e] bg-[radial-gradient(ellipse_at_50%_30%,#123326,#0a1a14_70%)] p-4 sm:p-6 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-[8%] top-[46%] h-[2px] rounded-full bg-gold/20" />
          <div className="pointer-events-none absolute left-1/2 top-[48%] -translate-x-1/2 w-max max-w-[90%] text-center text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/50">Blackjack pays 3 to 2 · Dealer stands on soft 17</div>
          {/* dealer */}
          <div className="flex flex-col items-center">
            <div className="mb-2 flex items-center gap-2 text-xs text-silver">Dealer {dealer.length > 0 && <span className="num rounded-md bg-black/40 px-2 py-0.5 text-snow">{dv.total}</span>}</div>
            <div className="flex h-[110px] sm:h-[124px] -space-x-8 sm:-space-x-10">
              {dealer.map((c, i) => <PlayingCard key={c.id} card={c} hidden={phase === 'player' && i === 1} />)}
            </div>
          </div>
          {/* player */}
          <div className="mt-16 sm:mt-20 flex flex-wrap justify-center gap-6 sm:gap-10">
            {hands.length === 0 && <div className="py-10 text-sm text-silver/80">Place a demo wager and press Deal.</div>}
            {hands.map((h, hi) => {
              const v = handValue(h.cards)
              const isActive = phase === 'player' && hi === active && hands.length > 1
              return (
                <div key={hi} className={cn('flex flex-col items-center rounded-xl p-2 transition-colors', isActive && 'bg-gold/[0.07] ring-1 ring-gold/40')}>
                  <div className="flex h-[110px] sm:h-[124px] -space-x-8 sm:-space-x-10">
                    {h.cards.map((c) => <PlayingCard key={c.id} card={c} highlight={h.result ? (h.result.m > 1 ? 'win' : h.result.m === 0 ? 'lose' : undefined) : undefined} />)}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="num rounded-md bg-black/40 px-2 py-0.5 text-snow">{v.soft && v.total < 21 ? `${v.total - 10}/${v.total}` : v.total}</span>
                    <span className="num text-silver">{fmt(h.wager)} VC{h.doubled ? ' · doubled' : ''}</span>
                  </div>
                  <AnimatePresence>
                    {h.result && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn('mt-2 rounded-md px-2.5 py-1 text-xs font-semibold', h.result.m > 1 ? 'bg-gold text-ink' : h.result.m === 1 ? 'bg-white/10 text-snow' : 'bg-ruby/20 text-ruby')}>
                        {h.result.label}{h.result.m > 0 && <span className="num ml-1">+{fmt(h.wager * h.result.m)}</span>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      }
      panel={
        <>
          <WagerInput value={wager} onChange={setWager} disabled={phase === 'player' || phase === 'dealer'} />
          {phase === 'player' || phase === 'dealer' ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="gold" size="lg" onClick={hit} disabled={!canAct}>Hit</Button>
              <Button variant="dark" size="lg" onClick={stand} disabled={!canAct}>Stand</Button>
              <Button variant="dark" onClick={double} disabled={!canDouble}>Double</Button>
              <Button variant="dark" onClick={doSplit} disabled={!canSplit}>Split</Button>
            </div>
          ) : (
            <Button variant="gold" size="lg" className="w-full" onClick={deal} loading={busy}>{phase === 'done' ? 'Deal again' : 'Deal'}</Button>
          )}
          <div className="rounded-lg border border-steel bg-ink p-3 text-xs text-silver space-y-1.5">
            <div className="flex justify-between"><span>Blackjack</span><span className="num text-snow">3 : 2</span></div>
            <div className="flex justify-between"><span>Win</span><span className="num text-snow">1 : 1</span></div>
            <div className="flex justify-between"><span>Push</span><span className="text-snow">Wager returned</span></div>
          </div>
          <p className="text-[11px] text-silver leading-relaxed">{phase === 'player' ? (split ? `Playing hand ${active + 1} of 2.` : 'Hit to take a card, Stand to hold. Double or split on your first two cards.') : phase === 'dealer' ? 'Dealer is drawing…' : 'Infinite-deck demo blackjack.'}</p>
        </>
      }
      info={{
        howTo: ['Set a demo wager and press Deal. You and the dealer each get two cards; one dealer card stays face down.', 'Hit to take another card or Stand to hold. Get closer to 21 than the dealer without going over.', 'Double doubles your wager for exactly one more card. Split turns a pair into two hands (once per round; split aces get one card each).', 'The dealer draws to 17 and stands on soft 17. Blackjack pays 3 to 2.'],
        fairness: 'Cards are drawn independently from an infinite deck, so card counting has no effect. With basic strategy, these rules give a long-run RTP of roughly 99.5%.',
        odds: <div className="space-y-1.5 text-xs"><div className="flex justify-between"><span className="text-silver">Chance of a natural blackjack</span><span className="num text-snow">≈ 4.73%</span></div><div className="flex justify-between"><span className="text-silver">Dealer bust rate (stand on 17)</span><span className="num text-snow">≈ 28%</span></div><div className="flex justify-between"><span className="text-silver">Ace counts as</span><span className="text-snow">1 or 11</span></div></div>,
      }}
    />
  )
}
