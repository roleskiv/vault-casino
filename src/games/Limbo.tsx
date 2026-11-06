import { animate, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui'
import type { Game } from '../data/games'
import { cn, rand, uid } from '../lib/format'
import { useStore } from '../store'
import { AutoRounds, GameShell, ModeTabs, PayoutRow, RecentStrip, WagerInput, type Mode } from './shared'

export const limboResult = (u: number) => Math.max(1, Math.floor((0.99 / (1 - u)) * 100) / 100)

export default function Limbo({ game }: { game: Game }) {
  const { placeBet, settle, toast } = useStore()
  const [wager, setWager] = useState(10)
  const [target, setTarget] = useState(2)
  const [shown, setShown] = useState(1)
  const [last, setLast] = useState<{ r: number; win: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<Mode>('manual')
  const [rounds, setRounds] = useState(10)
  const [autoLeft, setAutoLeft] = useState(0)
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>([])
  const stop = useRef(false)
  useEffect(() => () => { stop.current = true }, [])

  const chance = 99 / target

  const play = async () => {
    if (!placeBet(wager)) return false
    setBusy(true); setLast(null)
    const r = limboResult(rand())
    await new Promise<void>((res) => {
      animate(1, r, { duration: Math.min(0.9, 0.35 + Math.log10(r) * 0.25), ease: [0.3, 0.7, 0.2, 1], onUpdate: setShown, onComplete: () => res() })
    })
    const win = r >= target
    setLast({ r, win })
    settle(game.id, game.name, wager, win ? target : 0)
    setRecent((x) => [{ id: uid(), m: r, win }, ...x])
    setBusy(false)
    return true
  }
  const runAuto = async () => {
    stop.current = false
    for (let i = rounds; i > 0; i--) {
      if (stop.current) break
      setAutoLeft(i)
      if (!(await play())) break
      await new Promise((r) => setTimeout(r, 350))
    }
    setAutoLeft(0)
    toast({ title: 'Autoplay finished', tone: 'info' })
  }
  const running = autoLeft > 0

  return (
    <GameShell
      game={game}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="relative grid min-h-[340px] sm:min-h-[420px] place-items-center overflow-hidden">
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            {[260, 200, 140].map((s, i) => (
              <motion.div key={s} className="absolute rounded-full border" style={{ width: s, height: s, borderColor: i === 2 ? 'rgba(212,175,55,.5)' : 'rgba(255,255,255,.06)' }}
                animate={busy ? { scale: [1, 1.06, 1] } : { scale: 1 }} transition={{ duration: 0.6, repeat: busy ? Infinity : 0, delay: i * 0.08 }} />
            ))}
          </div>
          <div className="relative text-center">
            <div className={cn('num font-display text-6xl sm:text-8xl font-bold tracking-tight transition-colors', !last ? 'text-snow' : last.win ? 'gold-text' : 'text-ruby')}>
              {shown.toFixed(2)}×
            </div>
            <div className="mt-3 h-6 text-sm text-silver">
              {last ? (last.win ? <span className="text-emerald">Reached your {target.toFixed(2)}× target</span> : <>Needed <span className="num text-snow">{target.toFixed(2)}×</span></>) : busy ? 'Drawing…' : `Target ${target.toFixed(2)}×`}
            </div>
          </div>
        </div>
      }
      panel={
        <>
          <ModeTabs mode={mode} setMode={setMode} disabled={running} />
          <WagerInput value={wager} onChange={setWager} disabled={running || busy} />
          <div>
            <div className="mb-1.5 flex justify-between text-xs font-medium text-silver"><span>Target multiplier</span><span className="num">{chance.toFixed(2)}% chance</span></div>
            <div className="flex h-11 items-center rounded-lg border border-steel bg-ink focus-within:border-gold/60">
              <input type="number" min={1.01} max={1000} step={0.01} value={target} disabled={running || busy}
                onChange={(e) => setTarget(Math.min(1000, Math.max(1.01, +e.target.value || 1.01)))} className="num min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" aria-label="Target multiplier" />
              <span className="pr-3 text-xs text-silver">×</span>
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {[1.5, 2, 5, 10, 100].map((t) => (
                <button key={t} disabled={running || busy} onClick={() => setTarget(t)} className={cn('h-8 rounded-md border text-[11px] font-semibold num transition-colors disabled:opacity-50', target === t ? 'border-gold/60 bg-gold/10 text-gold-bright' : 'border-steel bg-ink text-silver hover:text-snow')}>{t}×</button>
              ))}
            </div>
          </div>
          <PayoutRow multiplier={target} wager={wager} />
          {mode === 'auto' && <AutoRounds value={rounds} onChange={setRounds} disabled={running} />}
          {mode === 'manual' ? <Button variant="gold" size="lg" className="w-full" onClick={play} loading={busy}>Play round</Button>
            : running ? <Button variant="dark" size="lg" className="w-full" onClick={() => { stop.current = true }}>Stop autoplay · {autoLeft} left</Button>
            : <Button variant="gold" size="lg" className="w-full" onClick={runAuto}>Start autoplay</Button>}
        </>
      }
      info={{
        howTo: ['Set a demo wager and a target multiplier between 1.01× and 1000×.', 'Press Play. A result multiplier is drawn instantly.', 'If the result is equal to or above your target, you win wager × target.', 'Higher targets pay more but are reached less often.'],
        fairness: 'The result is 0.99 ÷ (1 − U), rounded down to two decimals, where U is uniform on [0, 1). The chance of reaching target x is 99 ÷ x percent.',
        odds: <div className="grid grid-cols-2 gap-y-1.5 num text-xs">{[1.5, 2, 5, 10, 100, 1000].map((x) => [<span key={x + 'a'} className="text-silver">Target {x}×</span>, <span key={x + 'b'} className="text-right text-snow">{(99 / x).toFixed(3)}%</span>])}</div>,
      }}
    />
  )
}
