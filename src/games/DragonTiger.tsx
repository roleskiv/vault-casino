import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Button } from '../components/ui'
import type { Game } from '../data/games'
import { cn, uid } from '../lib/format'
import { useStore } from '../store'
import { PlayingCard, RANKS, type PCard } from './cards'
import { BetSpot, ChipPanel, Felt, makeShoe, Road, useChipBets, wait } from './live'
import { GameShell, RecentStrip, ResultBanner } from './shared'

type K = 'dragon' | 'tiger' | 'tie'
/** Return multiplier (stake included). Aces are low, kings high. On a tie, Dragon and Tiger bets lose half. */
export function dtReturn(k: K, d: number, t: number) {
  if (d === t) return k === 'tie' ? 12 : 0.5
  if (k === 'tie') return 0
  return (k === 'dragon') === d > t ? 2 : 0
}

const shoe = makeShoe(8)

function Side({ who, card, won }: { who: 'dragon' | 'tiger'; card?: PCard; won: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn('mb-3 font-display text-lg sm:text-xl font-extrabold uppercase tracking-[0.18em]', who === 'dragon' ? 'text-[#ff8a5c]' : 'text-[#ffd36b]')}>{who}</div>
      <div className="relative grid h-[152px] w-[108px] sm:h-[180px] sm:w-[128px] place-items-center rounded-2xl border-2 border-dashed border-white/15">
        {card ? <PlayingCard key={card.id} card={card} size="lg" highlight={won ? 'win' : undefined} /> : <span className="text-xs text-silver/60">{who === 'dragon' ? 'D' : 'T'}</span>}
      </div>
    </div>
  )
}

export default function DragonTiger({ game }: { game: Game }) {
  const { placeBet, settle } = useStore()
  const chips = useChipBets<K>()
  const [d, setD] = useState<PCard>()
  const [t, setT] = useState<PCard>()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string>()
  const [res, setRes] = useState<{ w: 'dragon' | 'tiger' | 'tie'; m: number; payout: number } | null>(null)
  const [banner, setBanner] = useState(false)
  const [road, setRoad] = useState<{ id: string; label: string; color: string }[]>([])
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>([])

  const deal = async () => {
    const stake = chips.total
    if (!stake || !placeBet(stake)) return
    const bets = { ...chips.bets }
    chips.commit()
    setBusy(true); setRes(null); setBanner(false); setD(undefined); setT(undefined)
    if (shoe.check(20)) { setStatus('Shuffling a fresh eight-deck shoe.'); await wait(900) }
    setStatus('No more bets.')
    const dc = shoe.draw(), tc = shoe.draw()
    await wait(450); setD(dc); setStatus(`Dragon shows ${RANKS[dc.rank]}.`)
    await wait(700); setT(tc)
    await wait(450)
    const w = dc.rank === tc.rank ? 'tie' : dc.rank > tc.rank ? 'dragon' : 'tiger'
    const payout = (Object.entries(bets) as [K, number][]).reduce((s, [k, v]) => s + v * dtReturn(k, dc.rank, tc.rank), 0)
    const m = payout / stake
    settle(game.id, game.name, stake, m)
    setRes({ w, m, payout })
    setStatus(w === 'tie' ? `Tie on ${RANKS[dc.rank]}. Dragon and Tiger bets return half.` : `${w === 'dragon' ? 'Dragon' : 'Tiger'} wins with ${RANKS[w === 'dragon' ? dc.rank : tc.rank]}.`)
    setRoad((r) => [{ id: uid(), label: w === 'tie' ? '=' : w === 'dragon' ? 'D' : 'T', color: w === 'tie' ? '#1f8a5b' : w === 'dragon' ? '#c2502a' : '#b8901f' }, ...r])
    setRecent((x) => [{ id: uid(), m, win: payout > stake }, ...x])
    if (payout > stake) { setBanner(true); setTimeout(() => setBanner(false), 1500) }
    setBusy(false)
  }

  const maxWin = useMemo(() => {
    const b = chips.bets
    return Math.max((b.dragon ?? 0) * 2, (b.tiger ?? 0) * 2, (b.tie ?? 0) * 12 + ((b.dragon ?? 0) + (b.tiger ?? 0)) / 2)
  }, [chips.bets])
  const spotRes = (k: K) => (res && d && t ? (dtReturn(k, d.rank, t.rank) > 1 ? 'win' as const : undefined) : undefined)

  return (
    <GameShell
      game={game}
      liveStatus={busy || res ? status : undefined}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="relative space-y-4">
          <Felt tone="red">
            <div className="flex items-start justify-center gap-6 sm:gap-16">
              <Side who="dragon" card={d} won={res?.w === 'dragon'} />
              <div className="self-center font-display text-2xl font-extrabold text-gold/50">VS</div>
              <Side who="tiger" card={t} won={res?.w === 'tiger'} />
            </div>
            <div className="h-10 mt-3 text-center">
              <AnimatePresence>
                {res && <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn('inline-block rounded-md px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]', res.w === 'tie' ? 'bg-emerald/20 text-emerald' : 'bg-gold/15 text-gold-bright')}>{res.w === 'tie' ? 'Tie' : `${res.w} wins`}</motion.span>}
              </AnimatePresence>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <BetSpot className="border-[#c2502a]/60" label="Dragon" pays="1:1" amount={chips.bets.dragon} onClick={() => chips.add('dragon')} disabled={busy} result={spotRes('dragon')} />
              <BetSpot className="border-emerald/40" label="Tie" pays="11:1" amount={chips.bets.tie} onClick={() => chips.add('tie')} disabled={busy} result={spotRes('tie')} />
              <BetSpot className="border-[#b8901f]/60" label="Tiger" pays="1:1" amount={chips.bets.tiger} onClick={() => chips.add('tiger')} disabled={busy} result={spotRes('tiger')} />
            </div>
          </Felt>
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-silver">Results this session</div>
            {road.length ? <Road items={road} /> : <div className="text-xs text-silver/70">No rounds yet.</div>}
          </div>
          <ResultBanner show={banner} win multiplier={res?.m ?? 0} payout={res?.payout ?? 0} />
        </div>
      }
      panel={
        <>
          <ChipPanel chips={chips} locked={busy} maxWin={maxWin} />
          <Button variant="gold" size="lg" className="w-full" onClick={deal} loading={busy} disabled={!chips.total}>Deal</Button>
          <p className="text-[11px] text-silver leading-relaxed">One card each. Highest card wins; aces are low. On a tie, Dragon and Tiger bets lose half.</p>
        </>
      }
      info={{
        howTo: ['Pick a chip and bet on Dragon, Tiger or Tie.', 'Press Deal. One card goes to Dragon and one to Tiger.', 'The higher card wins. Kings are high and aces are low. Suits do not matter.', 'Dragon and Tiger pay 1:1. Tie pays 11:1. If the cards tie, Dragon and Tiger bets lose half their stake.'],
        fairness: 'Cards come from a shuffled eight-deck shoe that is reshuffled when fewer than 20 cards remain. Dragon and Tiger each return about 96.27% over the long run; Tie returns about 89.64%.',
        odds: <div className="grid grid-cols-3 gap-y-1.5 num text-xs"><span className="text-silver">Bet</span><span className="text-silver text-right">Win chance</span><span className="text-silver text-right">RTP</span>{[['Dragon', '46.27%', '96.27%'], ['Tiger', '46.27%', '96.27%'], ['Tie', '7.47%', '89.64%']].map(([a, c, r]) => [<span key={a + 1}>{a}</span>, <span key={a + 2} className="text-right text-snow">{c}</span>, <span key={a + 3} className="text-right text-snow">{r}</span>])}</div>,
      }}
    />
  )
}
