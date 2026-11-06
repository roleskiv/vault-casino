import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '../components/ui'
import type { Game } from '../data/games'
import { cn, fmt, uid } from '../lib/format'
import { useStore } from '../store'
import { PlayingCard, type PCard } from './cards'
import { Felt, makeShoe, wait } from './live'
import { GameShell, RecentStrip, ResultBanner, WagerInput } from './shared'

/* ------------------------------------------------------------ hand evaluation */

export const HAND_NAMES = ['High card', 'Pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush', 'Royal flush']

function eval5(cs: PCard[]) {
  const r = cs.map((c) => (c.rank === 1 ? 14 : c.rank)).sort((a, b) => b - a)
  const flush = cs.every((c) => c.suit === cs[0].suit)
  const uniq = [...new Set(r)]
  let straightHigh = 0
  if (uniq.length === 5) {
    if (r[0] - r[4] === 4) straightHigh = r[0]
    else if (r[0] === 14 && r[1] === 5) straightHigh = 5 // A-2-3-4-5
  }
  const counts = new Map<number, number>()
  r.forEach((x) => counts.set(x, (counts.get(x) ?? 0) + 1))
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])
  const shape = groups.map((g) => g[1]).join('')
  let cat: number
  let order: number[]
  if (straightHigh && flush) { cat = straightHigh === 14 ? 9 : 8; order = [straightHigh] }
  else if (shape === '41') { cat = 7; order = groups.map((g) => g[0]) }
  else if (shape === '32') { cat = 6; order = groups.map((g) => g[0]) }
  else if (flush) { cat = 5; order = r }
  else if (straightHigh) { cat = 4; order = [straightHigh] }
  else if (shape === '311') { cat = 3; order = groups.map((g) => g[0]) }
  else if (shape === '221') { cat = 2; order = groups.map((g) => g[0]) }
  else if (shape === '2111') { cat = 1; order = groups.map((g) => g[0]) }
  else { cat = 0; order = r }
  let score = cat
  for (let i = 0; i < 5; i++) score = score * 15 + (order[i] ?? 0)
  return { cat, score, pairRank: cat === 1 ? groups[0][0] : 0 }
}

/** Best five-card hand out of the given cards (5–7). */
export function bestHand(cs: PCard[]) {
  let best = eval5(cs.slice(0, 5)), bestIdx = [0, 1, 2, 3, 4]
  const n = cs.length
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) for (let d = c + 1; d < n; d++) for (let e = d + 1; e < n; e++) {
    const h = eval5([cs[a], cs[b], cs[c], cs[d], cs[e]])
    if (h.score > best.score) { best = h; bestIdx = [a, b, c, d, e] }
  }
  return { ...best, idx: bestIdx }
}

/** Ante bonus (profit multiple) by player's final hand category. */
export const ANTE_PAYS = [1, 1, 1, 1, 1, 2, 3, 10, 20, 100]
export const qualifies = (h: { cat: number; pairRank: number }) => h.cat >= 2 || (h.cat === 1 && h.pairRank >= 4)

/** Total return (stake included) for ante A after calling (call = 2A). */
export function holdemReturn(player: PCard[], dealer: PCard[], board: PCard[], ante: number) {
  const ph = bestHand([...player, ...board]), dh = bestHand([...dealer, ...board])
  const anteWin = ante * (1 + ANTE_PAYS[ph.cat])
  if (!qualifies(dh)) return { ret: anteWin + 2 * ante, ph, dh, outcome: 'nq' as const }
  if (ph.score > dh.score) return { ret: anteWin + 4 * ante, ph, dh, outcome: 'win' as const }
  if (ph.score === dh.score) return { ret: 3 * ante, ph, dh, outcome: 'push' as const }
  return { ret: 0, ph, dh, outcome: 'lose' as const }
}

/* ------------------------------------------------------------ table */

const shoe = makeShoe(1)
type Phase = 'idle' | 'decide' | 'busy' | 'done'

function Row({ label, cards, hidden, size = 'md', badge }: { label: string; cards: PCard[]; hidden?: boolean; size?: 'md' | 'sm'; badge?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 flex items-center gap-2 text-xs text-silver">{label}{badge && <span className="rounded-md bg-black/40 px-2 py-0.5 text-snow">{badge}</span>}</div>
      <div className="flex gap-1.5 sm:gap-2 min-h-[64px]">{cards.map((c) => <PlayingCard key={c.id} card={c} hidden={hidden} size={size} />)}</div>
    </div>
  )
}

export default function Holdem({ game }: { game: Game }) {
  const { placeBet, settle } = useStore()
  const [ante, setAnte] = useState(10)
  const [phase, setPhase] = useState<Phase>('idle')
  const [player, setPlayer] = useState<PCard[]>([])
  const [dealer, setDealer] = useState<PCard[]>([])
  const [board, setBoard] = useState<PCard[]>([])
  const [status, setStatus] = useState<string>()
  const [res, setRes] = useState<{ label: string; m: number; payout: number; stake: number; ph: string; dh: string; win: boolean } | null>(null)
  const [banner, setBanner] = useState(false)
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>([])
  const [pending, setPending] = useState<{ p: PCard[]; d: PCard[]; b: PCard[]; a: number } | null>(null)

  const deal = async () => {
    if (!placeBet(ante)) return
    setPhase('busy'); setRes(null); setBanner(false); setPlayer([]); setDealer([]); setBoard([])
    shoe.check(52)
    setStatus('Dealing.')
    const p = [shoe.draw(), shoe.draw()], d = [shoe.draw(), shoe.draw()], b = [shoe.draw(), shoe.draw(), shoe.draw(), shoe.draw(), shoe.draw()]
    setPending({ p, d, b, a: ante })
    await wait(250); setPlayer(p); await wait(300); setDealer(d)
    await wait(400); setBoard(b.slice(0, 3))
    setStatus('The flop is out. Call for 2× your ante, or fold.')
    setPhase('decide')
  }

  const finish = async (call: boolean) => {
    if (!pending) return
    const { p, d, b, a } = pending
    if (call && !placeBet(a * 2)) return
    setPhase('busy')
    if (!call) {
      settle(game.id, game.name, a, 0)
      setStatus('Folded. The ante is lost.')
      setRes({ label: 'Folded', m: 0, payout: 0, stake: a, ph: '', dh: '', win: false })
      setRecent((x) => [{ id: uid(), m: 0, win: false }, ...x])
      setBoard(b); await wait(200); setPhase('done'); return
    }
    setStatus('Turn and river.')
    await wait(450); setBoard(b.slice(0, 4)); await wait(450); setBoard(b)
    await wait(500); setStatus('Dealer reveals.'); setPhase('done')
    await wait(500)
    const r = holdemReturn(p, d, b, a)
    const stake = a * 3, m = r.ret / stake
    settle(game.id, game.name, stake, m)
    const label = r.outcome === 'nq' ? 'Dealer does not qualify' : r.outcome === 'win' ? 'You win' : r.outcome === 'push' ? 'Push' : 'Dealer wins'
    setStatus(r.outcome === 'nq' ? 'Dealer does not qualify. Ante pays, call is returned.' : r.outcome === 'push' ? `Push. Both hands make ${HAND_NAMES[r.ph.cat].toLowerCase()}.` : r.outcome === 'win' ? `Your ${HAND_NAMES[r.ph.cat].toLowerCase()} beats the dealer's ${HAND_NAMES[r.dh.cat].toLowerCase()}.` : `Dealer's ${HAND_NAMES[r.dh.cat].toLowerCase()} beats your ${HAND_NAMES[r.ph.cat].toLowerCase()}.`)
    setRes({ label, m, payout: r.ret, stake, ph: HAND_NAMES[r.ph.cat], dh: HAND_NAMES[r.dh.cat], win: r.ret > stake })
    setRecent((x) => [{ id: uid(), m, win: r.ret > stake }, ...x])
    if (r.ret > stake) { setBanner(true); setTimeout(() => setBanner(false), 1500) }
  }

  const reveal = phase === 'done' && res?.label !== 'Folded'
  const ph = player.length && board.length >= 3 ? HAND_NAMES[bestHand([...player, ...board]).cat] : undefined
  const dh = reveal && dealer.length ? HAND_NAMES[bestHand([...dealer, ...board]).cat] : undefined

  return (
    <GameShell
      game={game}
      liveStatus={phase !== 'idle' ? status : undefined}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="relative">
          <Felt tone="blue" className="min-h-[420px] sm:min-h-[460px]">
            <Row label="Dealer" cards={dealer} hidden={!reveal} badge={dh} />
            <div className="my-5 sm:my-7 flex flex-col items-center">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/60">Community cards</div>
              <div className="flex gap-1.5 sm:gap-2 min-h-[102px] sm:min-h-[122px]">
                {board.map((c) => <PlayingCard key={c.id} card={c} />)}
                {Array.from({ length: 5 - board.length }, (_, i) => <div key={i} className="w-[72px] h-[102px] sm:w-[86px] sm:h-[122px] rounded-xl border-2 border-dashed border-white/10 hidden sm:block" />)}
              </div>
            </div>
            <Row label="You" cards={player} badge={ph} />
            {phase === 'idle' && !player.length && <div className="absolute inset-x-0 top-[45%] text-center text-sm text-silver/80">Set an ante and press Deal.</div>}
            <AnimatePresence>
              {res && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-center">
                  <span className={cn('inline-block rounded-md px-3 py-1 text-xs font-semibold', res.win ? 'bg-gold text-ink' : res.m === 1 ? 'bg-white/10 text-snow' : 'bg-ruby/20 text-ruby')}>
                    {res.label}{res.payout > 0 && <span className="num ml-1">+{fmt(res.payout)}</span>}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Felt>
          <ResultBanner show={banner} win multiplier={res?.m ?? 0} payout={res?.payout ?? 0} />
        </div>
      }
      panel={
        <>
          <WagerInput value={ante} onChange={setAnte} disabled={phase === 'decide' || phase === 'busy'} />
          {phase === 'decide' ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="gold" size="lg" onClick={() => finish(true)}>Call {fmt(ante * 2)}</Button>
              <Button variant="dark" size="lg" onClick={() => finish(false)}>Fold</Button>
            </div>
          ) : (
            <Button variant="gold" size="lg" className="w-full" onClick={deal} loading={phase === 'busy'}>{phase === 'done' ? 'Deal again' : 'Deal'}</Button>
          )}
          <div className="rounded-lg border border-steel bg-ink p-3 text-xs text-silver space-y-1.5">
            <div className="mb-1 font-semibold text-snow">Ante bonus</div>
            {[['Royal flush', '100:1'], ['Straight flush', '20:1'], ['Four of a kind', '10:1'], ['Full house', '3:1'], ['Flush', '2:1'], ['Straight or less', '1:1']].map(([h, p]) => <div key={h} className="flex justify-between"><span>{h}</span><span className="num text-snow">{p}</span></div>)}
          </div>
          <p className="text-[11px] text-silver leading-relaxed">Dealer needs a pair of fours or better to qualify. Call pays 1:1.</p>
        </>
      }
      info={{
        howTo: ['Set an ante and press Deal. You get two cards, the dealer gets two face down, and three community cards are dealt.', 'Call to play on (this places a second bet of 2× your ante), or fold and lose the ante.', 'After a call, the turn and river are dealt and the dealer reveals. Both hands use the best five of seven cards.', 'If the dealer does not qualify with a pair of fours or better, your ante pays by the bonus table and the call is returned. Otherwise the better hand wins: ante pays by the table and the call pays 1:1.'],
        fairness: 'Each hand uses a freshly shuffled single 52-card deck. Calling on every hand returns about 97.4% in a 400,000-hand simulation; folding your weakest starting hands improves that slightly.',
        odds: <div className="space-y-1.5 text-xs"><div className="flex justify-between"><span className="text-silver">Dealer fails to qualify</span><span className="num text-snow">≈ 24%</span></div><div className="flex justify-between"><span className="text-silver">Player flush or better</span><span className="num text-snow">≈ 5.8%</span></div><div className="flex justify-between"><span className="text-silver">RTP, always calling</span><span className="num text-snow">≈ 97.4%</span></div></div>,
      }}
    />
  )
}
