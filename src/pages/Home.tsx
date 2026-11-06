import { motion } from 'framer-motion'
import { Crown, Flame, Gamepad2, Sparkles, Tv, Trophy, Zap, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ActivityTable } from '../components/Activity'
import { GameGrid, Shelf } from '../components/GameCard'
import { Hero } from '../components/Hero'
import { TierEmblem } from '../components/TierEmblem'
import { Countdown } from '../components/Countdown'
import { cn } from '../lib/format'
import { FEATURED, GAMES, LIVE, NEW_RELEASES, ORIGINALS, POPULAR, SLOTS } from '../data/games'
import { TIERS } from '../data/vip'
import { useFakeLoad } from '../lib/useFakeLoad'

const FILTERS = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'originals', label: 'Originals', icon: Sparkles },
  { id: 'slots', label: 'Slots', icon: Gamepad2 },
  { id: 'live', label: 'Live Casino', icon: Tv },
  { id: 'new', label: 'New', icon: Zap },
  { id: 'hot', label: 'Popular', icon: Flame },
] as const

export function PromoStrip() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Link to="/promotions" className="group relative overflow-hidden rounded-2xl border border-steel/70 bg-coal p-6 min-h-[180px] hover:border-gold/40 transition-colors">
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        <Trophy className="absolute right-6 bottom-6 h-24 w-24 text-gold/15 transition-transform duration-300 group-hover:scale-105" strokeWidth={1} />
        <div className="relative">
          <div className="label text-gold-bright">Weekly Challenge</div>
          <h3 className="mt-2 font-display text-2xl font-bold">Climb the Crash board</h3>
          <p className="mt-1.5 max-w-xs text-sm text-silver">Reach the highest single-round multiplier this week. Demo leaderboard, demo-credit rewards.</p>
          <div className="mt-5 flex items-center gap-4"><Countdown hours={52} /><span className="text-sm font-semibold text-gold-bright inline-flex items-center gap-1">Join <ArrowRight className="h-4 w-4" /></span></div>
        </div>
      </Link>
      <Link to="/vip" className="group relative overflow-hidden rounded-2xl border border-steel/70 bg-[linear-gradient(135deg,#14161b,#0b0c0f)] p-6 min-h-[180px] hover:border-gold/40 transition-colors">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex -space-x-5">
          {TIERS.slice(2).map((t, i) => <div key={t.id} style={{ zIndex: i }} className="transition-transform duration-300 group-hover:-translate-y-1" ><TierEmblem tier={t} size={64} /></div>)}
        </div>
        <div className="relative max-w-[55%]">
          <div className="label text-gold-bright">VIP Club</div>
          <h3 className="mt-2 font-display text-2xl font-bold">Six tiers. One Obsidian.</h3>
          <p className="mt-1.5 text-sm text-silver">Progress through Bronze to Obsidian and unlock demo-credit rewards.</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gold-bright">View tiers <ArrowRight className="h-4 w-4" /></span>
        </div>
      </Link>
    </div>
  )
}

export default function Home() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')
  const loading = useFakeLoad(550)
  const filtered = filter === 'all' ? [] : filter === 'new' ? NEW_RELEASES : filter === 'hot' ? POPULAR : GAMES.filter((g) => g.category === filter)

  return (
    <div className="space-y-10 sm:space-y-12">
      <Hero />

      <Shelf title="Featured Originals" icon={<Crown className="h-[18px] w-[18px]" />} sub="Exclusive to VAULT" games={FEATURED} viewAll="/originals" size="lg" loading={loading} />

      <div className="no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn('relative shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-semibold transition-colors',
              filter === f.id ? 'border-gold/50 text-snow bg-gold/[0.08]' : 'border-steel text-silver bg-coal hover:text-snow')}>
            <f.icon className={cn('h-4 w-4', filter === f.id ? 'text-gold' : '')} />{f.label}
          </button>
        ))}
      </div>

      {filter !== 'all' ? (
        <motion.div key={filter} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="mb-4 text-sm text-silver"><span className="text-snow font-semibold">{filtered.length}</span> games</div>
          <GameGrid games={filtered} />
        </motion.div>
      ) : (
        <>
          <Shelf title="VAULT Originals" icon={<Sparkles className="h-[18px] w-[18px]" />} sub="In-house games with displayed odds" games={ORIGINALS} viewAll="/originals" loading={loading} />
          <Shelf title="Popular Games" icon={<Flame className="h-[18px] w-[18px]" />} sub="Most played this hour (simulated)" games={POPULAR} viewAll="/originals" loading={loading} />
          <PromoStrip />
          <Shelf title="Slots" icon={<Gamepad2 className="h-[18px] w-[18px]" />} sub="Fictional studios · demo play" games={SLOTS} viewAll="/slots" loading={loading} />
          <Shelf title="Live Casino" icon={<Tv className="h-[18px] w-[18px]" />} sub="Mock previews of hosted tables" games={LIVE} viewAll="/live" loading={loading} />
          <Shelf title="New Releases" icon={<Zap className="h-[18px] w-[18px]" />} games={NEW_RELEASES} viewAll="/originals" loading={loading} />
        </>
      )}

      <ActivityTable />
    </div>
  )
}
