import { motion } from 'framer-motion'
import { ArrowRight, Gamepad2, Radio, Search, Sparkles, Tv, Clock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GameArt } from '../components/GameArt'
import { GameGrid } from '../components/GameCard'
import { Button, DemoPill } from '../components/ui'
import { LIVE, ORIGINALS, SLOTS, type Game } from '../data/games'
import { cn } from '../lib/format'
import { useFakeLoad } from '../lib/useFakeLoad'
import { useStore } from '../store'

export function PageHeader({ icon, title, sub, right }: { icon: React.ReactNode; title: string; sub: string; right?: React.ReactNode }) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-steel/70 bg-coal px-6 py-7 sm:px-8 sm:py-9">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_0%,rgba(212,175,55,0.13),transparent_55%)]" />
      <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold">{icon}<span className="label text-gold-bright">VAULT</span></div>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-xl text-sm text-silver">{sub}</p>
        </div>
        {right}
      </div>
    </div>
  )
}

function FeatureOriginal({ g, i }: { g: Game; i: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.25 }}>
      <Link to={`/game/${g.id}`} className="group flex gap-4 rounded-2xl border border-steel/70 bg-coal p-3 pr-5 hover:border-gold/45 transition-colors">
        <div className="h-[132px] w-[99px] shrink-0 overflow-hidden rounded-xl border border-steel"><GameArt game={g} className="h-full w-full transition-transform duration-300 group-hover:scale-105" /></div>
        <div className="flex min-w-0 flex-col py-1">
          <div className="flex items-center gap-2"><h3 className="font-display text-lg font-bold">{g.name}</h3></div>
          <p className="mt-1 text-sm text-silver line-clamp-2">{g.blurb}</p>
          <div className="mt-auto flex items-center gap-4 text-xs text-silver">
            <span>RTP <span className="num text-snow">{g.rtp}%</span></span>
            <span>House edge <span className="num text-snow">{(100 - g.rtp).toFixed(1)}%</span></span>
            <span className="ml-auto inline-flex items-center gap-1 font-semibold text-gold-bright">Play <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function OriginalsPage() {
  const loading = useFakeLoad(450)
  const playable = ORIGINALS.filter((g) => g.playable).slice(0, 4)
  return (
    <div>
      <PageHeader icon={<Sparkles className="h-4 w-4" />} title="VAULT Originals" sub="Games designed in-house with a shared visual language, displayed odds and transparent outcome information." right={<DemoPill />} />
      <div className="grid gap-4 md:grid-cols-2 mb-12">{playable.map((g, i) => <FeatureOriginal key={g.id} g={g} i={i} />)}</div>
      <h2 className="font-display text-lg font-bold mb-4">All Originals</h2>
      <GameGrid games={ORIGINALS} loading={loading} />
    </div>
  )
}

export function CategoryPage({ kind }: { kind: 'slots' | 'live' }) {
  const loading = useFakeLoad(500)
  const base = kind === 'slots' ? SLOTS : LIVE
  const providers = ['All', ...Array.from(new Set(base.map((g) => g.provider)))]
  const [prov, setProv] = useState('All')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'popular' | 'az' | 'new'>('popular')
  const list = useMemo(() => {
    let l = base.filter((g) => (prov === 'All' || g.provider === prov) && g.name.toLowerCase().includes(q.toLowerCase()))
    if (sort === 'popular') l = [...l].sort((a, b) => b.players - a.players)
    if (sort === 'az') l = [...l].sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'new') l = [...l].sort((a, b) => Number(!!b.tags?.includes('new')) - Number(!!a.tags?.includes('new')))
    return l
  }, [base, prov, q, sort])
  return (
    <div>
      <PageHeader
        icon={kind === 'slots' ? <Gamepad2 className="h-4 w-4" /> : <Tv className="h-4 w-4" />}
        title={kind === 'slots' ? 'Slots' : 'Live Casino'}
        sub={kind === 'slots' ? 'Illustrated demo slots from fictional studios. Every title is playable with Vault Credits.' : 'A visual preview of hosted tables. All content here is clearly labelled mock content; there is no live stream.'}
        right={<DemoPill />}
      />
      <div className="mb-6 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${kind === 'slots' ? 'slots' : 'tables'}…`} className="input pl-9" />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {providers.map((p) => (
            <button key={p} onClick={() => setProv(p)} className={cn('shrink-0 h-10 px-3.5 rounded-lg border text-xs font-semibold transition-colors', prov === p ? 'border-gold/50 bg-gold/[0.08] text-snow' : 'border-steel bg-coal text-silver hover:text-snow')}>{p}</button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="input lg:ml-auto lg:w-44 appearance-none cursor-pointer">
          <option value="popular">Sort: Popular</option><option value="az">Sort: A–Z</option><option value="new">Sort: Newest</option>
        </select>
      </div>
      {list.length === 0 && !loading ? <div className="panel py-16 text-center text-silver text-sm">No games match your filters.</div> : <GameGrid games={list} loading={loading} />}
    </div>
  )
}

const MATCHES = [
  { l: 'Northern Premier (fictional)', a: 'Harbor City', b: 'Ironvale', t: '19:45', o: [2.1, 3.4, 3.2] },
  { l: 'Northern Premier (fictional)', a: 'Ashford Rovers', b: 'Kingsmere', t: '20:00', o: [1.85, 3.6, 4.1] },
  { l: 'Continental Hoops (fictional)', a: 'Meridian Hawks', b: 'Solano Tide', t: '21:30', o: [1.72, null, 2.15] },
  { l: 'Pro Tennis Series (fictional)', a: 'A. Lindqvist', b: 'R. Moreau', t: 'Tomorrow', o: [1.55, null, 2.45] },
  { l: 'Arena Esports (fictional)', a: 'Team Basalt', b: 'Lumen Five', t: 'Tomorrow', o: [1.9, null, 1.9] },
]

export function SportsPage() {
  const { toast } = useStore()
  return (
    <div>
      <PageHeader icon={<Radio className="h-4 w-4" />} title="Sportsbook" sub="A design preview of the VAULT sportsbook. Teams, leagues and odds are fictional and no bets can be placed." right={<span className="inline-flex items-center gap-1.5 rounded-md border border-steel px-2.5 h-8 text-xs font-semibold text-silver"><Clock className="h-3.5 w-3.5 text-gold" /> Coming soon</span>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="panel divide-y divide-steel/50">
          {MATCHES.map((m) => (
            <div key={m.a} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-silver">{m.l} · {m.t}</div>
                <div className="mt-1 font-semibold">{m.a} <span className="text-silver font-normal">vs</span> {m.b}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:w-[270px]">
                {m.o.map((o, i) => (
                  <button key={i} disabled={o === null} onClick={() => toast({ title: 'Preview only', body: 'The sportsbook is a visual concept. No bets can be placed.', tone: 'info' })}
                    className="h-12 rounded-lg border border-steel bg-ink hover:border-gold/50 disabled:opacity-30 disabled:hover:border-steel transition-colors">
                    <div className="text-[10px] text-silver">{['1', 'X', '2'][i]}</div>
                    <div className="num text-sm font-semibold">{o ? o.toFixed(2) : '—'}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="panel p-5 h-fit">
          <div className="label">Bet slip</div>
          <div className="mt-6 grid place-items-center text-center py-8">
            <Radio className="h-8 w-8 text-steel" />
            <p className="mt-3 text-sm text-silver">The sportsbook is not part of this prototype. Explore the Originals instead.</p>
            <Link to="/originals" className="mt-4"><Button variant="outline">Browse Originals</Button></Link>
          </div>
        </div>
      </div>
    </div>
  )
}
