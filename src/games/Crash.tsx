import { AnimatePresence, motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Avatar } from '../components/Layout'
import { Button } from '../components/ui'
import type { Game } from '../data/games'
import { cn, fmt, rand, uid } from '../lib/format'
import { NAMES } from '../lib/sim'
import { useStore } from '../store'
import { AutoRounds, GameShell, ModeTabs, RecentStrip, WagerInput, type Mode } from './shared'

const RATE = 0.1 // growth per second (ln)
const WAIT_MS = 5000
const POST_MS = 2600
const mAt = (ms: number) => Math.exp((RATE * ms) / 1000)
const msFor = (m: number) => (Math.log(m) / RATE) * 1000

type Phase = 'waiting' | 'running' | 'crashed'
interface Bot { id: string; name: string; wager: number; target: number; cashed: number | null }

function makeBots(): Bot[] {
  const n = 7 + Math.floor(Math.random() * 7)
  const names = [...NAMES].sort(() => Math.random() - 0.5).slice(0, n)
  return names.map((name) => ({
    id: uid(), name, wager: [10, 25, 50, 100, 200, 500, 1000][Math.floor(Math.random() ** 1.5 * 7)],
    target: +(1.1 + Math.random() ** 2 * 8).toFixed(2), cashed: null,
  }))
}

function Chart({ m, t, phase, crashAt }: { m: number; t: number; phase: Phase; crashAt: number }) {
  const W = 800, H = 420, PADL = 52, PADB = 34
  const tMax = Math.max(8000, t * 1.1)
  const mMax = Math.max(2, m * 1.18)
  const x = (ms: number) => PADL + (ms / tMax) * (W - PADL - 16)
  const y = (mm: number) => H - PADB - ((mm - 1) / (mMax - 1)) * (H - PADB - 20)
  const pts: string[] = []
  const steps = 60
  for (let i = 0; i <= steps; i++) { const ms = (t * i) / steps; pts.push(`${x(ms).toFixed(1)},${y(mAt(ms)).toFixed(1)}`) }
  const line = `M${pts.join(' L')}`
  const yTicks = Array.from({ length: 5 }, (_, i) => 1 + ((mMax - 1) * i) / 4)
  const xTicks = Array.from({ length: 5 }, (_, i) => (tMax * i) / 4)
  const crashed = phase === 'crashed'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
      <defs>
        <linearGradient id="cr-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={crashed ? '#E5484D' : '#D4AF37'} stopOpacity=".28" /><stop offset="1" stopColor={crashed ? '#E5484D' : '#D4AF37'} stopOpacity="0" /></linearGradient>
        <linearGradient id="cr-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#9C7C1E" /><stop offset="1" stopColor="#F5D778" /></linearGradient>
        <filter id="cr-glow"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      {yTicks.map((v) => (
        <g key={v}><line x1={PADL} x2={W - 10} y1={y(v)} y2={y(v)} stroke="#fff" strokeOpacity=".05" />
          <text x={PADL - 10} y={y(v) + 4} textAnchor="end" fontSize="12" fill="#9299A5" fontFamily="JetBrains Mono">{v.toFixed(v < 10 ? 1 : 0)}×</text></g>
      ))}
      {xTicks.map((v) => <text key={v} x={x(v)} y={H - 10} textAnchor="middle" fontSize="12" fill="#9299A5" fontFamily="JetBrains Mono">{(v / 1000).toFixed(0)}s</text>)}
      {phase !== 'waiting' && t > 0 && (
        <>
          <path d={`${line} L${x(t)},${y(1)} L${x(0)},${y(1)} Z`} fill="url(#cr-area)" />
          <path d={line} fill="none" stroke={crashed ? '#E5484D' : '#F5D778'} strokeWidth="10" strokeOpacity=".22" filter="url(#cr-glow)" />
          <path d={line} fill="none" stroke={crashed ? '#E5484D' : 'url(#cr-line)'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={x(t)} cy={y(mAt(t))} r="7" fill={crashed ? '#E5484D' : '#FBE7A1'} />
          {!crashed && <circle cx={x(t)} cy={y(mAt(t))} r="14" fill="#F5D778" opacity=".25" />}
        </>
      )}
      {crashed && <text x={x(msFor(crashAt))} y={y(crashAt) - 18} textAnchor="end" fontSize="13" fill="#E5484D" fontFamily="Inter" fontWeight="600">Round ended</text>}
    </svg>
  )
}

export default function Crash({ game }: { game: Game }) {
  const { placeBet, settle } = useStore()
  const [wager, setWager] = useState(10)
  const [autoCash, setAutoCash] = useState(2)
  const [mode, setMode] = useState<Mode>('manual')
  const [rounds, setRounds] = useState(10)
  const [autoLeft, setAutoLeft] = useState(0)
  const [view, setView] = useState({ phase: 'waiting' as Phase, m: 1, t: 0, wait: WAIT_MS, crashAt: 1 })
  const [bots, setBots] = useState<Bot[]>(makeBots)
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>(() => Array.from({ length: 10 }, () => { const m = Math.max(1, 0.99 / (1 - Math.random())); return { id: uid(), m: Math.min(m, 200), win: m >= 2 } }))
  const [bet, setBet] = useState<{ wager: number; cashed: number | null; queued: boolean; active: boolean }>({ wager: 0, cashed: null, queued: false, active: false })

  const s = useRef({ phase: 'waiting' as Phase, phaseStart: performance.now(), crashAt: 1 })
  const betRef = useRef(bet); betRef.current = bet
  const cfg = useRef({ wager, autoCash, mode, autoLeft }); cfg.current = { wager, autoCash, mode, autoLeft }

  const cashOut = (m: number) => {
    const b = betRef.current
    if (!b.active || b.cashed) return
    const nb = { ...b, cashed: m, active: false }
    betRef.current = nb; setBet(nb)
    settle(game.id, game.name, b.wager, m)
  }

  useEffect(() => {
    let raf = 0, last = 0
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (now - last < 33) return
      last = now
      const st = s.current
      const el = now - st.phaseStart
      if (st.phase === 'waiting') {
        if (el >= WAIT_MS) {
          const u = rand()
          st.crashAt = Math.min(1000, Math.max(1, Math.floor((0.99 / (1 - u)) * 100) / 100))
          st.phase = 'running'; st.phaseStart = now
          // activate queued bet
          const b = betRef.current
          if (b.queued) {
            const nb = placeBet(b.wager) ? { wager: b.wager, cashed: null, queued: false, active: true } : { ...b, queued: false }
            betRef.current = nb; setBet(nb)
          }
        }
        setView({ phase: 'waiting', m: 1, t: 0, wait: Math.max(0, WAIT_MS - el), crashAt: st.crashAt })
      } else if (st.phase === 'running') {
        const m = mAt(el)
        if (m >= st.crashAt) {
          st.phase = 'crashed'; st.phaseStart = now
          const b = betRef.current
          if (b.active && !b.cashed) { settle(game.id, game.name, b.wager, 0); const nb = { ...b, active: false }; betRef.current = nb; setBet(nb) }
          setRecent((r) => [{ id: uid(), m: st.crashAt, win: st.crashAt >= 2 }, ...r].slice(0, 20))
          setView({ phase: 'crashed', m: st.crashAt, t: msFor(st.crashAt), wait: 0, crashAt: st.crashAt })
          return
        }
        const b = betRef.current
        if (b.active && !b.cashed && cfg.current.autoCash > 1 && m >= cfg.current.autoCash) cashOut(cfg.current.autoCash)
        setBots((bs) => bs.some((x) => !x.cashed && x.target <= m) ? bs.map((x) => (!x.cashed && x.target <= m ? { ...x, cashed: x.target } : x)) : bs)
        setView({ phase: 'running', m, t: el, wait: 0, crashAt: st.crashAt })
      } else if (st.phase === 'crashed' && el >= POST_MS) {
        st.phase = 'waiting'; st.phaseStart = now
        setBots(makeBots())
        // autoplay queues next round automatically
        const c = cfg.current
        if (c.mode === 'auto' && c.autoLeft > 0) {
          const left = c.autoLeft - 1
          setAutoLeft(left)
          if (left > 0) { const nb = { wager: c.wager, cashed: null, queued: true, active: false }; betRef.current = nb; setBet(nb) }
        } else if (!betRef.current.queued) {
          const nb = { ...betRef.current, cashed: null, active: false }; betRef.current = nb; setBet(nb)
        }
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { phase, m, t, wait, crashAt } = view
  const queue = () => { const nb = { wager, cashed: null, queued: !bet.queued, active: false }; betRef.current = nb; setBet(nb) }
  const startAuto = () => { setAutoLeft(rounds); const nb = { wager, cashed: null, queued: true, active: false }; betRef.current = nb; setBet(nb) }
  const stopAuto = () => { setAutoLeft(0); if (bet.queued) { const nb = { ...bet, queued: false }; betRef.current = nb; setBet(nb) } }

  let action
  if (mode === 'auto') {
    action = autoLeft > 0
      ? <Button variant="dark" size="lg" className="w-full" onClick={stopAuto}>Stop autoplay · {autoLeft} left</Button>
      : <Button variant="gold" size="lg" className="w-full" onClick={startAuto}>Start autoplay</Button>
  } else if (bet.active && phase === 'running') {
    action = <Button variant="gold" size="lg" className="w-full" onClick={() => cashOut(+m.toFixed(2))}>Cash out <span className="num">{fmt(bet.wager * m)} VC</span></Button>
  } else if (bet.queued) {
    action = <Button variant="dark" size="lg" className="w-full" onClick={queue}>Cancel bet <span className="text-silver font-normal">{phase === 'waiting' ? 'starts soon' : 'next round'}</span></Button>
  } else {
    action = <Button variant="gold" size="lg" className="w-full" onClick={queue}>{phase === 'waiting' ? 'Place demo bet' : 'Bet next round'}</Button>
  }

  return (
    <GameShell
      game={game}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl border border-steel/60 bg-ink/70">
          <Chart m={m} t={t} phase={phase} crashAt={crashAt} />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <AnimatePresence mode="wait">
              {phase === 'waiting' ? (
                <motion.div key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <div className="label">Next round in</div>
                  <div className="num mt-1 font-display text-4xl sm:text-5xl font-bold">{(wait / 1000).toFixed(1)}s</div>
                  <div className="mx-auto mt-3 h-1 w-40 overflow-hidden rounded bg-steel"><div className="h-full gold-fill" style={{ width: `${(1 - wait / WAIT_MS) * 100}%` }} /></div>
                </motion.div>
              ) : (
                <motion.div key="r" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <div className={cn('num font-display text-5xl sm:text-7xl font-bold tracking-tight', phase === 'crashed' ? 'text-ruby' : 'text-snow')}>{m.toFixed(2)}×</div>
                  {phase === 'crashed' && <div className="mt-2 text-sm text-silver">Round ended at <span className="num">{crashAt.toFixed(2)}×</span></div>}
                  {bet.cashed && <div className="mt-2 inline-flex rounded-md border border-emerald/40 bg-emerald/10 px-2.5 py-1 text-xs font-semibold text-emerald">You cashed out at <span className="num ml-1">{bet.cashed.toFixed(2)}×</span></div>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      }
      panel={
        <>
          <ModeTabs mode={mode} setMode={setMode} disabled={autoLeft > 0 || bet.active} />
          <WagerInput value={wager} onChange={setWager} disabled={bet.active || bet.queued} />
          <div>
            <div className="mb-1.5 flex justify-between text-xs font-medium text-silver"><span>Auto cash out</span><span className="num">{(99 / autoCash).toFixed(2)}% chance</span></div>
            <div className="flex h-11 items-center rounded-lg border border-steel bg-ink focus-within:border-gold/60">
              <input type="number" min={1.01} step={0.1} value={autoCash} onChange={(e) => setAutoCash(Math.max(1.01, +e.target.value || 1.01))} disabled={bet.active} className="num min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" aria-label="Auto cash out multiplier" />
              <span className="pr-3 text-xs text-silver">×</span>
            </div>
          </div>
          {mode === 'auto' && <AutoRounds value={rounds} onChange={setRounds} disabled={autoLeft > 0} />}
          {action}
          <div className="rounded-xl border border-steel bg-ink">
            <div className="flex items-center justify-between px-3 h-10 border-b border-steel/70 text-xs">
              <span className="flex items-center gap-1.5 font-semibold"><Users className="h-3.5 w-3.5 text-gold" />{bots.length} demo players</span>
              <span className="text-silver">Fictional</span>
            </div>
            <div className="max-h-[220px] overflow-y-auto">
              {bots.map((b) => (
                <div key={b.id} className={cn('flex items-center gap-2 px-3 h-9 text-xs', b.cashed != null && 'bg-emerald/[0.05]')}>
                  <Avatar name={b.name} size={20} />
                  <span className="truncate flex-1 text-silver">{b.name}</span>
                  <span className="num w-14 text-right">{b.wager}</span>
                  <span className={cn('num w-14 text-right', b.cashed ? 'text-emerald' : phase === 'crashed' ? 'text-ruby/80' : 'text-silver')}>{b.cashed ? `${b.cashed.toFixed(2)}×` : phase === 'crashed' ? 'ended' : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      }
      info={{
        howTo: ['Set a demo wager and an optional auto cash-out multiplier.', 'Place your bet during the countdown (or queue it for the next round).', 'When the round starts the multiplier climbs from 1.00×. Cash out at any time to lock in wager × multiplier.', 'If the round ends before you cash out, the wager is lost.'],
        fairness: 'Each round end point is drawn before the round starts as 0.99 ÷ (1 − U), where U is uniform on [0, 1). That gives every target multiplier x a 99 ÷ x percent chance of being reached.',
        odds: <div className="grid grid-cols-2 gap-y-1.5 num text-xs">{[1.5, 2, 3, 5, 10, 100].map((x) => [<span key={x + 'a'} className="text-silver">Reach {x.toFixed(2)}×</span>, <span key={x + 'b'} className="text-right text-snow">{(99 / x).toFixed(2)}%</span>])}</div>,
      }}
    />
  )
}
