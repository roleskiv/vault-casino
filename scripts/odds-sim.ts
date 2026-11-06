// Monte Carlo check of the live-table odds. Run: npm run odds -- 400000
import { playCoup, coupReturn } from '../src/games/Baccarat'
import { dtReturn } from '../src/games/DragonTiger'
import { GW_SEGMENTS } from '../src/games/GoldenWheel'
import { holdemReturn, bestHand, qualifies } from '../src/games/Holdem'
import { makeShoe } from '../src/games/live'
import { setSfxEnabled } from '../src/lib/sfx'
setSfxEnabled(false)
const N = +(process.argv[2] ?? 400000)
const pct = (x: number) => (x * 100).toFixed(2) + '%'

{ const shoe = makeShoe(8); const s = { player: 0, banker: 0, tie: 0, ppair: 0, bpair: 0 }; let ties = 0
  for (let i = 0; i < N; i++) { shoe.check(30); const { p, b } = playCoup(() => shoe.draw()); for (const k of Object.keys(s) as (keyof typeof s)[]) s[k] += coupReturn(k, p, b); if (coupReturn('tie', p, b)) ties++ }
  console.log('Baccarat RTP', Object.fromEntries(Object.entries(s).map(([k, v]) => [k, pct(v / N)])), 'tie chance', pct(ties / N)) }
{ const shoe = makeShoe(8); let d = 0, t = 0, ti = 0
  for (let i = 0; i < N; i++) { shoe.check(20); const a = shoe.draw().rank, b = shoe.draw().rank; d += dtReturn('dragon', a, b); t += dtReturn('tie', a, b); if (a > b) ti++ }
  console.log('DragonTiger RTP dragon', pct(d / N), 'tie', pct(t / N), 'dragon win', pct(ti / N)) }
{ const ret: Record<string, number> = {}
  for (const k of GW_SEGMENTS) ret[k] = (ret[k] ?? 0) + +k / GW_SEGMENTS.length
  console.log('Golden wheel RTP per bet', ret, 'segments', GW_SEGMENTS.length) }
{ const shoe = makeShoe(1); let ret = 0, nq = 0, fl = 0
  for (let i = 0; i < N; i++) { shoe.check(52); const p = [shoe.draw(), shoe.draw()], d = [shoe.draw(), shoe.draw()], b = [0, 0, 0, 0, 0].map(() => shoe.draw())
    const r = holdemReturn(p, d, b, 1); ret += r.ret; if (!qualifies(r.dh)) nq++; if (bestHand([...p, ...b]).cat >= 5) fl++ }
  console.log("Hold'em always-call RTP", pct(ret / (3 * N)), 'dealer NQ', pct(nq / N), 'player flush+', pct(fl / N)) }
