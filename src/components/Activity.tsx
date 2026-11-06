import { AnimatePresence, motion } from 'framer-motion'
import { Activity as ActIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { byId } from '../data/games'
import { cn, fmt, timeAgo } from '../lib/format'
import { useNow, useSimFeed } from '../lib/sim'
import { useStore } from '../store'
import { GameArt } from './GameArt'
import { Segmented, SectionHeader } from './ui'

type Tab = 'all' | 'high' | 'mine'

export function ActivityTable({ gameId, title = 'Recent activity' }: { gameId?: string; title?: string }) {
  const [tab, setTab] = useState<Tab>('all')
  const feed = useSimFeed(24, 1900, gameId)
  const { bets, username } = useStore()
  useNow(5000)
  const mine = bets.filter((b) => !gameId || b.gameId === gameId).slice(0, 10).map((b) => ({ ...b, user: username }))
  const rows = tab === 'mine' ? mine : (tab === 'high' ? feed.filter((r) => r.multiplier >= 3) : feed).slice(0, 10)
  return (
    <section>
      <SectionHeader icon={<ActIcon className="h-[18px] w-[18px]" />} title={title} sub="Simulated demo activity · fictional players"
        action={<Segmented value={tab} onChange={setTab} className="w-[250px] sm:w-[300px]" options={[{ value: 'all', label: 'All bets' }, { value: 'high', label: 'Big wins' }, { value: 'mine', label: 'My bets' }]} />} />
      <div className="panel overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1fr_0.8fr] sm:grid-cols-[1.4fr_1.2fr_0.7fr_0.8fr_0.7fr_0.9fr] gap-3 px-4 sm:px-5 h-10 items-center text-[11px] font-semibold uppercase tracking-[0.1em] text-silver border-b border-steel/70">
          <span>Game</span><span className="hidden sm:block">Player</span><span className="hidden sm:block">Time</span><span className="hidden sm:block text-right">Wager</span><span className="text-right">Multi</span><span className="text-right">Payout</span>
        </div>
        <div className="relative">
          {rows.length === 0 && <div className="py-12 text-center text-sm text-silver">No demo bets yet. <Link to="/originals" className="text-gold-bright hover:underline">Play an Original</Link> to see your history here.</div>}
          <AnimatePresence initial={false}>
            {rows.map((r) => {
              const g = byId(r.gameId)
              const big = r.multiplier >= 10
              return (
                <motion.div key={r.id} layout="position" initial={{ opacity: 0, backgroundColor: 'rgba(212,175,55,0.08)' }} animate={{ opacity: 1, backgroundColor: 'rgba(212,175,55,0)' }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
                  className="grid grid-cols-[1.4fr_1fr_0.8fr] sm:grid-cols-[1.4fr_1.2fr_0.7fr_0.8fr_0.7fr_0.9fr] gap-3 px-4 sm:px-5 h-12 items-center text-[13px] border-b border-steel/40 last:border-0">
                  <Link to={`/game/${r.gameId}`} className="flex items-center gap-2.5 min-w-0 hover:text-gold-bright">
                    {g && <span className="h-8 w-6 overflow-hidden rounded border border-steel shrink-0"><GameArt game={g} className="h-full w-full" /></span>}
                    <span className="truncate font-medium">{r.game}</span>
                  </Link>
                  <span className="hidden sm:block truncate text-silver">{r.user}</span>
                  <span className="hidden sm:block text-silver text-xs">{timeAgo(r.time)}</span>
                  <span className="hidden sm:block text-right num text-snow/90">{fmt(r.wager)}</span>
                  <span className={cn('text-right num', big ? 'text-gold-bright' : r.multiplier > 0 ? 'text-snow' : 'text-silver')}>{r.multiplier.toFixed(2)}×</span>
                  <span className={cn('text-right num font-medium', big ? 'text-gold-bright' : r.multiplier > 0 ? 'text-emerald' : 'text-silver')}>
                    {r.payout > 0 ? `+${fmt(r.payout)}` : `-${fmt(r.wager)}`}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
