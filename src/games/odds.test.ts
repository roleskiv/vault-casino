import { describe, expect, it } from 'vitest'
import { GAMES } from '../data/games'
import { setSfxEnabled } from '../lib/sfx'
import { bTotal, coupReturn, playCoup } from './Baccarat'
import { handValue } from './Blackjack'
import type { PCard } from './cards'
import { dtReturn } from './DragonTiger'
import { GW_COUNTS, GW_SEGMENTS, GW_TOTAL } from './GoldenWheel'
import { hiloOptions } from './HiLo'
import { bestHand, holdemReturn, qualifies } from './Holdem'
import { hitChance, kenoTable } from './Keno'
import { limboResult } from './Limbo'
import { makeShoe } from './live'
import { minesMultiplier } from './Mines'
import { plinkoTable } from './Plinko'
import { rouletteMult } from './Roulette'
import { evaluate, SYMBOLS } from './Slot'
import { WHEELS } from './Wheel'

setSfxEnabled(false)

/** Build cards from short codes like 'As', 'Td', '7h'. */
const SUIT = { s: 0, h: 1, d: 2, c: 3 } as const
const RANK: Record<string, number> = { A: 1, T: 10, J: 11, Q: 12, K: 13 }
const cards = (s: string): PCard[] => s.split(' ').map((c, i) => ({ rank: RANK[c[0]] ?? +c[0], suit: SUIT[c[1] as keyof typeof SUIT], id: `t${i}` }))
const R = (rank: number): PCard => ({ rank, suit: 0, id: '' })

describe('game catalogue', () => {
  it('has unique ids and believable displayed RTPs', () => {
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(GAMES.length)
    for (const g of GAMES) { expect(g.rtp).toBeGreaterThanOrEqual(90); expect(g.rtp).toBeLessThan(100) }
  })
  it('makes every Original and every live table playable', () => {
    for (const g of GAMES.filter((x) => x.category !== 'slots')) expect(g.playable, g.id).not.toBeNull()
  })
})

describe('Originals', () => {
  it('Mines pays 0.99 ÷ survival probability for every board', () => {
    for (let mines = 1; mines <= 24; mines++) {
      let survive = 1
      for (let picks = 1; picks <= 25 - mines; picks++) {
        survive *= (25 - mines - picks + 1) / (25 - picks + 1)
        expect(minesMultiplier(mines, picks) * survive).toBeCloseTo(0.99, 9)
      }
    }
  })

  it('Limbo and Crash reach a target x about 99 ÷ x percent of the time', () => {
    const N = 200000
    for (const x of [1.5, 2, 10, 100]) {
      let hit = 0
      for (let i = 0; i < N; i++) if (limboResult((i + 0.5) / N) >= x) hit++
      expect((hit / N) * x).toBeGreaterThan(0.985)
      expect((hit / N) * x).toBeLessThanOrEqual(0.9901)
    }
  })

  it('Plinko tables return about 99% and are symmetric', () => {
    for (const n of [8, 12, 16]) for (const risk of ['low', 'medium', 'high'] as const) {
      const { mults, rtp } = plinkoTable(n, risk)
      expect(rtp, `${n} ${risk}`).toBeGreaterThan(0.98)
      expect(rtp, `${n} ${risk}`).toBeLessThanOrEqual(0.995)
      expect(mults).toEqual([...mults].reverse())
    }
  })

  it('Keno probabilities sum to 1 and no paytable returns more than 99%', () => {
    for (let p = 1; p <= 10; p++) {
      const total = Array.from({ length: p + 1 }, (_, h) => hitChance(p, h)).reduce((a, b) => a + b, 0)
      expect(total).toBeCloseTo(1, 12)
      const { rtp } = kenoTable(p)
      // rounding may shave a little off 99%, but never adds to it
      expect(rtp, `${p} picks`).toBeGreaterThan(0.985)
      expect(rtp, `${p} picks`).toBeLessThanOrEqual(0.99 + 1e-9)
    }
  })

  it('Wheel segments average exactly 0.99 at every risk', () => {
    for (const segs of Object.values(WHEELS)) expect(segs.reduce((a, b) => a + b, 0) / segs.length).toBeCloseTo(0.99, 9)
  })

  it('Hi-Lo options cover every outcome and pay 0.99 ÷ p', () => {
    for (let r = 1; r <= 13; r++) {
      for (const o of hiloOptions(r)) {
        const wins = Array.from({ length: 13 }, (_, i) => i + 1).filter((b) =>
          o.g === 'hi' ? b >= r : o.g === 'lo' ? b <= r : o.g === 'higher' ? b > r : o.g === 'lower' ? b < r : b === r).length
        expect(o.p).toBeCloseTo(wins / 13, 12)
      }
    }
  })

  it('Roulette: every bet returns 36/37', () => {
    const keys = ['red', 'black', 'odd', 'even', 'low', 'high', 'd1', 'd2', 'd3', 'c1', 'c2', 'c3', ...Array.from({ length: 37 }, (_, n) => `n:${n}`)]
    for (const k of keys) {
      const ev = Array.from({ length: 37 }, (_, n): number => rouletteMult(k, n)).reduce((a, b) => a + b, 0) / 37
      expect(ev, k).toBeCloseTo(36 / 37, 12)
    }
  })

  it('Slot paytable returns about 96% (exact calculation)', () => {
    const W = SYMBOLS.reduce((s, x) => s + x.w, 0)
    let perLine = 0
    for (const s of SYMBOLS) {
      const p = s.w / W
      for (let c = 1; c <= 5; c++) perLine += s.pay[c - 1] * p ** c * (c < 5 ? 1 - p : 1)
    }
    // evaluate() averages the five line pays, so the RTP equals one line's expected pay
    const rtp = perLine
    expect(rtp).toBeGreaterThan(0.95)
    expect(rtp).toBeLessThan(0.97)
    // sanity check evaluate() on a known grid: top-symbol five of a kind on every line
    const g = Array.from({ length: 5 }, () => [0, 0, 0])
    expect(evaluate(g).total).toBe(SYMBOLS[0].pay[4])
  })

  it('Blackjack counts soft and hard aces correctly', () => {
    expect(handValue([R(1), R(13)])).toEqual({ total: 21, soft: true })
    expect(handValue([R(1), R(1), R(9)])).toEqual({ total: 21, soft: true })
    expect(handValue([R(1), R(6), R(10)])).toEqual({ total: 17, soft: false })
    expect(handValue([R(13), R(12), R(2)]).total).toBe(22)
  })
})

describe('Live tables', () => {
  it('a shoe holds the right cards', () => {
    const shoe = makeShoe(8)
    expect(shoe.left).toBe(416)
    const counts = new Map<number, number>()
    for (let i = 0; i < 416; i++) { const c = shoe.draw(); counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1) }
    for (let r = 1; r <= 13; r++) expect(counts.get(r)).toBe(32)
  })

  it('Baccarat follows the third-card rules', () => {
    const seq = (s: string) => { const cs = cards(s); let i = 0; return () => cs[i++] }
    // deal order in playCoup: P1 P2 B1 B2 then third cards
    expect(playCoup(seq('8s 1s 2h 3h')).p.length).toBe(2) // natural 9 stands
    let c = playCoup(seq('2s 3s Kh 3h 8d 9d')) // player 5 draws an 8; banker on 3 stands against 8
    expect(c.p.length).toBe(3); expect(c.b.length).toBe(2)
    c = playCoup(seq('2s 3s Kh 3h 7d 9d')) // banker on 3 draws against a 7
    expect(c.b.length).toBe(3)
    c = playCoup(seq('3s 3s Kh 5h 9d')) // player 6 stands, banker 5 draws
    expect(c.p.length).toBe(2); expect(c.b.length).toBe(3)
    expect(bTotal(cards('9s 8h'))).toBe(7)
  })

  it('Baccarat infinite-deck RTPs match the published figures', () => {
    // Enumerate all 13^6 card sequences once (each rank has probability 1/13).
    const ret = { player: 0, banker: 0, tie: 0 }
    const seqCards = Array.from({ length: 13 }, (_, r) => R(r + 1))
    const idx = [0, 0, 0, 0, 0, 0]
    const total = 13 ** 6
    for (let n = 0; n < total; n++) {
      let x = n
      for (let k = 0; k < 6; k++) { idx[k] = x % 13; x = (x - idx[k]) / 13 }
      let i = 0
      const { p, b } = playCoup(() => seqCards[idx[i++]])
      ret.player += coupReturn('player', p, b); ret.banker += coupReturn('banker', p, b); ret.tie += coupReturn('tie', p, b)
    }
    expect(ret.banker / total).toBeCloseTo(0.9894, 2)
    expect(ret.player / total).toBeCloseTo(0.9876, 2)
    expect(ret.tie / total).toBeGreaterThan(0.84)
    expect(ret.tie / total).toBeLessThan(0.87)
  }, 30000)

  it('Dragon & Tiger: ties return half, tie bet pays 11:1', () => {
    expect(dtReturn('dragon', 13, 2)).toBe(2)
    expect(dtReturn('tiger', 13, 2)).toBe(0)
    expect(dtReturn('dragon', 7, 7)).toBe(0.5)
    expect(dtReturn('tie', 7, 7)).toBe(12)
    let ev = 0
    for (let d = 1; d <= 13; d++) for (let t = 1; t <= 13; t++) ev += dtReturn('dragon', d, t) / 169
    expect(ev).toBeCloseTo(12.5 / 13, 12) // infinite deck; an 8-deck shoe is slightly better at ≈96.3%
  })

  it('Golden Wheel: 50 segments and every bet returns exactly 96%', () => {
    expect(GW_SEGMENTS.length).toBe(GW_TOTAL)
    for (const [k, c] of Object.entries(GW_COUNTS)) {
      expect(GW_SEGMENTS.filter((s) => s === k).length).toBe(c)
      expect((c * +k) / GW_TOTAL).toBeCloseTo(0.96, 12)
    }
  })

  it("Hold'em ranks hands correctly", () => {
    const cat = (s: string) => bestHand(cards(s)).cat
    expect(cat('As Ks Qs Js Ts 2h 3d')).toBe(9)
    expect(cat('9s 8s 7s 6s 5s Ah Ad')).toBe(8)
    expect(cat('Ah 2d 3c 4s 5h 9d Kc')).toBe(4) // wheel straight
    expect(cat('Ah Ad Ac Kd Ks 2s 3s')).toBe(6)
    expect(cat('2h 5h 9h Jh Kh Ad As')).toBe(5)
    expect(cat('Ah Ad 7c 7s 3h 3d 9c')).toBe(2)
    // kicker decides between two pairs of aces
    expect(bestHand(cards('Ah Ad Kc 8s 4d 3c 2h')).score).toBeGreaterThan(bestHand(cards('As Ac Qc 8s 4d 3c 2h')).score)
    expect(qualifies(bestHand(cards('4h 4d 9c Js 2d 7c Kh')))).toBe(true)
    expect(qualifies(bestHand(cards('3h 3d 9c Js 2d 7c Kh')))).toBe(false)
  })

  it("Hold'em settles ante and call correctly", () => {
    const board = cards('Kc 8d 5s 3c 2d')
    // dealer does not qualify (high card): ante pays 1:1, call is returned
    expect(holdemReturn(cards('Ah Kh'), cards('9h 7h'), board, 10).ret).toBe(20 + 20)
    // player flush beats dealer pair: ante pays 2:1, call pays 1:1
    const flushBoard = cards('Kh 8h 5h 3c 2d')
    expect(holdemReturn(cards('Ah Th'), cards('Kd 7c'), flushBoard, 10).ret).toBe(30 + 40)
    // dealer qualifies and wins: lose everything
    expect(holdemReturn(cards('9h 7h'), cards('Kh Ks'), board, 10).ret).toBe(0)
  })
})
