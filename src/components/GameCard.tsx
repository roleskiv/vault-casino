import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Heart, Play } from 'lucide-react'
import { useRef, useState, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Game } from '../data/games'
import { cn } from '../lib/format'
import { useStore } from '../store'
import { GameArt } from './GameArt'
import { SectionHeader, Skeleton } from './ui'

export function GameCard({ game, size = 'md' }: { game: Game; size?: 'md' | 'lg' }) {
  const { favorites, toggleFavorite } = useStore()
  const fav = favorites.includes(game.id)
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.18 }} className={cn('group relative shrink-0', size === 'lg' ? 'w-[168px] sm:w-[200px]' : 'w-[132px] sm:w-[156px]')}>
      <Link to={`/game/${game.id}`} className="block focus-visible:outline-none">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-steel/80 bg-graphite shadow-card transition-[box-shadow,border-color] duration-200 group-hover:border-gold/60 group-hover:shadow-lift group-focus-visible:border-gold">
          <GameArt game={game} className="h-full w-full transition-transform duration-300 group-hover:scale-[1.04]" />
          <div className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/35 group-hover:opacity-100">
            <span className="grid h-11 w-11 place-items-center rounded-full gold-fill text-ink shadow-lg"><Play className="h-4 w-4 translate-x-[1px] fill-current" /></span>
          </div>
          {game.tags?.includes('new') && (
            <span className="absolute right-2 top-2 rounded-[4px] bg-snow px-1.5 py-[3px] text-[9px] font-bold tracking-[0.14em] text-ink">NEW</span>
          )}
        </div>
      </Link>
      <button
        onClick={() => toggleFavorite(game.id)}
        aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
        className={cn('absolute right-2 bottom-[46px] grid h-7 w-7 place-items-center rounded-full bg-black/55 backdrop-blur transition-opacity', fav ? 'opacity-100 text-gold' : 'opacity-0 group-hover:opacity-100 text-snow hover:text-gold')}
      >
        <Heart className={cn('h-3.5 w-3.5', fav && 'fill-current')} />
      </button>
      <div className="mt-2 flex items-center justify-between px-0.5">
        <span className="truncate text-[13px] font-semibold text-snow/90">{game.name}</span>
      </div>
      <div className="flex items-center gap-1.5 px-0.5 text-[11px] text-silver">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
        <span className="num">{game.players.toLocaleString()}</span> playing (sim)
      </div>
    </motion.div>
  )
}

export function Shelf({ title, icon, games, sub, viewAll, size, loading }: { title: string; icon?: ReactNode; games: Game[]; sub?: string; viewAll?: string; size?: 'md' | 'lg'; loading?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ l: true, r: false })
  const update = () => {
    const el = ref.current
    if (!el) return
    setEdge({ l: el.scrollLeft < 4, r: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }
  useEffect(() => { update() }, [games.length, loading])
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * (ref.current.clientWidth * 0.8), behavior: 'smooth' })
  return (
    <section className="min-w-0">
      <SectionHeader
        icon={icon} title={title} sub={sub}
        action={
          <div className="flex items-center gap-1.5 shrink-0">
            {viewAll && <Link to={viewAll} className="mr-1 rounded-lg px-3 h-8 inline-flex items-center text-xs font-semibold text-silver border border-steel hover:text-snow hover:border-[#3a414d] transition-colors">View all</Link>}
            <button aria-label="Scroll left" onClick={() => scroll(-1)} disabled={edge.l} className="hidden sm:grid h-8 w-8 place-items-center rounded-lg border border-steel text-silver hover:text-snow disabled:opacity-35 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
            <button aria-label="Scroll right" onClick={() => scroll(1)} disabled={edge.r} className="hidden sm:grid h-8 w-8 place-items-center rounded-lg border border-steel text-silver hover:text-snow disabled:opacity-35 transition-colors"><ChevronRight className="h-4 w-4" /></button>
          </div>
        }
      />
      <div ref={ref} onScroll={update} className="no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x pb-2 pt-1">
        {loading
          ? Array.from({ length: 8 }, (_, i) => <div key={i} className={cn('shrink-0', size === 'lg' ? 'w-[168px] sm:w-[200px]' : 'w-[132px] sm:w-[156px]')}><Skeleton className="aspect-[3/4]" /><Skeleton className="mt-2 h-3 w-3/4" /><Skeleton className="mt-1.5 h-2.5 w-1/2" /></div>)
          : games.map((g) => <div key={g.id} className="snap-start"><GameCard game={g} size={size} /></div>)}
      </div>
    </section>
  )
}

export function GameGrid({ games, loading }: { games: Game[]; loading?: boolean }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(156px,1fr))] gap-3 sm:gap-4">
      {loading
        ? Array.from({ length: 12 }, (_, i) => <div key={i}><Skeleton className="aspect-[3/4]" /><Skeleton className="mt-2 h-3 w-3/4" /></div>)
        : games.map((g) => <div key={g.id} className="[&>div]:w-full"><GameCard game={g} /></div>)}
    </div>
  )
}
