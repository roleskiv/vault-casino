import { ArrowLeft, Bell, Clock, Sparkles } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GameArt } from '../components/GameArt'
import { Shelf } from '../components/GameCard'
import { Button, DemoPill, Skeleton } from '../components/ui'
import { byId, GAMES, ORIGINALS } from '../data/games'
import { useStore } from '../store'
import { NotFound } from './Account'
import { LiveCtx } from '../games/live'

const Mines = lazy(() => import('../games/Mines'))
const Crash = lazy(() => import('../games/Crash'))
const Dice = lazy(() => import('../games/Dice'))
const Plinko = lazy(() => import('../games/Plinko'))
const Slot = lazy(() => import('../games/Slot'))
const Blackjack = lazy(() => import('../games/Blackjack'))
const Roulette = lazy(() => import('../games/Roulette'))
const Limbo = lazy(() => import('../games/Limbo'))
const Keno = lazy(() => import('../games/Keno'))
const Wheel = lazy(() => import('../games/Wheel'))
const HiLo = lazy(() => import('../games/HiLo'))
const Baccarat = lazy(() => import('../games/Baccarat'))
const DragonTiger = lazy(() => import('../games/DragonTiger'))
const GoldenWheel = lazy(() => import('../games/GoldenWheel'))
const Holdem = lazy(() => import('../games/Holdem'))
const PLAYABLE = { mines: Mines, crash: Crash, dice: Dice, plinko: Plinko, slot: Slot, blackjack: Blackjack, roulette: Roulette, limbo: Limbo, keno: Keno, wheel: Wheel, hilo: HiLo, baccarat: Baccarat, dragontiger: DragonTiger, goldenwheel: GoldenWheel, holdem: Holdem }
const HOSTS: Record<string, string> = { 'live-blackjack-1': 'Elena', 'live-roulette-1': 'Marco', 'live-baccarat-1': 'Mei', 'live-game-show': 'Jules', 'live-poker-1': 'Theo', 'live-dragon': 'Kai' }

function GameSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid lg:grid-cols-[1fr_340px] gap-px rounded-2xl overflow-hidden border border-steel/70"><Skeleton className="h-[460px] rounded-none" /><Skeleton className="h-[460px] rounded-none" /></div>
    </div>
  )
}

export default function GamePage() {
  const { id = '' } = useParams()
  const game = byId(id)
  const { toast } = useStore()
  if (!game) return <NotFound />
  const C = game.playable ? PLAYABLE[game.playable] : null
  const related = GAMES.filter((g) => g.category === game.category && g.id !== game.id).slice(0, 10)

  return (
    <div className="space-y-12">
      {C ? (
        <LiveCtx.Provider value={game.category === 'live' ? { host: HOSTS[game.id] ?? 'Host', table: game.name } : null}><Suspense fallback={<GameSkeleton />}><C key={game.id} game={game} /></Suspense></LiveCtx.Provider>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-steel/70 bg-coal">
          <div className="absolute inset-0 opacity-40 blur-2xl scale-110"><GameArt game={game} className="h-full w-full" /></div>
          <div className="absolute inset-0 bg-gradient-to-r from-coal via-coal/90 to-coal/60" />
          <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[220px_1fr] items-center">
            <div className="mx-auto w-[180px] md:w-full aspect-[3/4] overflow-hidden rounded-xl border border-gold/40 shadow-lift"><GameArt game={game} className="h-full w-full" /></div>
            <div>
              <Link to={game.category === 'live' ? '/live' : '/originals'} className="inline-flex items-center gap-1.5 text-xs text-silver hover:text-snow"><ArrowLeft className="h-3.5 w-3.5" />Back</Link>
              <div className="mt-4 label text-gold-bright">{game.provider}</div>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold">{game.name}</h1>
              <p className="mt-3 max-w-lg text-silver">{game.blurb}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <DemoPill />
                <span className="inline-flex items-center gap-1.5 rounded-md border border-steel px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-silver"><Clock className="h-3 w-3" />{game.category === 'live' ? 'Mock preview' : 'In development'}</span>
              </div>
              <p className="mt-5 max-w-lg text-sm text-silver">
                {game.category === 'live'
                  ? 'This tile shows how a hosted table would be presented. There is no live stream or dealer in this prototype. Vault Blackjack and Vault Roulette are fully playable.'
                  : 'This game is shown as a design preview.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="gold" onClick={() => toast({ title: 'You will be notified', body: `We will let you know when ${game.name} is playable (demo).`, tone: 'gold' })}><Bell className="h-4 w-4" />Notify me</Button>
                <Link to={game.glyph === "circle" ? "/game/vault-roulette" : "/game/vault-blackjack"}><Button variant="dark"><Sparkles className="h-4 w-4 text-gold" />Play {game.glyph === "circle" ? "Vault Roulette" : "Vault Blackjack"}</Button></Link>
              </div>
            </div>
          </div>
        </div>
      )}
      <Shelf title={game.category === 'originals' ? 'More Originals' : 'You may also like'} games={related.length ? related : ORIGINALS} />
    </div>
  )
}
