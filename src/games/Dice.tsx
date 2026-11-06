import { motion } from 'framer-motion'
import { ArrowLeftRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui'
import type { Game } from '../data/games'
import { cn, rand, uid } from '../lib/format'
import { useStore } from '../store'
import { AutoRounds, GameShell, ModeTabs, PayoutRow, RecentStrip, WagerInput, type Mode } from './shared'

const EDGE = 0.99

export default function Dice({ game }: { game: Game }) {
  const { placeBet, settle, toast } = useStore()
  const [wager, setWager] = useState(10)
  const [target, setTarget] = useState(50)
  const [over, setOver] = useState(true)
  const [roll, setRoll] = useState<number | null>(null)
  const [lastWin, setLastWin] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<Mode>('manual')
  const [rounds, setRounds] = useState(10)
  const [autoLeft, setAutoLeft] = useState(0)
  const [recent, setRecent] = useState<{ id: string; m: number; win: boolean }[]>([])
  const stop = useRef(false)

  const chance = over ? 100 - target : target
  const multiplier = EDGE * 100 / chance

  const play = async () => {
    if (!placeBet(wager)) return false
    setBusy(true)
    const r = +(rand() * 100).toFixed(2)
    setRoll(r)
    const win = over ? r > target : r < target
    await new Promise((res) => setTimeout(res, 380))
    setLastWin(win)
    settle(game.id, game.name, wager, win ? multiplier : 0)
    setRecent((x) => [{ id: uid(), m: win ? multiplier : 0, win }, ...x])
    setBusy(false)
    return true
  }

  const runAuto = async () => {
    stop.current = false
    for (let i = rounds; i > 0; i--) {
      if (stop.current) break
      setAutoLeft(i)
      const ok = await play()
      if (!ok) break
      await new Promise((res) => setTimeout(res, 260))
    }
    setAutoLeft(0)
    toast({ title: 'Autoplay finished', tone: 'info' })
  }
  useEffect(() => () => { stop.current = true }, [])

  const running = autoLeft > 0
  const winZone = over ? { left: `${target}%`, right: '0%' } : { left: '0%', right: `${100 - target}%` }

  return (
    <GameShell
      game={game}
      top={<RecentStrip items={recent} />}
      stage={
        <div className="flex min-h-[340px] sm:min-h-[420px] flex-col justify-center px-2 sm:px-8">
          <div className="mb-10 flex justify-center">
            <motion.div key={roll ?? 'none'} initial={{ scale: 0.85, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }}
              className={cn('num font-display text-6xl sm:text-7xl font-bold tracking-tight', lastWin == null ? 'text-snow/40' : lastWin ? 'gold-text' : 'text-silver')}>
              {roll == null ? '00.00' : roll.toFixed(2)}
            </motion.div>
          </div>
          <div className="relative">
            <div className="flex justify-between mb-3 text-xs num text-silver">{[0, 25, 50, 75, 100].map((n) => <span key={n}>{n}</span>)}</div>
            <div className="relative rounded-full border border-steel bg-ink p-[5px]">
              <div className="relative h-[10px] rounded-full bg-ruby/70 overflow-hidden">
                <motion.div className="absolute top-0 bottom-0 bg-emerald" animate={winZone} transition={{ duration: 0.15 }} />
              </div>
              <input type="range" min={2} max={98} step={1} value={target} disabled={busy || running}
                onChange={(e) => setTarget(+e.target.value)} aria-label="Target"
                className="vault-range absolute inset-x-[5px] top-[5px] h-[10px] w-[calc(100%-10px)] cursor-pointer" />
            </div>
            {roll != null && (
              <motion.div className="absolute -top-14" animate={{ left: `calc(${roll}% - 22px)` }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
                <div className={cn('grid h-10 w-11 place-items-center rounded-lg border text-[11px] font-bold num shadow-lg', lastWin ? 'border-gold bg-gold text-ink' : 'border-steel bg-graphite text-snow')}>{roll.toFixed(0)}</div>
                <div className={cn('mx-auto h-2 w-2 -mt-1 rotate-45', lastWin ? 'bg-gold' : 'bg-graphite border-r border-b border-steel')} />
              </motion.div>
            )}
          </div>
          <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg border border-steel bg-ink p-3"><div className="text-[11px] text-silver">Multiplier</div><div className="num text-base font-semibold">{multiplier.toFixed(4)}×</div></div>
            <button onClick={() => setOver((o) => !o)} disabled={busy || running} className="rounded-lg border border-steel bg-ink p-3 text-left hover:border-gold/50 transition-colors disabled:opacity-60">
              <div className="flex items-center justify-between text-[11px] text-silver">Roll {over ? 'over' : 'under'} <ArrowLeftRight className="h-3.5 w-3.5" /></div>
              <div className="num text-base font-semibold">{target.toFixed(2)}</div>
            </button>
            <div className="rounded-lg border border-steel bg-ink p-3"><div className="text-[11px] text-silver">Win chance</div><div className="num text-base font-semibold">{chance.toFixed(2)}%</div></div>
          </div>
        </div>
      }
      panel={
        <>
          <ModeTabs mode={mode} setMode={setMode} disabled={running} />
          <WagerInput value={wager} onChange={setWager} disabled={running} />
          <PayoutRow multiplier={multiplier} wager={wager} />
          {mode === 'auto' && <AutoRounds value={rounds} onChange={setRounds} disabled={running} />}
          {mode === 'manual' ? (
            <Button variant="gold" size="lg" className="w-full" onClick={play} loading={busy}>Roll dice</Button>
          ) : running ? (
            <Button variant="dark" size="lg" className="w-full" onClick={() => { stop.current = true }}>Stop autoplay · {autoLeft} left</Button>
          ) : (
            <Button variant="gold" size="lg" className="w-full" onClick={runAuto}>Start autoplay</Button>
          )}
          <p className="text-[11px] text-silver leading-relaxed">Drag the slider to set your target. Lower win chance means a higher multiplier.</p>
        </>
      }
      info={{
        howTo: ['Set a demo wager in Vault Credits.', 'Drag the slider to choose a target between 2 and 98, and toggle roll over or under.', 'Press Roll. A number from 0.00 to 100.00 is generated; land in the green zone to win.', 'Payout equals wager × multiplier.'],
        fairness: 'Each roll is independent. The multiplier is 99 ÷ win chance, which builds in a 1% house edge for the demo.',
        odds: <div className="grid grid-cols-3 gap-2 num text-xs">{[10, 25, 50, 75, 90].flatMap((c) => [<span key={c + 'a'}>{c}% chance</span>, <span key={c + 'b'} className="text-snow">{(99 / c).toFixed(4)}×</span>, <span key={c + 'c'} className="text-right">RTP 99%</span>])}</div>,
      }}
    />
  )
}
