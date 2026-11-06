import { motion } from 'framer-motion'
import { Award, BarChart3, CalendarClock, Clock, Gift, Heart, History, Percent, RotateCcw, Settings as Cog, ShieldCheck, Star, Ticket, TrendingUp, User, Wallet, HeartHandshake, Timer, Ban, Scale } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { Shelf } from '../components/GameCard'
import { Avatar } from '../components/Layout'
import { useDailySpin } from '../components/Polish'
import { TierEmblem } from '../components/TierEmblem'
import { AnimatedNumber, Button, DemoPill, Segmented, Toggle } from '../components/ui'
import { byId, GAMES } from '../data/games'
import { tierFor } from '../data/vip'
import { cn, fmt, timeAgo } from '../lib/format'
import { useStore } from '../store'
import { PageHeader } from './Browse'

function StatTile({ icon: I, label, value, sub }: { icon: typeof User; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="panel p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs text-silver"><I className="h-4 w-4 text-gold" />{label}</div>
      <div className="mt-2 num text-xl font-semibold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-silver">{sub}</div>}
    </div>
  )
}

function BetTable({ limit }: { limit?: number }) {
  const { bets } = useStore()
  const rows = limit ? bets.slice(0, limit) : bets
  if (!rows.length) return <div className="panel py-12 text-center text-sm text-silver">No demo rounds yet. <Link to="/originals" className="text-gold-bright hover:underline">Play an Original</Link></div>
  return (
    <div className="panel overflow-hidden">
      <div className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr_0.8fr_1fr] gap-3 px-5 h-10 items-center label border-b border-steel/70"><span>Game</span><span className="hidden sm:block">Time</span><span className="text-right">Wager</span><span className="text-right">Multi</span><span className="text-right">Result</span></div>
      {rows.map((b) => (
        <div key={b.id} className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr_0.8fr_1fr] gap-3 px-5 h-11 items-center text-sm border-b border-steel/40 last:border-0">
          <Link to={`/game/${b.gameId}`} className="truncate hover:text-gold-bright">{b.game}</Link>
          <span className="hidden sm:block text-xs text-silver">{timeAgo(b.time)}</span>
          <span className="num text-right">{fmt(b.wager)}</span>
          <span className="num text-right">{b.multiplier.toFixed(2)}×</span>
          <span className={cn('num text-right', b.payout > 0 ? 'text-emerald' : 'text-silver')}>{b.payout > 0 ? `+${fmt(b.payout)}` : `-${fmt(b.wager)}`}</span>
        </div>
      ))}
    </div>
  )
}

export function ProfilePage() {
  const { username, balance, wagered, bets, favorites, loggedIn, openModal } = useStore()
  const { tier, next, progress } = tierFor(wagered)
  const stats = useMemo(() => {
    const net = bets.reduce((s, b) => s + b.payout - b.wager, 0)
    const best = bets.reduce((m, b) => Math.max(m, b.multiplier), 0)
    const wins = bets.filter((b) => b.payout > b.wager).length
    const byGame: Record<string, number> = {}
    bets.forEach((b) => { byGame[b.game] = (byGame[b.game] ?? 0) + 1 })
    const chart = Object.entries(byGame).map(([name, n]) => ({ name: name.replace('Vault ', ''), n })).sort((a, b) => b.n - a.n).slice(0, 6)
    return { net, best, wins, chart }
  }, [bets])
  const favs = favorites.map((f) => byId(f)).filter(Boolean) as typeof GAMES
  if (!loggedIn) return <div className="panel py-20 text-center"><User className="mx-auto h-8 w-8 text-steel" /><p className="mt-3 text-silver">Log in to view your demo profile.</p><Button variant="gold" className="mt-5" onClick={() => openModal('login')}>Log in</Button></div>

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-steel/70 bg-coal p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(212,175,55,0.12),transparent_55%)]" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <Avatar name={username} size={88} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-2xl sm:text-3xl font-extrabold">{username}</h1><DemoPill /></div>
            <div className="mt-1 text-sm text-silver">Member since March 2026 · Demo account</div>
            <div className="mt-4 flex items-center gap-3 max-w-md">
              <TierEmblem tier={tier} size={40} />
              <div className="flex-1">
                <div className="flex justify-between text-xs"><span className="font-semibold">{tier.name}</span><span className="text-silver">{next ? `${Math.round(progress * 100)}% to ${next.name}` : 'Top tier'}</span></div>
                <div className="mt-1.5 h-2 rounded-full bg-ink overflow-hidden border border-steel"><motion.div className="h-full gold-fill" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.8 }} /></div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-steel bg-ink p-4 md:w-60">
            <div className="text-xs text-silver flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-gold" />Demo balance</div>
            <div className="mt-1 text-2xl font-semibold"><AnimatedNumber value={balance} /> <span className="text-sm text-gold font-bold">VC</span></div>
            <div className="mt-1 text-[11px] text-silver">Non-redeemable · no cash value</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile icon={History} label="Rounds played" value={bets.length.toLocaleString()} sub={`${stats.wins} profitable`} />
        <StatTile icon={TrendingUp} label="Total wagered" value={`${fmt(wagered, 0)}`} sub="VC, lifetime (demo)" />
        <StatTile icon={Star} label="Best multiplier" value={`${stats.best.toFixed(2)}×`} sub="This session" />
        <StatTile icon={BarChart3} label="Session net" value={<span className={stats.net >= 0 ? 'text-emerald' : 'text-snow'}>{stats.net >= 0 ? '+' : ''}{fmt(stats.net)}</span>} sub="VC" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-center justify-between mb-4"><h2 className="font-display text-lg font-bold">Game history</h2><Link to="/transactions" className="text-xs text-silver hover:text-snow">All transactions →</Link></div>
          <BetTable limit={8} />
        </div>
        <div className="space-y-6">
          <div className="panel p-5">
            <h3 className="font-semibold text-sm">Rounds by game</h3>
            <div className="mt-3 h-[180px]">
              {stats.chart.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chart} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={90} tick={{ fill: '#9299A5', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: '#13161C', border: '1px solid #2A3039', borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="n" radius={[0, 4, 4, 0]} barSize={14}>{stats.chart.map((_, i) => <Cell key={i} fill={i === 0 ? '#D4AF37' : '#5a4a1c'} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="grid h-full place-items-center text-xs text-silver">Play a few rounds to see your breakdown.</div>}
            </div>
          </div>
          <Link to="/responsible-gaming" className="panel p-5 flex gap-3 hover:border-gold/40 transition-colors">
            <ShieldCheck className="h-5 w-5 text-gold shrink-0" />
            <div><div className="font-semibold text-sm">Responsible gaming</div><div className="text-xs text-silver mt-1">Set wager limits and session reminders, or read guidance on keeping play healthy.</div></div>
          </Link>
        </div>
      </div>

      {favs.length > 0 && <Shelf title="Favourite games" icon={<Heart className="h-[18px] w-[18px]" />} games={favs} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/rewards" className="panel p-5 hover:border-gold/40 transition-colors"><Gift className="h-5 w-5 text-gold" /><div className="mt-3 font-semibold">Rewards</div><div className="text-xs text-silver mt-1">Daily chest, rakeback and codes</div></Link>
        <Link to="/vip" className="panel p-5 hover:border-gold/40 transition-colors"><Award className="h-5 w-5 text-gold" /><div className="mt-3 font-semibold">VIP progression</div><div className="text-xs text-silver mt-1">See every tier and benefit</div></Link>
        <Link to="/settings" className="panel p-5 hover:border-gold/40 transition-colors"><Cog className="h-5 w-5 text-gold" /><div className="mt-3 font-semibold">Settings</div><div className="text-xs text-silver mt-1">Display, privacy and limits</div></Link>
      </div>
    </div>
  )
}

export function RewardsPage() {
  const { claimed, claimReward, toast, wagered, openModal } = useStore()
  const daily = useDailySpin()
  const [code, setCode] = useState('')
  const { tier } = tierFor(wagered)
  const items = [
    { id: 'daily', icon: Gift, title: 'Daily chest', body: 'A small demo-credit top-up, once per day.', amount: 250 },
    { id: 'rakeback', icon: Percent, title: `${tier.rakeback}% rakeback`, body: 'Demo rakeback accrued from recent play.', amount: Math.round(wagered * 0.0005 * tier.rakeback) / 1 },
    { id: 'levelup', icon: Award, title: `${tier.name} level-up bonus`, body: 'One-time reward for reaching your current tier.', amount: 2500 },
    { id: 'weekly', icon: CalendarClock, title: 'Weekly reload', body: 'Available every Monday in the demo.', amount: 1000 },
  ]
  return (
    <div>
      <PageHeader icon={<Gift className="h-4 w-4" />} title="Rewards" sub="Everything here pays out in fictional Vault Credits. They cannot be withdrawn or exchanged." right={<DemoPill />} />
      <button onClick={() => openModal('daily')} className="group mb-6 flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-gold/35 bg-[radial-gradient(ellipse_at_0%_50%,rgba(212,175,55,0.16),transparent_60%)] p-5 text-left hover:border-gold/60 transition-colors">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-gold/60 bg-[conic-gradient(#D4AF37_0_45deg,#262b33_45deg_90deg,#8a7430_90deg_135deg,#262b33_135deg_180deg,#D4AF37_180deg_225deg,#262b33_225deg_270deg,#E5484D_270deg_315deg,#262b33_315deg)] transition-transform duration-500 group-hover:rotate-45"><span className="h-5 w-5 rounded-full bg-coal border border-gold/60" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-bold">Daily free spin</span>
          <span className="block text-sm text-silver">{daily.ready ? 'Ready now. Win up to 2,500 demo VC.' : 'Already spun today. Come back tomorrow.'}</span>
        </span>
        <span className={cn('shrink-0 rounded-lg px-3.5 h-9 inline-flex items-center text-sm font-semibold', daily.ready ? 'gold-fill text-ink' : 'border border-steel text-silver')}>{daily.ready ? 'Spin' : 'View'}</span>
      </button>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((r, i) => {
          const done = claimed.includes(r.id)
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={cn('panel p-5 flex flex-col', !done && 'hover:border-gold/40 transition-colors')}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold/10 text-gold"><r.icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-semibold">{r.title}</h3>
              <p className="mt-1 text-sm text-silver flex-1">{r.body}</p>
              <div className="mt-4 num text-lg font-semibold">{fmt(r.amount, 0)} <span className="text-xs text-gold font-sans font-bold">VC</span></div>
              <Button className="mt-3 w-full" variant={done ? 'dark' : 'gold'} disabled={done} onClick={() => claimReward(r.id, r.amount, r.title)}>{done ? 'Claimed' : 'Claim'}</Button>
            </motion.div>
          )
        })}
      </div>
      <div className="mt-8 panel p-5 sm:p-6 max-w-xl">
        <div className="flex items-center gap-2 font-semibold"><Ticket className="h-4 w-4 text-gold" />Redeem a demo code</div>
        <p className="mt-1 text-sm text-silver">Try <span className="num text-snow">VAULT2026</span>.</p>
        <div className="mt-4 flex gap-2">
          <input className="input h-11 uppercase num" placeholder="Enter code" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button variant="gold" size="lg" onClick={() => {
            if (code.trim().toUpperCase() === 'VAULT2026' && !claimed.includes('code-vault2026')) { claimReward('code-vault2026', 2026, 'Code VAULT2026'); setCode('') }
            else toast({ title: claimed.includes('code-vault2026') && code.trim().toUpperCase() === 'VAULT2026' ? 'Code already used' : 'Code not recognised', tone: 'warn' })
          }}>Redeem</Button>
        </div>
      </div>
    </div>
  )
}

export function TransactionsPage() {
  const { txns } = useStore()
  const [f, setF] = useState<'all' | 'credit' | 'wager' | 'payout' | 'reward'>('all')
  const rows = f === 'all' ? txns : txns.filter((t) => t.type === f)
  const label = { credit: 'Demo credits', wager: 'Wager', payout: 'Payout', reward: 'Reward' }
  return (
    <div>
      <PageHeader icon={<History className="h-4 w-4" />} title="Transaction History" sub="A ledger of demo-credit movements. No real deposits or withdrawals exist on VAULT." right={<DemoPill />} />
      <Segmented value={f} onChange={setF} className="mb-5 max-w-xl" options={[{ value: 'all', label: 'All' }, { value: 'credit', label: 'Credits' }, { value: 'wager', label: 'Wagers' }, { value: 'payout', label: 'Payouts' }, { value: 'reward', label: 'Rewards' }]} />
      <div className="panel overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr] sm:grid-cols-[1fr_2fr_1fr_1fr] gap-3 px-5 h-10 items-center label border-b border-steel/70"><span>Type</span><span className="hidden sm:block">Detail</span><span className="hidden sm:block">Time</span><span className="text-right">Amount</span></div>
        {rows.length === 0 && <div className="py-12 text-center text-sm text-silver">No transactions of this type yet.</div>}
        {rows.slice(0, 100).map((t) => (
          <div key={t.id} className="grid grid-cols-[1fr_1fr] sm:grid-cols-[1fr_2fr_1fr_1fr] gap-3 px-5 h-12 items-center text-sm border-b border-steel/40 last:border-0">
            <span className="flex items-center gap-2"><span className={cn('h-2 w-2 rounded-full', t.type === 'wager' ? 'bg-silver' : t.type === 'payout' ? 'bg-emerald' : 'bg-gold')} />{label[t.type]}</span>
            <span className="hidden sm:block truncate text-silver">{t.note}</span>
            <span className="hidden sm:block text-xs text-silver">{timeAgo(t.time)}</span>
            <span className={cn('num text-right', t.amount >= 0 ? 'text-emerald' : 'text-snow/80')}>{t.amount >= 0 ? '+' : ''}{fmt(t.amount)} VC</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Row({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-6 py-4 border-b border-steel/50 last:border-0"><div><div className="text-sm font-medium">{title}</div><div className="text-xs text-silver mt-0.5">{sub}</div></div>{children}</div>
}

export function SettingsPage() {
  const { settings, updateSettings, resetDemo, username, openModal } = useStore()
  return (
    <div>
      <PageHeader icon={<Cog className="h-4 w-4" />} title="Settings" sub="Preferences are stored only in this browser." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5 sm:p-6">
          <h3 className="font-semibold">Account</h3>
          <Row title="Username" sub="Shown on demo leaderboards"><span className="text-sm text-silver">{username}</span></Row>
          <Row title="Hide balance" sub="Mask your wallet in the header"><Toggle checked={settings.hideBalance} onChange={(v) => updateSettings({ hideBalance: v })} label="Hide balance" /></Row>
          <Row title="Game sounds" sub="Bets, wins, reveals and spins"><Toggle checked={settings.sounds} onChange={(v) => updateSettings({ sounds: v })} label="Sounds" /></Row>
          <Row title="Reduce motion" sub="Minimise interface animation and win effects"><Toggle checked={settings.reduceMotion} onChange={(v) => updateSettings({ reduceMotion: v })} label="Reduce motion" /></Row>
          <Row title="Welcome tour" sub="A quick walkthrough of VAULT"><Button variant="dark" size="sm" onClick={() => openModal('tour')}>Replay tour</Button></Row>
        </div>
        <div className="panel p-5 sm:p-6">
          <h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" />Responsible gaming</h3>
          <Row title="Per-bet wager limit" sub="Bets above this amount are blocked">
            <select className="input w-36" value={settings.wagerLimit} onChange={(e) => updateSettings({ wagerLimit: +e.target.value })}>
              {[0, 50, 100, 500, 1000].map((v) => <option key={v} value={v}>{v ? `${v} VC` : 'No limit'}</option>)}
            </select>
          </Row>
          <Row title="Session reminder" sub="A gentle reminder of time spent">
            <select className="input w-36" value={settings.sessionReminder} onChange={(e) => updateSettings({ sessionReminder: +e.target.value })}>
              {[0, 15, 30, 60, 120].map((v) => <option key={v} value={v}>{v ? `${v} minutes` : 'Off'}</option>)}
            </select>
          </Row>
          <Row title="Reset demo" sub="Restore balance, history and settings"><Button variant="outline" size="sm" onClick={resetDemo}><RotateCcw className="h-3.5 w-3.5" />Reset</Button></Row>
        </div>
      </div>
    </div>
  )
}

export function ResponsiblePage() {
  const blocks = [
    { i: Timer, t: 'Set time limits', b: 'Decide in advance how long you want to play, and stop when that time is up. VAULT can remind you during a session.' },
    { i: Scale, t: 'Set spending limits', b: 'In a real product, deposit and loss limits would be available here. In this prototype you can cap the size of any single demo bet.' },
    { i: Ban, t: 'Take a break', b: 'Cool-off periods and self-exclusion would let players step away for a day, a week or longer.' },
    { i: HeartHandshake, t: 'Get support', b: 'If gaming stops being fun, talk to someone. A production platform would list local, independent support organisations here.' },
  ]
  return (
    <div>
      <PageHeader icon={<ShieldCheck className="h-4 w-4" />} title="Responsible gaming" sub="Gaming should be entertainment. These placeholders show where player-protection tools would live." right={<span className="inline-flex items-center gap-1.5 rounded-md border border-steel px-2.5 h-8 text-xs font-semibold text-silver"><span className="grid h-5 w-5 place-items-center rounded-full border border-silver/60 text-[9px]">18+</span> Adults only</span>} />
      <div className="grid gap-4 sm:grid-cols-2">
        {blocks.map((x) => (
          <div key={x.t} className="panel p-5 sm:p-6 flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold"><x.i className="h-5 w-5" /></span><div><h3 className="font-semibold">{x.t}</h3><p className="mt-1 text-sm text-silver leading-relaxed">{x.b}</p></div></div>
        ))}
      </div>
      <div id="fairness" className="mt-8 panel p-5 sm:p-6">
        <h3 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-gold" />About this prototype</h3>
        <ul className="mt-3 space-y-2 text-sm text-silver list-disc pl-5">
          <li>VAULT uses fictional Vault Credits (VC) only. VC cannot be bought, sold, withdrawn or exchanged for anything of value.</li>
          <li>There are no deposits, withdrawals, payments or cryptocurrency transfers.</li>
          <li>Activity feeds, leaderboards and player names are simulated in your browser and do not represent real people.</li>
          <li>Game outcomes are generated locally. Each Original shows its odds and the formula used.</li>
        </ul>
        <Link to="/settings" className="mt-5 inline-block"><Button variant="outline">Open limit settings</Button></Link>
      </div>
    </div>
  )
}

export function NotFound() {
  return (
    <div className="panel py-24 text-center">
      <div className="font-display text-6xl font-extrabold gold-text">404</div>
      <p className="mt-3 text-silver">This page is locked away somewhere else.</p>
      <Link to="/" className="mt-6 inline-block"><Button variant="gold">Back to lobby</Button></Link>
    </div>
  )
}
