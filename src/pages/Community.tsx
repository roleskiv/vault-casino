import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Gift, Medal, Sparkles, Trophy, Users, Crown, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Countdown } from '../components/Countdown'
import { GameArt } from '../components/GameArt'
import { Avatar } from '../components/Layout'
import { Button, DemoPill, Segmented } from '../components/ui'
import { byId } from '../data/games'
import { cn, fmt } from '../lib/format'
import { NAMES } from '../lib/sim'
import { useStore } from '../store'
import { PageHeader } from './Browse'

const PROMOS = [
  { id: 'weekly', title: 'VAULT Weekly Challenge', tag: 'Weekly', game: 'vault-crash', hours: 52, body: 'Record the highest single-round cash-out in Vault Crash this week. The top 50 demo players share a pool of demo credits.', pool: '250,000 VC', icon: Trophy },
  { id: 'showcase', title: 'Originals Showcase', tag: 'Featured', game: 'vault-plinko', hours: 124, body: 'Play each playable Original at least once to unlock a one-time demo-credit reward and a profile badge.', pool: '5,000 VC', icon: Sparkles },
  { id: 'board', title: 'Demo Leaderboard Event', tag: 'Event', game: 'vault-mines', hours: 30, body: 'Ranked by total demo credits wagered across all Originals. Rankings refresh every few seconds.', pool: '100,000 VC', icon: Medal },
  { id: 'community', title: 'VAULT Community Tournament', tag: 'Tournament', game: 'vault-dice', hours: 200, body: 'A bracket-style Dice tournament for the community. Registration is open in this prototype.', pool: '500,000 VC', icon: Users },
]

function PromoCard({ p, i, big }: { p: (typeof PROMOS)[number]; i: number; big?: boolean }) {
  const g = byId(p.game)!
  const { claimed, toast } = useStore()
  const [joined, setJoined] = useState(claimed.includes(`join-${p.id}`))
  return (
    <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.05 }}
      className={cn('group relative overflow-hidden rounded-2xl border border-steel/70 bg-coal hover:border-gold/40 transition-colors', big && 'md:col-span-2')}>
      <div className={cn('grid', big ? 'md:grid-cols-[1.1fr_1fr]' : '')}>
        <div className={cn('relative overflow-hidden', big ? 'h-56 md:h-full' : 'h-44')}>
          <div className="absolute inset-0 scale-[1.15] transition-transform duration-500 group-hover:scale-[1.2]"><GameArt game={g} className="h-full w-full" /></div>
          <div className="absolute inset-0 bg-gradient-to-t from-coal via-coal/30 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-coal" />
          <span className="absolute left-4 top-4 rounded-md bg-ink/80 border border-gold/40 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-bright backdrop-blur">{p.tag}</span>
        </div>
        <div className="relative p-5 sm:p-6">
          <div className="flex items-center gap-2 text-gold"><p.icon className="h-4 w-4" /><span className="label">Ends in</span></div>
          <div className="mt-2"><Countdown hours={p.hours} /></div>
          <h3 className={cn('mt-4 font-display font-bold', big ? 'text-2xl' : 'text-xl')}>{p.title}</h3>
          <p className="mt-2 text-sm text-silver leading-relaxed">{p.body}</p>
          <div className="mt-4 flex items-center gap-4 text-xs text-silver">
            <span>Demo pool <span className="num text-snow font-semibold">{p.pool}</span></span>
            <span>Game <Link to={`/game/${g.id}`} className="text-snow hover:text-gold-bright">{g.name}</Link></span>
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant={joined ? 'dark' : 'gold'} onClick={() => { setJoined(true); toast({ title: joined ? 'Already joined' : `Joined ${p.title}`, body: 'Demo event · no real prizes.', tone: 'gold' }) }}>{joined ? 'Joined ✓' : 'Join event'}</Button>
            <Link to={`/game/${g.id}`}><Button variant="ghost">Play <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

export function PromotionsPage() {
  const [f, setF] = useState<'all' | 'events' | 'rewards'>('all')
  const list = f === 'all' ? PROMOS : f === 'events' ? PROMOS.filter((p) => p.tag !== 'Featured') : PROMOS.filter((p) => p.tag === 'Featured')
  return (
    <div>
      <PageHeader icon={<Gift className="h-4 w-4" />} title="Promotions" sub="Simulated events and challenges. All rewards are fictional Vault Credits with no monetary value." right={<DemoPill />} />
      <Segmented value={f} onChange={setF} className="mb-6 max-w-sm" options={[{ value: 'all', label: 'All' }, { value: 'events', label: 'Events' }, { value: 'rewards', label: 'Rewards' }]} />
      <div className="grid gap-5 md:grid-cols-2">{list.map((p, i) => <PromoCard key={p.id} p={p} i={i} big={i === 0} />)}</div>
    </div>
  )
}

function useLeaderboard(seed: number, n = 20) {
  const base = useMemo(() => {
    const names = [...NAMES].sort(() => Math.random() - 0.5).slice(0, n)
    return names.map((name, i) => ({ name, score: Math.round((seed * (n - i)) ** 1.2 + Math.random() * 1000), game: ['vault-crash', 'vault-mines', 'vault-plinko', 'vault-dice'][i % 4] }))
  }, [seed, n])
  const [rows, setRows] = useState(base)
  useEffect(() => { setRows(base) }, [base])
  useEffect(() => {
    const t = setInterval(() => {
      setRows((r) => {
        const c = r.map((x) => ({ ...x }))
        const k = Math.floor(Math.random() * c.length)
        c[k].score += Math.round(200 + Math.random() * seed * 4)
        return c.sort((a, b) => b.score - a.score)
      })
    }, 1600)
    return () => clearInterval(t)
  }, [seed])
  return rows
}

const PODIUM = ['#F5D778', '#C9CED6', '#D9A06B']

type LbRow = ReturnType<typeof useLeaderboard>[number]
export function LeaderboardTable({ seed = 400, title, unit = 'VC wagered', rows: given }: { seed?: number; title?: string; unit?: string; rows?: LbRow[] }) {
  const own = useLeaderboard(seed)
  const rows = given ?? own
  return (
    <div className="panel overflow-hidden">
      {title && <div className="flex items-center justify-between px-5 h-12 border-b border-steel/70"><span className="font-semibold text-sm">{title}</span><span className="text-[11px] text-silver uppercase tracking-wider">Simulated · updates live</span></div>}
      <div>
        <AnimatePresence initial={false}>
          {rows.map((r, i) => (
            <motion.div key={r.name} layout transition={{ duration: 0.3 }} className={cn('flex items-center gap-3 px-4 sm:px-5 h-12 border-b border-steel/40 last:border-0 text-sm', i < 3 && 'bg-gold/[0.03]')}>
              <span className="num w-7 text-center font-semibold" style={{ color: PODIUM[i] ?? '#9299A5' }}>{i + 1}</span>
              <Avatar name={r.name} size={26} />
              <span className="flex-1 truncate font-medium">{r.name}</span>
              <span className="hidden sm:block text-xs text-silver w-28 truncate">{byId(r.game)!.name}</span>
              <span className={cn('num text-right w-32', i < 3 ? 'text-gold-bright' : 'text-snow/90')}>{fmt(r.score, 0)}<span className="ml-1 text-[10px] text-silver font-sans">{unit}</span></span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function LeaderboardsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const seed = period === 'daily' ? 120 : period === 'weekly' ? 400 : 1200
  const top = useLeaderboard(seed)
  return (
    <div>
      <PageHeader icon={<Medal className="h-4 w-4" />} title="Leaderboards" sub="Rankings use fictional players and simulated demo-credit activity. They do not represent real customers." right={<Segmented value={period} onChange={setPeriod} className="w-[280px]" options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]} />} />
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-5 items-end">
        {[1, 0, 2].map((pos) => {
          const r = top[pos]
          if (!r) return <div key={pos} />
          return (
            <motion.div key={pos} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * pos }}
              className={cn('panel relative text-center p-4 sm:p-6 overflow-hidden', pos === 0 ? 'pb-8 sm:pb-12 border-gold/40' : '')}>
              <div className="absolute inset-x-0 top-0 h-24 opacity-60" style={{ background: `radial-gradient(ellipse at 50% 0%, ${PODIUM[pos]}33, transparent 70%)` }} />
              <div className="relative mx-auto w-fit"><Avatar name={r.name} size={pos === 0 ? 64 : 48} />{pos === 0 && <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 h-5 w-5 text-gold" />}</div>
              <div className="relative mt-3 text-sm font-semibold truncate">{r.name}</div>
              <div className="relative num mt-1 text-xs sm:text-sm" style={{ color: PODIUM[pos] }}>{fmt(r.score, 0)} VC</div>
              <div className="relative mt-2 label">#{pos + 1}</div>
            </motion.div>
          )
        })}
      </div>
      <LeaderboardTable rows={top} title={`${period[0].toUpperCase()}${period.slice(1)} wagered ranking`} />
    </div>
  )
}

const TOURNEYS = [
  { id: 't1', name: 'Crash Masters', game: 'vault-crash', status: 'Live', hours: 18, entrants: 1284, pool: '150,000 VC', format: 'Highest single multiplier' },
  { id: 't2', name: 'Mines Marathon', game: 'vault-mines', status: 'Live', hours: 40, entrants: 812, pool: '80,000 VC', format: 'Most gems revealed' },
  { id: 't3', name: 'Plinko Drop Cup', game: 'vault-plinko', status: 'Upcoming', hours: 70, entrants: 0, pool: '60,000 VC', format: 'Best 10-ball streak' },
  { id: 't4', name: 'Dice Duel Series', game: 'vault-dice', status: 'Upcoming', hours: 150, entrants: 0, pool: '200,000 VC', format: 'Bracket · best of 25' },
]

export function TournamentsPage() {
  const { toast } = useStore()
  const [reg, setReg] = useState<string[]>([])
  return (
    <div>
      <PageHeader icon={<Trophy className="h-4 w-4" />} title="Tournaments" sub="Scheduled demo competitions on VAULT Originals. Entrants and prize pools are simulated." right={<DemoPill />} />
      <div className="grid gap-5 lg:grid-cols-2">
        {TOURNEYS.map((t, i) => {
          const g = byId(t.game)!
          const on = reg.includes(t.id)
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="panel p-5 flex gap-5 hover:border-gold/40 transition-colors">
              <div className="h-[140px] w-[105px] shrink-0 overflow-hidden rounded-xl border border-steel"><GameArt game={g} className="h-full w-full" /></div>
              <div className="min-w-0 flex-1 flex flex-col">
                <div className="flex items-center gap-2">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', t.status === 'Live' ? 'bg-emerald/10 text-emerald' : 'bg-white/5 text-silver')}>
                    {t.status === 'Live' ? <span className="h-1.5 w-1.5 rounded-full bg-emerald" /> : <CalendarDays className="h-3 w-3" />}{t.status}
                  </span>
                  <span className="text-xs text-silver">{t.format}</span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold">{t.name}</h3>
                <div className="mt-1 flex gap-4 text-xs text-silver"><span>Pool <span className="num text-snow">{t.pool}</span></span><span><span className="num text-snow">{(t.entrants + (on ? 1 : 0)).toLocaleString()}</span> entrants</span></div>
                <div className="mt-3 flex items-center gap-2 text-xs text-silver"><Zap className="h-3.5 w-3.5 text-gold" />{t.status === 'Live' ? 'Ends in' : 'Starts in'}<Countdown hours={t.hours} compact /></div>
                <div className="mt-auto pt-4 flex gap-2">
                  <Button size="sm" variant={on ? 'dark' : 'gold'} onClick={() => { setReg((r) => (on ? r.filter((x) => x !== t.id) : [...r, t.id])); toast({ title: on ? 'Registration cancelled' : `Registered for ${t.name}`, body: 'Demo tournament · no real prizes.', tone: on ? 'info' : 'gold' }) }}>{on ? 'Registered ✓' : 'Register'}</Button>
                  <Link to={`/game/${g.id}`}><Button size="sm" variant="ghost">Practice</Button></Link>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
      <div className="mt-10"><LeaderboardTable seed={300} title="Crash Masters · live standings" unit="pts" /></div>
    </div>
  )
}
