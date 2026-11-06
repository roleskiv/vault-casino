import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Gift, ShieldCheck, Sparkles, Volume2, VolumeX, Wallet, Dices, Crown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn, fmt, rand } from '../lib/format'
import { sfx } from '../lib/sfx'
import { DAILY_MS, useStore } from '../store'
import { AnimatedNumber, Button, Modal } from './ui'

/* ---------------------------------------------------------------- sound toggle */

export function SoundButton({ className }: { className?: string }) {
  const { settings, updateSettings } = useStore()
  const on = settings.sounds
  return (
    <button
      onClick={() => { updateSettings({ sounds: !on }); if (!on) setTimeout(() => sfx('click'), 0) }}
      aria-label={on ? 'Mute sounds' : 'Turn sounds on'} aria-pressed={on} title={on ? 'Sounds on' : 'Sounds off'}
      className={cn('grid h-9 w-9 place-items-center rounded-lg border border-steel bg-coal transition-colors', on ? 'text-gold' : 'text-silver hover:text-snow', className)}>
      {on ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  )
}

/* ---------------------------------------------------------------- big win */

const tierLabel = (m: number) => (m >= 100 ? 'Mega win' : m >= 50 ? 'Huge win' : 'Big win')

export function BigWin() {
  const { celebration, clearCelebration } = useStore()
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!celebration) return
    const t = setTimeout(clearCelebration, 3200)
    return () => clearTimeout(t)
  }, [celebration, clearCelebration])
  const bits = useMemo(() => Array.from({ length: 34 }, (_, i) => ({
    i, x: rand() * 100, d: 1.4 + rand() * 1.2, delay: rand() * 0.5, s: 8 + rand() * 12, r: rand() * 720 - 360, coin: i % 3 !== 0,
  })), [celebration?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <AnimatePresence>
      {celebration && (
        <motion.div key={celebration.id} onClick={clearCelebration} className="fixed inset-0 z-[90] grid place-items-center overflow-hidden cursor-pointer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} role="status" aria-live="polite">
          <div className="absolute inset-0 bg-ink/85 backdrop-blur-md" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(212,175,55,0.18),transparent_55%)]" />
          {!reduce && bits.map((b) => (
            <motion.span key={b.i} className="absolute top-0 block" style={{ left: `${b.x}%`, width: b.s, height: b.coin ? b.s : b.s * 0.45 }}
              initial={{ y: -40, rotate: 0, opacity: 1 }} animate={{ y: '110vh', rotate: b.r, opacity: [1, 1, 0.6] }} transition={{ duration: b.d, delay: b.delay, ease: 'easeIn' }}>
              <span className={cn('block h-full w-full', b.coin ? 'rounded-full border border-[#8a6a17] bg-[radial-gradient(circle_at_35%_30%,#FBE7A1,#D4AF37_55%,#8a6a17)]' : 'rounded-sm bg-gold-bright/80')} />
            </motion.span>
          ))}
          <motion.div className="relative text-center px-6" initial={{ scale: 0.6, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
            {!reduce && <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -ml-[210px] -mt-[210px]"><motion.div className="h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.35),transparent_65%)]"
              animate={{ scale: [0.9, 1.08, 0.9] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} /></div>}
            <div className="label text-gold-bright">{celebration.game}</div>
            <div className="mt-2 font-display text-5xl sm:text-7xl font-extrabold uppercase tracking-tight gold-text drop-shadow-[0_6px_30px_rgba(212,175,55,0.45)]">{tierLabel(celebration.multiplier)}</div>
            <div className="mt-3 num text-2xl sm:text-3xl font-bold text-snow">{celebration.multiplier.toFixed(2)}×</div>
            <div className="mt-2 num text-lg text-emerald">+<AnimatedNumber value={celebration.payout} /> VC</div>
            <div className="mt-5 text-[11px] text-silver">Demo credits only · no cash value · tap to continue</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---------------------------------------------------------------- daily spin */

export const DAILY_PRIZES = [250, 100, 500, 150, 1000, 200, 300, 2500]
const PRIZE_COLORS = ['#8a7430', '#262b33', '#D4AF37', '#2f3640', '#e8794a', '#262b33', '#9FB4C2', '#E5484D']

export function useDailySpin() {
  const { lastDailySpin } = useStore()
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  const left = Math.max(0, lastDailySpin + DAILY_MS - now)
  return { ready: left === 0, left }
}

const hms = (ms: number) => {
  const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`
}

export function DailySpinButton({ className }: { className?: string }) {
  const { openModal, loggedIn } = useStore()
  const { ready } = useDailySpin()
  if (!loggedIn) return null
  return (
    <button onClick={() => openModal('daily')} aria-label="Daily free spin" title="Daily free spin"
      className={cn('relative grid h-10 w-10 place-items-center rounded-lg border bg-coal transition-colors', ready ? 'border-gold/50 text-gold' : 'border-steel text-silver hover:text-snow', className)}>
      <Gift className={cn('h-4 w-4', ready && 'animate-[wiggle_2.4s_ease-in-out_infinite]')} />
      {ready && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald ring-2 ring-coal" />}
    </button>
  )
}

export function DailySpinModal() {
  const { modal, openModal, claimDailySpin } = useStore()
  const { ready, left } = useDailySpin()
  const [rot, setRot] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [won, setWon] = useState<number | null>(null)
  const open = modal === 'daily'
  useEffect(() => { if (open) setWon(null) }, [open])
  const n = DAILY_PRIZES.length, seg = 360 / n, R = 120, C = 130
  const spin = () => {
    if (!ready || spinning) return
    const idx = Math.floor(rand() * n)
    const target = rot - (rot % 360) + 360 * 6 + (360 - (idx + 0.5) * seg)
    setSpinning(true); setRot(target); sfx('spin')
    const ticks = setInterval(() => sfx('tick'), 90)
    setTimeout(() => {
      clearInterval(ticks)
      setSpinning(false); setWon(DAILY_PRIZES[idx]); claimDailySpin(DAILY_PRIZES[idx]); sfx('win')
    }, 3600)
  }
  const arc = (i: number) => {
    const a0 = ((i * seg - 90) * Math.PI) / 180, a1 = (((i + 1) * seg - 90) * Math.PI) / 180
    const p = (a: number, r: number) => `${C + Math.cos(a) * r} ${C + Math.sin(a) * r}`
    return `M${C} ${C} L${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} Z`
  }
  return (
    <Modal open={open} onClose={() => !spinning && openModal(null)} title="Daily free spin">
      <p className="mt-1.5 text-sm text-silver">One free spin every 24 hours. Prizes are fictional Vault Credits.</p>
      <div className="relative mx-auto mt-5 w-full max-w-[280px]">
        <svg viewBox="0 0 260 260" className="w-full">
          <defs><linearGradient id="ds-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FBE7A1" /><stop offset=".5" stopColor="#D4AF37" /><stop offset="1" stopColor="#7a5f14" /></linearGradient></defs>
          <circle cx={C} cy={C} r={R + 8} fill="#0b0d10" stroke="url(#ds-rim)" strokeWidth="4" />
          <motion.g style={{ originX: '130px', originY: '130px' }} animate={{ rotate: rot }} transition={{ duration: 3.5, ease: [0.12, 0.8, 0.2, 1] }}>
            {DAILY_PRIZES.map((v, i) => {
              const a = ((i + 0.5) * seg - 90) * (Math.PI / 180)
              return (
                <g key={i}>
                  <path d={arc(i)} fill={PRIZE_COLORS[i]} stroke="#0b0d10" strokeWidth="2" />
                  <text x={C + Math.cos(a) * 80} y={C + Math.sin(a) * 80} fill={['#262b33', '#2f3640'].includes(PRIZE_COLORS[i]) ? '#F7F7F8' : '#0b0d10'} fontSize="15" fontWeight="700" textAnchor="middle" dominantBaseline="middle"
                    transform={`rotate(${(i + 0.5) * seg} ${C + Math.cos(a) * 80} ${C + Math.sin(a) * 80})`} fontFamily="JetBrains Mono, monospace">{v >= 1000 ? `${v / 1000}K` : v}</text>
                </g>
              )
            })}
          </motion.g>
          <circle cx={C} cy={C} r="30" fill="#13161C" stroke="url(#ds-rim)" strokeWidth="3" />
          <text x={C} y={C + 1} fill="#D4AF37" fontSize="12" fontWeight="800" textAnchor="middle" dominantBaseline="middle" fontFamily="Sora, sans-serif">VC</text>
          <path d={`M${C} ${C - R + 10} L${C - 11} ${C - R - 14} L${C + 11} ${C - R - 14} Z`} fill="#F7F7F8" stroke="#0b0d10" strokeWidth="2" />
        </svg>
      </div>
      <div className="mt-4 min-h-[56px] text-center">
        <AnimatePresence mode="wait">
          {won !== null ? (
            <motion.div key="won" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div className="num font-display text-3xl font-bold gold-text">+{fmt(won, 0)} VC</div>
              <div className="text-xs text-silver mt-1">Added to your demo balance</div>
            </motion.div>
          ) : !ready ? (
            <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-silver">Next free spin in <span className="num text-snow">{hms(left)}</span></motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      {won !== null || !ready
        ? <Button variant="dark" size="lg" className="mt-2 w-full" onClick={() => openModal(null)}>Close</Button>
        : <Button variant="gold" size="lg" className="mt-2 w-full" onClick={spin} loading={spinning}>Spin for free</Button>}
      <div className="mt-3 flex justify-center gap-x-3 gap-y-1 flex-wrap text-[11px] text-silver num">
        {[...DAILY_PRIZES].sort((a, b) => a - b).map((v) => <span key={v}>{fmt(v, 0)} · 12.5%</span>)}
      </div>
    </Modal>
  )
}

/* ---------------------------------------------------------------- first-visit tour */

const STEPS = [
  { icon: Sparkles, title: 'Welcome to VAULT', body: 'A premium casino prototype. Explore ten in-house Originals, themed slots and a VIP club, all in demo mode.' },
  { icon: Wallet, title: 'Play with Vault Credits', body: 'Your balance is fictional and has no cash value. Top it up for free any time from the wallet in the header.' },
  { icon: Dices, title: 'Every game shows its odds', body: 'Each game has How to play, Odds and Fairness tabs with the RTP and the math behind every payout.' },
  { icon: Crown, title: 'Rewards and VIP', body: 'Wagering demo credits moves you through the VIP tiers. Claim a free daily spin from the gift icon.' },
  { icon: ShieldCheck, title: 'Stay in control', body: 'Set a wager limit and a session reminder in Settings, or turn sounds and motion down. Play is always optional.' },
]

export function Tour() {
  const { modal, openModal, tourDone, finishTour, loggedIn } = useStore()
  const nav = useNavigate()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (tourDone) return
    const t = setTimeout(() => openModal('tour'), 1500)
    return () => clearTimeout(t)
  }, [tourDone, openModal])
  useEffect(() => { if (modal === 'tour') setI(0) }, [modal])
  const s = STEPS[i], last = i === STEPS.length - 1
  return (
    <Modal open={modal === 'tour'} onClose={finishTour}>
      <div className="flex items-center gap-1.5">
        {STEPS.map((_, k) => <span key={k} className={cn('h-1 rounded-full transition-all duration-300', k === i ? 'w-6 bg-gold' : k < i ? 'w-3 bg-gold/50' : 'w-3 bg-steel')} />)}
        <span className="ml-auto mr-10 text-[11px] text-silver num">{i + 1}/{STEPS.length}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="mt-6">
          <span className="relative grid h-16 w-16 place-items-center rounded-2xl border border-gold/30 bg-[radial-gradient(circle_at_30%_25%,rgba(251,231,161,0.25),rgba(212,175,55,0.06))] text-gold-bright">
            <s.icon className="h-7 w-7" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold">{s.title}</h2>
          <p className="mt-2 text-sm text-silver leading-relaxed">{s.body}</p>
        </motion.div>
      </AnimatePresence>
      <div className="mt-7 flex items-center gap-2">
        {i > 0 ? <Button variant="ghost" onClick={() => setI(i - 1)}>Back</Button> : <Button variant="ghost" onClick={finishTour}>Skip</Button>}
        <div className="flex-1" />
        {last
          ? <Button variant="gold" onClick={() => { finishTour(); if (loggedIn) setTimeout(() => openModal('daily'), 250); else nav('/originals') }}>{loggedIn ? 'Claim free spin' : 'Browse Originals'}</Button>
          : <Button variant="gold" onClick={() => { setI(i + 1); sfx('click') }}>Next</Button>}
      </div>
    </Modal>
  )
}
