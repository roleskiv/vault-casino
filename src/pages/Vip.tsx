import { motion } from 'framer-motion'
import { Check, Crown, Lock, Gift, Percent, Headphones, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { TierEmblem } from '../components/TierEmblem'
import { Button, DemoPill } from '../components/ui'
import { TIERS, tierFor, type Tier } from '../data/vip'
import { cn, compact, fmt } from '../lib/format'
import { useStore } from '../store'
import { Link } from 'react-router-dom'

function TierCard({ t, idx, current }: { t: Tier; idx: number; current: number }) {
  const obs = t.id === 'obsidian'
  const unlocked = idx <= current
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05, duration: 0.25 }} whileHover={{ y: -4 }}
      className={cn('relative overflow-hidden rounded-2xl border p-5 flex flex-col',
        obs ? 'border-gold/50 bg-[linear-gradient(160deg,#20242b_0%,#0b0c0f_45%,#000_100%)]' : 'border-steel/70 bg-coal',
        idx === current && !obs && 'border-gold/60 ring-1 ring-gold/30')}>
      {obs && <div className="pointer-events-none absolute inset-0 opacity-60 [background:repeating-linear-gradient(115deg,transparent_0_14px,rgba(255,255,255,0.025)_14px_15px)]" />}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl" style={{ background: `${t.colors[1]}22` }} />
      <div className="relative flex items-start justify-between">
        <TierEmblem tier={t} size={64} locked={!unlocked && !obs} />
        {idx === current ? <span className="rounded-md bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">Current</span>
          : !unlocked ? <Lock className="h-4 w-4 text-silver" /> : <Check className="h-4 w-4 text-emerald" />}
      </div>
      <div className="relative mt-4">
        <div className="label">Tier {idx + 1}</div>
        <h3 className={cn('mt-1 font-display text-xl font-bold', obs && 'gold-text')}>{t.name}</h3>
        <div className="mt-1 text-xs text-silver">From <span className="num text-snow">{compact(t.min)}</span> VC wagered</div>
      </div>
      <ul className="relative mt-4 space-y-2 text-sm text-silver flex-1">
        <li className="flex gap-2"><Percent className="h-4 w-4 text-gold shrink-0 mt-0.5" /><span><span className="text-snow">{t.rakeback}%</span> demo rakeback</span></li>
        {t.perks.map((p) => <li key={p} className="flex gap-2"><Check className="h-4 w-4 text-gold shrink-0 mt-0.5" />{p}</li>)}
      </ul>
    </motion.div>
  )
}

export default function VipPage() {
  const { wagered, username, claimReward, claimed } = useStore()
  const { index, tier, next, progress } = tierFor(wagered)
  const data = useMemo(() => {
    let v = Math.max(0, wagered - 60000)
    return Array.from({ length: 30 }, (_, i) => {
      v += i === 29 ? 0 : Math.random() * 3500
      return { d: `D${i + 1}`, v: i === 29 ? wagered : Math.round(v) }
    })
  }, [wagered])

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-gold/25 bg-[linear-gradient(135deg,#16181d_0%,#0b0c0f_55%,#000_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_20%,rgba(245,215,120,0.14),transparent_50%)]" />
        <div className="absolute inset-0 opacity-50 [background:repeating-linear-gradient(115deg,transparent_0_22px,rgba(212,175,55,0.035)_22px_23px)]" />
        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[auto_1fr_auto] items-center">
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="mx-auto"><TierEmblem tier={tier} size={140} /></motion.div>
          <div>
            <div className="flex items-center gap-2"><Crown className="h-4 w-4 text-gold" /><span className="label text-gold-bright">VAULT VIP Club</span></div>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold tracking-tight">{username}, you are <span className="gold-text">{tier.name}</span></h1>
            <p className="mt-2 text-sm text-silver max-w-lg">Progress is based on total demo credits wagered. All VIP rewards are paid in fictional Vault Credits with no monetary value.</p>
            <div className="mt-6 max-w-xl">
              <div className="flex justify-between text-xs text-silver mb-2"><span>{tier.name}</span><span className="num">{next ? `${fmt(wagered, 0)} / ${fmt(next.min, 0)} VC` : 'Maximum tier'}</span><span>{next?.name ?? ''}</span></div>
              <div className="relative h-3 rounded-full bg-ink border border-steel overflow-hidden">
                <motion.div className="absolute inset-y-0 left-0 gold-fill rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.max(2, progress * 100)}%` }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} />
              </div>
              <div className="mt-2 text-xs text-silver">{next ? <><span className="num text-snow">{fmt(next.min - wagered, 0)} VC</span> more demo wagering to reach {next.name}</> : 'You have reached Obsidian.'}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2 lg:w-56">
            <DemoPill className="self-start lg:self-stretch justify-center" />
            <Button variant="gold" disabled={claimed.includes('vip-weekly')} onClick={() => claimReward('vip-weekly', 1500, 'VIP weekly demo bonus')}><Gift className="h-4 w-4" />{claimed.includes('vip-weekly') ? 'Weekly bonus claimed' : 'Claim weekly bonus'}</Button>
            <Link to="/rewards"><Button variant="dark" className="w-full">View all rewards</Button></Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold mb-4">Tiers</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{TIERS.map((t, i) => <TierCard key={t.id} t={t} idx={i} current={index} />)}</div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Wagering progress · 30 days</h3><span className="text-[11px] text-silver uppercase tracking-wider">Demo data</span></div>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
                <defs><linearGradient id="vipg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D4AF37" stopOpacity={0.35} /><stop offset="1" stopColor="#D4AF37" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#2A3039" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: '#9299A5', fontSize: 11 }} axisLine={false} tickLine={false} interval={5} />
                <YAxis tick={{ fill: '#9299A5', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => compact(v)} />
                <Tooltip contentStyle={{ background: '#13161C', border: '1px solid #2A3039', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#9299A5' }} formatter={(v: number) => [`${fmt(v, 0)} VC`, 'Wagered']} />
                <Area type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={2} fill="url(#vipg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-5 sm:p-6">
          <h3 className="font-semibold">Your {tier.name} benefits</h3>
          <div className="mt-4 space-y-3">
            {[{ i: Percent, t: `${tier.rakeback}% demo rakeback`, s: 'Returned weekly as Vault Credits' }, { i: Gift, t: 'Level-up rewards', s: 'Paid on reaching each tier' }, { i: Headphones, t: 'Priority support (mock)', s: 'Shown for demonstration' }, { i: Sparkles, t: 'Originals early access', s: 'Diamond and above' }].map((b) => (
              <div key={b.t} className="flex items-center gap-3 rounded-xl border border-steel bg-ink p-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold/10 text-gold"><b.i className="h-4 w-4" /></span>
                <div><div className="text-sm font-medium">{b.t}</div><div className="text-xs text-silver">{b.s}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
