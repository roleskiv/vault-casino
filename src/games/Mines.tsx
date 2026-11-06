import { motion } from 'framer-motion'
import { sfx } from '../lib/sfx'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui'
import type { Game } from '../data/games'
import { cn, fmt, rand, uid } from '../lib/format'
import { useStore } from '../store'
import { AutoRounds, GameShell, ModeTabs, RecentStrip, ResultBanner, Stat, WagerInput, type Mode } from './shared'

const N = 25
const EDGE = 0.99
export function minesMultiplier(mines: number, picks: number) {
  let m = 1
  for (let i = 0; i < picks; i++) m *= (N - i) / (N - mines - i)
  return EDGE * m
}

function Gem() {
  return (
    <svg viewBox="0 0 48 48" className="h-[58%] w-[58%] drop-shadow-[0_4px_10px_rgba(212,175,55,.45)]">
      <defs><linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FBE7A1" /><stop offset=".5" stopColor="#D4AF37" /><stop offset="1" stopColor="#8A6A17" /></linearGradient></defs>
      <path d="M24 4 L42 18 L24 44 L6 18 Z" fill="url(#gm)" />
      <path d="M6 18 L42 18 L24 4 Z" fill="#fff" fillOpacity=".35" />
      <path d="M24 18 L24 44 L42 18 Z" fill="#000" fillOpacity=".15" />
    </svg>
  )
}
function Mine() {
  return (
    <svg viewBox="0 0 48 48" className="h-[60%] w-[60%]">
      {[0, 45, 90, 135].map((a) => <rect key={a} x="22" y="5" width="4" height="38" rx="2" fill="#4a515d" transform={`rotate(${a} 24 24)`} />)}
      <circle cx="24" cy="24" r="12" fill="#1a1d23" stroke="#E5484D" strokeOpacity=".6" />
      <circle cx="20" cy="20" r="3.5" fill="#fff" fillOpacity=".25" />
    </svg>
  )
}

type Tile = { revealed: boolean; mine: boolean; picked: boolean }

export default function Mines({ game }: { game: Game }) {
  const { placeBet, settle, toast } = useStore()
  const [wager, setWager] = useState(10)
  const [mines, setMines] = useState(3)
  const [tiles, setTiles] = useState<Tile[]>(() => Array.from({ length: N }, () => ({ revealed: false, mine: false, picked: false })))
  const [active, setActive] = useState(false)
  const [picks, setPicks] = useState(0)
  const [result, setResult] = useState<{ win: boolean; m: number; p: number } | null>(null)
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>([])
  const [mode, setMode] = useState<Mode>('manual')
  const [rounds, setRounds] = useState(10)
  const [autoPicks, setAutoPicks] = useState(3)
  const [autoLeft, setAutoLeft] = useState(0)
  const layout = useRef<boolean[]>([])
  const stop = useRef(false)
  useEffect(() => () => { stop.current = true }, [])

  const cur = minesMultiplier(mines, picks)
  const next = minesMultiplier(mines, picks + 1)

  const newLayout = () => {
    const idx = Array.from({ length: N }, (_, i) => i)
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]] }
    const set = new Set(idx.slice(0, mines))
    layout.current = Array.from({ length: N }, (_, i) => set.has(i))
  }

  const start = () => {
    if (!placeBet(wager)) return false
    newLayout()
    setTiles(Array.from({ length: N }, () => ({ revealed: false, mine: false, picked: false })))
    setPicks(0); setResult(null); setActive(true)
    return true
  }

  const finish = (win: boolean, p: number, m: number, picked: Set<number>) => {
    setActive(false)
    setTiles(layout.current.map((mine, i) => ({ mine, revealed: true, picked: picked.has(i) })))
    settle(game.id, game.name, wager, win ? m : 0)
    setResult({ win, m: win ? m : 0, p: win ? wager * m : 0 })
    setRecent((x) => [{ id: uid(), m: win ? m : 0, win }, ...x])
    setTimeout(() => setResult(null), 1800)
    void p
  }

  const pick = (i: number) => {
    if (!active || tiles[i].revealed) return
    const mine = layout.current[i]
    const t = tiles.map((x, k) => (k === i ? { revealed: true, mine, picked: true } : x))
    setTiles(t)
    if (!mine) sfx('reveal')
    const pickedSet = new Set(t.map((x, k) => (x.picked ? k : -1)).filter((k) => k >= 0))
    if (mine) { setTimeout(() => finish(false, 0, 0, pickedSet), 350); return }
    const np = picks + 1
    setPicks(np)
    if (np === N - mines) setTimeout(() => finish(true, np, minesMultiplier(mines, np), pickedSet), 300)
  }

  const cashout = () => {
    const pickedSet = new Set(tiles.map((x, k) => (x.picked ? k : -1)).filter((k) => k >= 0))
    finish(true, picks, cur, pickedSet)
  }

  const randomPick = () => {
    const free = tiles.map((t, i) => (t.revealed ? -1 : i)).filter((i) => i >= 0)
    if (free.length) pick(free[Math.floor(rand() * free.length)])
  }

  const runAuto = async () => {
    stop.current = false
    for (let r = rounds; r > 0; r--) {
      if (stop.current) break
      setAutoLeft(r)
      if (!placeBet(wager)) break
      newLayout()
      const order = Array.from({ length: N }, (_, i) => i).sort(() => rand() - 0.5).slice(0, autoPicks)
      const picked = new Set<number>()
      setTiles(Array.from({ length: N }, () => ({ revealed: false, mine: false, picked: false })))
      setResult(null)
      let hit = false
      for (const i of order) {
        await new Promise((res) => setTimeout(res, 180))
        picked.add(i)
        const mine = layout.current[i]
        setTiles((t) => t.map((x, k) => (k === i ? { revealed: true, mine, picked: true } : x)))
        if (!mine) sfx('reveal')
        if (mine) { hit = true; break }
      }
      await new Promise((res) => setTimeout(res, 250))
      finish(!hit, autoPicks, minesMultiplier(mines, autoPicks), picked)
      await new Promise((res) => setTimeout(res, 900))
    }
    setAutoLeft(0)
    toast({ title: 'Autoplay finished', tone: 'info' })
  }

  const running = autoLeft > 0
  const locked = active || running

  return (
    <GameShell
      game={game}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="relative mx-auto w-full max-w-[520px]">
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {tiles.map((t, i) => (
              <motion.button key={i} onClick={() => pick(i)} disabled={!active || t.revealed}
                whileHover={active && !t.revealed ? { y: -2 } : undefined} whileTap={active && !t.revealed ? { scale: 0.95 } : undefined}
                className={cn('relative aspect-square rounded-xl border transition-colors duration-150 [perspective:600px]',
                  !t.revealed && 'border-[#353c47] bg-[linear-gradient(180deg,#2a3039,#1d2129)] shadow-[0_3px_0_#0e1014]',
                  !t.revealed && active && 'hover:border-gold/50 cursor-pointer',
                  !t.revealed && !active && 'opacity-80 cursor-default',
                  t.revealed && !t.mine && (t.picked ? 'border-gold/70 bg-[#17140b]' : 'border-steel bg-ink opacity-60'),
                  t.revealed && t.mine && (t.picked ? 'border-ruby/70 bg-[#1b0d0e]' : 'border-steel bg-ink opacity-60'))}>
                {t.revealed && (
                  <motion.span initial={{ rotateY: 90, scale: 0.6 }} animate={{ rotateY: 0, scale: 1 }} transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }} className="absolute inset-0 grid place-items-center">
                    {t.mine ? <Mine /> : <Gem />}
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>
          <ResultBanner show={!!result} win={!!result?.win} multiplier={result?.m ?? 0} payout={result?.p ?? 0} />
        </div>
      }
      panel={
        <>
          <ModeTabs mode={mode} setMode={setMode} disabled={locked} />
          <WagerInput value={wager} onChange={setWager} disabled={locked} />
          <div>
            <div className="mb-1.5 flex justify-between text-xs font-medium text-silver"><span>Mines</span><span className="num">{N - mines} gems</span></div>
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 3, 5, 10, 15, 24].map((n) => (
                <button key={n} disabled={locked} onClick={() => setMines(n)} className={cn('h-9 rounded-lg border text-xs font-semibold num transition-colors disabled:opacity-50', mines === n ? 'border-gold/60 bg-gold/10 text-gold-bright' : 'border-steel bg-ink text-silver hover:text-snow')}>{n}</button>
              ))}
            </div>
          </div>
          {mode === 'auto' && (
            <>
              <div>
                <div className="mb-1.5 flex justify-between text-xs font-medium text-silver"><span>Tiles per round</span><span className="num">{minesMultiplier(mines, autoPicks).toFixed(2)}×</span></div>
                <input type="range" min={1} max={N - mines} value={Math.min(autoPicks, N - mines)} onChange={(e) => setAutoPicks(+e.target.value)} disabled={running} className="w-full accent-[#D4AF37]" />
                <div className="num text-xs text-snow">{Math.min(autoPicks, N - mines)} tiles</div>
              </div>
              <AutoRounds value={rounds} onChange={setRounds} disabled={running} />
            </>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Current" value={`${cur.toFixed(2)}×`} tone={picks ? 'gold' : undefined} />
            <Stat label="Next tile" value={`${next.toFixed(2)}×`} />
          </div>
          {mode === 'manual' ? (
            active ? (
              <div className="space-y-2">
                <Button variant="gold" size="lg" className="w-full" onClick={cashout} disabled={picks === 0}>
                  Cash out <span className="num">{fmt(wager * cur)} VC</span>
                </Button>
                <Button variant="dark" className="w-full" onClick={randomPick}>Pick random tile</Button>
              </div>
            ) : (
              <Button variant="gold" size="lg" className="w-full" onClick={start}>Start round</Button>
            )
          ) : running ? (
            <Button variant="dark" size="lg" className="w-full" onClick={() => { stop.current = true }}>Stop autoplay · {autoLeft} left</Button>
          ) : (
            <Button variant="gold" size="lg" className="w-full" onClick={runAuto}>Start autoplay</Button>
          )}
          <p className="text-[11px] text-silver leading-relaxed">Chance the next tile is safe: <span className="num text-snow">{(((N - mines - picks) / (N - picks)) * 100).toFixed(1)}%</span></p>
        </>
      }
      info={{
        howTo: ['Choose a demo wager and the number of mines (1–24).', 'Press Start round, then reveal tiles one at a time.', 'Each gold gem raises your multiplier. Reveal a mine and the round ends without payout.', 'Cash out at any point after your first gem to collect wager × current multiplier.'],
        fairness: 'Mine positions are shuffled with a Fisher–Yates shuffle before your first pick and never move. The multiplier for k gems with m mines is 0.99 × C(25,k) ÷ C(25−m,k).',
        odds: (
          <div className="num text-xs">
            <div className="grid grid-cols-5 gap-y-1.5 text-silver"><span>Gems</span>{[1, 3, 5, 10].map((m) => <span key={m} className="text-right">{m} mines</span>)}</div>
            {[1, 2, 3, 5, 8].map((k) => (
              <div key={k} className="grid grid-cols-5 mt-1.5"><span className="text-silver">{k}</span>{[1, 3, 5, 10].map((m) => <span key={m} className="text-right text-snow">{minesMultiplier(m, k).toFixed(2)}×</span>)}</div>
            ))}
          </div>
        ),
      }}
    />
  )
}
