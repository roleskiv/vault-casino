import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Button } from '../components/ui'
import type { Game } from '../data/games'
import { cn, uid } from '../lib/format'
import { useStore } from '../store'
import { PlayingCard, type PCard } from './cards'
import { BetSpot, ChipPanel, Felt, makeShoe, Road, useChipBets, wait } from './live'
import { GameShell, RecentStrip, ResultBanner } from './shared'

type K = 'player' | 'banker' | 'tie' | 'ppair' | 'bpair'
const PAYS: Record<K, number> = { player: 2, banker: 1.95, tie: 9, ppair: 12, bpair: 12 } // stake included
const pv = (c: PCard) => (c.rank >= 10 ? 0 : c.rank)
export const bTotal = (cs: PCard[]) => cs.reduce((s, c) => s + pv(c), 0) % 10

/** Standard punto banco drawing rules. Returns the final hands. */
export function playCoup(draw: () => PCard) {
  const p = [draw(), draw()], b = [draw(), draw()]
  // dealt P B P B in reality; order does not change outcome
  const pt = bTotal(p), bt = bTotal(b)
  if (pt >= 8 || bt >= 8) return { p, b }
  let third: number | null = null
  if (pt <= 5) { const c = draw(); p.push(c); third = pv(c) }
  const b2 = bTotal(b)
  const bankerDraws = third === null ? b2 <= 5
    : b2 <= 2 ? true
    : b2 === 3 ? third !== 8
    : b2 === 4 ? third >= 2 && third <= 7
    : b2 === 5 ? third >= 4 && third <= 7
    : b2 === 6 ? third === 6 || third === 7
    : false
  if (bankerDraws) b.push(draw())
  return { p, b }
}

export function coupReturn(k: K, p: PCard[], b: PCard[]) {
  const pt = bTotal(p), bt = bTotal(b)
  const winner = pt > bt ? 'player' : bt > pt ? 'banker' : 'tie'
  if (k === 'ppair') return p[0].rank === p[1].rank ? PAYS.ppair : 0
  if (k === 'bpair') return b[0].rank === b[1].rank ? PAYS.bpair : 0
  if (k === 'tie') return winner === 'tie' ? PAYS.tie : 0
  if (winner === 'tie') return 1 // player and banker bets push on a tie
  return winner === k ? PAYS[k] : 0
}

const shoe = makeShoe(8)

function Hand({ who, cards, won }: { who: 'player' | 'banker'; cards: PCard[]; won: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn('mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]', who === 'player' ? 'text-[#7fa6e6]' : 'text-[#e07a80]')}>
        {who}{cards.length > 0 && <span className="num rounded-md bg-black/40 px-2 py-0.5 text-snow normal-case tracking-normal">{bTotal(cards)}</span>}
      </div>
      <div className="flex h-[104px] sm:h-[124px] -space-x-8 sm:-space-x-10">
        {cards.map((c, i) => <div key={c.id} className={i === 2 ? 'rotate-90 translate-y-3' : ''}><PlayingCard card={c} highlight={won ? 'win' : undefined} /></div>)}
      </div>
    </div>
  )
}


export default function Baccarat({ game }: { game: Game }) {
  const { placeBet, settle } = useStore()
  const chips = useChipBets<K>()
  const [p, setP] = useState<PCard[]>([])
  const [b, setB] = useState<PCard[]>([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string>()
  const [res, setRes] = useState<{ winner: 'player' | 'banker' | 'tie'; m: number; payout: number } | null>(null)
  const [banner, setBanner] = useState(false)
  const [road, setRoad] = useState<{ id: string; label: string; color: string }[]>([])
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>([])

  const deal = async () => {
    const stake = chips.total
    if (!stake || !placeBet(stake)) return
    const bets = { ...chips.bets }
    chips.commit()
    setBusy(true); setRes(null); setBanner(false); setP([]); setB([])
    if (shoe.check(30)) { setStatus('Shuffling a fresh eight-deck shoe.'); await wait(900) }
    setStatus('No more bets.')
    const coup = playCoup(() => shoe.draw())
    // reveal in dealing order
    await wait(350); setP([coup.p[0]]); await wait(320); setB([coup.b[0]])
    await wait(320); setP(coup.p.slice(0, 2)); await wait(320); setB(coup.b.slice(0, 2))
    if (coup.p[2]) { await wait(600); setStatus('Player draws a third card.'); setP(coup.p) }
    if (coup.b[2]) { await wait(600); setStatus('Banker draws a third card.'); setB(coup.b) }
    await wait(500)
    const pt = bTotal(coup.p), bt = bTotal(coup.b)
    const winner = pt > bt ? 'player' : bt > pt ? 'banker' : 'tie'
    const payout = (Object.entries(bets) as [K, number][]).reduce((s, [k, v]) => s + v * coupReturn(k, coup.p, coup.b), 0)
    const m = payout / stake
    settle(game.id, game.name, stake, m)
    setRes({ winner, m, payout })
    setStatus(winner === 'tie' ? `Tie at ${pt}.` : `${winner === 'player' ? 'Player' : 'Banker'} wins, ${Math.max(pt, bt)} over ${Math.min(pt, bt)}.`)
    setRoad((r) => [{ id: uid(), label: winner === 'tie' ? 'T' : winner === 'player' ? 'P' : 'B', color: winner === 'tie' ? '#1f8a5b' : winner === 'player' ? '#2f5ea8' : '#9e2129' }, ...r])
    setRecent((x) => [{ id: uid(), m, win: payout > stake }, ...x])
    if (payout > stake) { setBanner(true); setTimeout(() => setBanner(false), 1500) }
    setBusy(false)
  }

  const maxWin = useMemo(() => {
    const b = chips.bets
    const pairs = (b.ppair ?? 0) * 12 + (b.bpair ?? 0) * 12
    return Math.max((b.player ?? 0) * 2, (b.banker ?? 0) * 1.95, (b.tie ?? 0) * 9 + (b.player ?? 0) + (b.banker ?? 0)) + pairs
  }, [chips.bets])

  const spotRes = (k: K): 'win' | 'push' | 'lose' | undefined => {
    if (!res || !p.length) return undefined
    const r = coupReturn(k, p, b)
    return r > 1 ? 'win' : r === 1 ? 'push' : undefined
  }


  return (
    <GameShell
      game={game}
      liveStatus={busy || res ? status : undefined}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="relative space-y-4">
          <Felt tone="noir">
            <div className="grid grid-cols-2 gap-4 min-h-[150px] sm:min-h-[170px]">
              <Hand who="player" cards={p} won={res?.winner === 'player'} />
              <Hand who="banker" cards={b} won={res?.winner === 'banker'} />
            </div>
            {!p.length && <div className="absolute inset-x-0 top-[38%] text-center text-sm text-silver/80">Place chips on Player, Banker or Tie, then Deal.</div>}
            <AnimatePresence>
              {res && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-4 text-center">
                  <span className={cn('inline-block rounded-md px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]', res.winner === 'tie' ? 'bg-emerald/20 text-emerald' : res.winner === 'player' ? 'bg-[#2f5ea8]/30 text-[#9fc0f5]' : 'bg-ruby/20 text-[#f0a0a4]')}>{res.winner === 'tie' ? 'Tie' : `${res.winner} wins`}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-[1fr_1.4fr_1.4fr_1.4fr_1fr] gap-2 sm:gap-3">
              <BetSpot className="order-4 sm:order-none" label="P Pair" pays="11:1" amount={chips.bets.ppair} onClick={() => chips.add('ppair')} disabled={busy} result={spotRes('ppair')} />
              <BetSpot className="order-1 sm:order-none border-[#2f5ea8]/50" label="Player" pays="1:1" amount={chips.bets.player} onClick={() => chips.add('player')} disabled={busy} result={spotRes('player')} />
              <BetSpot className="order-3 col-span-2 sm:col-span-1 sm:order-none border-emerald/40" label="Tie" pays="8:1" amount={chips.bets.tie} onClick={() => chips.add('tie')} disabled={busy} result={spotRes('tie')} />
              <BetSpot className="order-2 sm:order-none border-ruby/50" label="Banker" pays="0.95:1" amount={chips.bets.banker} onClick={() => chips.add('banker')} disabled={busy} result={spotRes('banker')} />
              <BetSpot className="order-5 sm:order-none" label="B Pair" pays="11:1" amount={chips.bets.bpair} onClick={() => chips.add('bpair')} disabled={busy} result={spotRes('bpair')} />
            </div>
          </Felt>
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-silver">Results this session</div>
            {road.length ? <Road items={road} /> : <div className="text-xs text-silver/70">No coups yet.</div>}
          </div>
          <ResultBanner show={banner} win multiplier={res?.m ?? 0} payout={res?.payout ?? 0} />
        </div>
      }
      panel={
        <>
          <ChipPanel chips={chips} locked={busy} maxWin={maxWin} />
          <Button variant="gold" size="lg" className="w-full" onClick={deal} loading={busy} disabled={!chips.total}>Deal</Button>
          <p className="text-[11px] text-silver leading-relaxed">Eight-deck shoe, standard third-card rules. Banker wins pay 0.95 to 1. Player and Banker bets push on a tie.</p>
        </>
      }
      info={{
        howTo: ['Pick a chip and tap Player, Banker or Tie. Pair bets are optional side bets on the first two cards.', 'Press Deal. Two cards go to Player and two to Banker; a third card may follow by fixed rules.', 'The hand closest to 9 wins. Tens and face cards count 0, aces count 1, and only the last digit of the total counts.', 'Player pays 1:1, Banker pays 0.95:1, Tie pays 8:1. Player and Banker bets are returned on a tie.'],
        fairness: 'Cards come from a shuffled eight-deck shoe that is reshuffled when fewer than 30 cards remain. Long-run RTP is about 98.94% on Banker, 98.76% on Player, 85.64% on Tie and about 89% on each pair bet.',
        odds: <div className="grid grid-cols-3 gap-y-1.5 num text-xs"><span className="text-silver">Bet</span><span className="text-silver text-right">Chance</span><span className="text-silver text-right">RTP</span>{[['Banker', '45.86%', '98.94%'], ['Player', '44.62%', '98.76%'], ['Tie', '9.52%', '85.64%'], ['Pair', '7.47%', '≈ 89%']].map(([a, c, r]) => [<span key={a + 1}>{a}</span>, <span key={a + 2} className="text-right text-snow">{c}</span>, <span key={a + 3} className="text-right text-snow">{r}</span>])}</div>,
      }}
    />
  )
}
