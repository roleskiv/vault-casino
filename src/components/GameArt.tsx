import { useId, type ReactNode } from 'react'
import {
  Anchor, Crown, Fish, Sparkles, Cherry, Shield, Flower2, Rocket, Sun, Zap, Spade, Circle, Diamond, Star, Club, Flame,
} from 'lucide-react'
import type { Game } from '../data/games'

const GLYPHS: Record<string, typeof Anchor> = {
  ankh: Crown, fish: Fish, sparkles: Sparkles, cherry: Cherry, shield: Shield, flower: Flower2, rocket: Rocket,
  sun: Sun, zap: Zap, crown: Crown, spade: Spade, circle: Circle, diamond: Diamond, star: Star, club: Club, flame: Flame,
}

/** Small deterministic PRNG so every cover keeps the same particles between renders. */
function seeded(key: string) {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296 }
}

/** Procedural, brand-consistent cover art for every game (portrait 3:4). */
export function GameArt({ game, className = '' }: { game: Game; className?: string }) {
  const raw = useId().replace(/:/g, '')
  const id = (s: string) => `${raw}-${s}`
  const [c0, c1, accent] = game.palette
  const isOriginal = game.category === 'originals'
  const scenic = game.category !== 'originals'
  const words = game.name.replace(/^Vault /, '').toUpperCase()
  const rnd = seeded(game.id)
  const motes = Array.from({ length: 18 }, () => ({ x: rnd() * 300, y: 30 + rnd() * 250, r: 0.8 + rnd() * 2.6, o: 0.15 + rnd() * 0.5, blur: rnd() > 0.6 }))
  const ridge = (base: number, amp: number, k: number) => {
    const pts = Array.from({ length: 13 }, (_, i) => `${i * 25},${(base - Math.abs(Math.sin(i * k + rnd() * 2)) * amp - rnd() * amp * 0.4).toFixed(1)}`)
    return `M0,400 L${pts.join(' L')} L300,400 Z`
  }

  return (
    <svg viewBox="0 0 300 400" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={id('bg')} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={c0} />
          <stop offset="0.55" stopColor={c1} />
          <stop offset="1" stopColor="#030405" />
        </linearGradient>
        <radialGradient id={id('key')} cx="0.5" cy="0.22" r="0.65">
          <stop offset="0" stopColor={accent} stopOpacity={scenic ? 0.55 : 0.34} />
          <stop offset="0.45" stopColor={accent} stopOpacity={scenic ? 0.16 : 0.08} />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('rim')} cx="0.92" cy="0.05" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('ray')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.22" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id('floor')} cx="0.5" cy="0" r="0.7">
          <stop offset="0" stopColor={accent} stopOpacity="0.28" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('vig')} cx="0.5" cy="0.42" r="0.78">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.75" />
        </radialGradient>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#FFF1C1" />
          <stop offset="0.3" stopColor="#E9C65A" />
          <stop offset="0.6" stopColor="#B8922A" />
          <stop offset="1" stopColor="#6E5310" />
        </linearGradient>
        <linearGradient id={id('acc')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.35" stopColor={accent} />
          <stop offset="1" stopColor={accent} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={id('glyph')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="24">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor={accent} />
          <stop offset="1" stopColor={accent} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={id('steel')} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#4a525f" />
          <stop offset="0.5" stopColor="#252a33" />
          <stop offset="1" stopColor="#111419" />
        </linearGradient>
        <linearGradient id={id('fade')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="0.78" stopColor="#000" stopOpacity="0.7" />
          <stop offset="1" stopColor="#000" stopOpacity="0.92" />
        </linearGradient>
        <linearGradient id={id('reflmask-g')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={id('reflmask')}><rect x="0" y="280" width="300" height="120" fill={`url(#${id('reflmask-g')})`} /></mask>
        <pattern id={id('lines')} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="9" stroke="#fff" strokeOpacity="0.03" strokeWidth="1" />
        </pattern>
        <filter id={id('soft')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id={id('bokeh')} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6" /></filter>
        <filter id={id('shadow')} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="12" stdDeviation="9" floodColor="#000" floodOpacity="0.75" />
          <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor={accent} floodOpacity="0.18" />
        </filter>
        <filter id={id('grain')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0" />
        </filter>
      </defs>

      {/* stage */}
      <rect width="300" height="400" fill={`url(#${id('bg')})`} />
      {!scenic && <rect width="300" height="400" fill={`url(#${id('lines')})`} />}
      <rect width="300" height="400" fill={`url(#${id('key')})`} />
      <g opacity={scenic ? 0.7 : 0.9}>
        {[-38, -16, 8, 30].map((a, i) => (
          <polygon key={a} points={`150,-20 ${150 + Math.tan(((a - 4) * Math.PI) / 180) * 420},400 ${150 + Math.tan(((a + 4 + i) * Math.PI) / 180) * 420},400`} fill={`url(#${id('ray')})`} opacity={0.5 + (i % 2) * 0.3} />
        ))}
      </g>
      {scenic && (
        <g>
          <circle cx={game.category === 'live' ? 150 : 214} cy={game.category === 'live' ? 70 : 66} r="30" fill={accent} opacity="0.22" filter={`url(#${id('soft')})`} />
          <circle cx={game.category === 'live' ? 150 : 214} cy={game.category === 'live' ? 70 : 66} r="15" fill="#fff" opacity="0.16" />
          <path d={ridge(250, 46, 0.9)} fill={c0} opacity="0.55" />
          <path d={ridge(284, 34, 1.4)} fill={c1} opacity="0.85" />
        </g>
      )}
      {!scenic && (
        <g>
          <ellipse cx="150" cy="282" rx="190" ry="60" fill={`url(#${id('floor')})`} />
          {Array.from({ length: 9 }, (_, i) => <line key={`f${i}`} x1={150} y1={258} x2={-150 + i * 75} y2={400} stroke={accent} strokeOpacity="0.07" />)}
          {[272, 292, 322, 362].map((y) => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke={accent} strokeOpacity="0.06" />)}
        </g>
      )}
      <rect width="300" height="400" fill={`url(#${id('rim')})`} />
      {motes.map((m, i) => <circle key={i} cx={m.x} cy={m.y} r={m.blur ? m.r * 2 : m.r} fill={i % 3 ? accent : '#fff'} opacity={m.blur ? m.o * 0.5 : m.o} filter={m.blur ? `url(#${id('bokeh')})` : undefined} />)}

      {/* hero object + reflection */}
      <g id={id('hero')} filter={`url(#${id('shadow')})`}>{motif(game, id, accent)}</g>
      {!scenic && <use href={`#${id('hero')}`} transform="translate(0 566) scale(1 -1)" mask={`url(#${id('reflmask')})`} opacity="0.6" />}

      <rect width="300" height="400" fill={`url(#${id('vig')})`} />
      <rect width="300" height="400" fill={`url(#${id('fade')})`} />
      <rect width="300" height="400" filter={`url(#${id('grain')})`} opacity="0.9" />
      <rect x="0.5" y="0.5" width="299" height="399" fill="none" stroke="#fff" strokeOpacity="0.05" />

      {isOriginal && (
        <g>
          <rect x="18" y="18" width="78" height="20" rx="4" fill="#000" fillOpacity="0.5" stroke="#D4AF37" strokeOpacity="0.55" />
          <text x="57" y="32" textAnchor="middle" fontFamily="Sora, sans-serif" fontSize="9.5" fontWeight="700" letterSpacing="1.6" fill="#F5D778">ORIGINAL</text>
        </g>
      )}
      {game.category === 'live' && (
        <g>
          <rect x="18" y="18" width="104" height="20" rx="4" fill="#000" fillOpacity="0.55" />
          <circle cx="30" cy="28" r="3.5" fill="#E5484D" />
          <text x="40" y="32" fontFamily="Sora, sans-serif" fontSize="9.5" fontWeight="700" letterSpacing="1.4" fill="#F7F7F8">LIVE-STYLE</text>
        </g>
      )}
      <rect x="120" y="318" width="60" height="1" fill="#D4AF37" opacity="0.5" />
      <text x="150" y="346" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="800" fontSize={words.length > 12 ? 23 : 29} letterSpacing="1.5" fill="#F7F7F8" style={{ paintOrder: 'stroke' }} stroke="#000" strokeOpacity="0.35" strokeWidth="3">
        {words}
      </text>
      <text x="150" y="368" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="10" letterSpacing="2.6" fill={isOriginal ? '#D4AF37' : '#d6dae1'} fillOpacity="0.9">
        {game.provider.toUpperCase()}
      </text>
    </svg>
  )
}

function motif(game: Game, id: (s: string) => string, accent: string): ReactNode {
  const gold = `url(#${id('gold')})`
  const steel = `url(#${id('steel')})`
  switch (game.art) {
    case 'mines': {
      const cells: ReactNode[] = []
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const x = 72 + c * 54, y = 70 + r * 54
        const k = r * 3 + c
        cells.push(<rect key={k} x={x} y={y} width="46" height="46" rx="7" fill={k === 4 ? '#0d0f13' : steel} stroke={k === 4 ? '#D4AF37' : '#ffffff'} strokeOpacity={k === 4 ? 0.9 : 0.08} />)
        if (k === 4) cells.push(<path key="gem" d={`M${x + 23} ${y + 9} L${x + 37} ${y + 20} L${x + 23} ${y + 38} L${x + 9} ${y + 20} Z`} fill={gold} />)
        if (k === 4) cells.push(<path key="gem2" d={`M${x + 9} ${y + 20} L${x + 37} ${y + 20} L${x + 23} ${y + 9} Z`} fill="#fff" fillOpacity="0.35" />)
        if (k === 2 || k === 6) cells.push(<path key={`g${k}`} d={`M${x + 23} ${y + 13} L${x + 33} ${y + 21} L${x + 23} ${y + 34} L${x + 13} ${y + 21} Z`} fill={gold} opacity="0.55" />)
        if (k === 8) cells.push(
          <g key="mine" transform={`translate(${x + 23} ${y + 23})`}>
            {[0, 45, 90, 135].map((a) => <rect key={a} x="-2" y="-15" width="4" height="30" rx="2" fill="#4a515d" transform={`rotate(${a})`} />)}
            <circle r="10" fill="#22262e" stroke="#5b6270" />
            <circle r="3" cx="-3" cy="-3" fill="#fff" fillOpacity="0.25" />
          </g>,
        )
      }
      return <>{cells}<ellipse cx="150" cy="148" rx="46" ry="46" fill={accent} opacity="0.12" filter={`url(#${id('soft')})`} /></>
    }
    case 'crash': {
      const pts = Array.from({ length: 40 }, (_, i) => {
        const t = i / 39
        return [40 + t * 220, 250 - Math.pow(t, 2.2) * 170]
      })
      const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
      const last = pts[pts.length - 1]
      return (
        <>
          {[0, 1, 2, 3, 4].map((i) => <line key={i} x1="40" x2="260" y1={90 + i * 40} y2={90 + i * 40} stroke="#fff" strokeOpacity="0.06" />)}
          <path d={`${d} L260 250 L40 250 Z`} fill={accent} fillOpacity="0.10" />
          <path d={d} fill="none" stroke={gold} strokeWidth="5" strokeLinecap="round" />
          <path d={d} fill="none" stroke={accent} strokeWidth="12" opacity="0.25" filter={`url(#${id('soft')})`} />
          <circle cx={last[0]} cy={last[1]} r="8" fill="#FBE7A1" />
          <text x="150" y="150" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight="600" fontSize="44" fill="#F7F7F8">2.48×</text>
        </>
      )
    }
    case 'dice': {
      const pip = (cx: number, cy: number) => <circle cx={cx} cy={cy} r="5" fill="#0b0c0f" />
      return (
        <>
          <g transform="translate(108 150) rotate(-14)">
            <rect x="-48" y="-48" width="96" height="96" rx="18" fill={gold} />
            <rect x="-48" y="-48" width="96" height="40" rx="18" fill="#fff" fillOpacity="0.18" />
            {pip(-22, -22)}{pip(22, -22)}{pip(0, 0)}{pip(-22, 22)}{pip(22, 22)}
          </g>
          <g transform="translate(196 186) rotate(18)">
            <rect x="-38" y="-38" width="76" height="76" rx="14" fill={steel} stroke="#D4AF37" strokeOpacity="0.6" />
            <circle cx="-16" cy="-16" r="5" fill="#D4AF37" /><circle cx="16" cy="16" r="5" fill="#D4AF37" /><circle cx="0" cy="0" r="5" fill="#D4AF37" />
          </g>
        </>
      )
    }
    case 'plinko': {
      const pins: ReactNode[] = []
      for (let r = 0; r < 7; r++) for (let c = 0; c <= r + 2; c++) {
        const x = 150 + (c - (r + 2) / 2) * 26, y = 70 + r * 24
        pins.push(<circle key={`${r}-${c}`} cx={x} cy={y} r="3.6" fill={gold} />)
      }
      const cols = ['#E5484D', '#e8794a', '#D4AF37', '#9aa0aa', '#D4AF37', '#e8794a', '#E5484D']
      return (
        <>
          {pins}
          {cols.map((c, i) => <rect key={i} x={150 + (i - 3) * 30 - 13} y="246" width="26" height="16" rx="4" fill={c} opacity="0.9" />)}
          <circle cx="163" cy="132" r="8" fill="#FBE7A1" />
          <circle cx="163" cy="132" r="16" fill={accent} opacity="0.3" filter={`url(#${id('soft')})`} />
        </>
      )
    }
    case 'blackjack':
      return (
        <>
          <g transform="translate(118 160) rotate(-12)">
            <rect x="-48" y="-68" width="96" height="136" rx="10" fill="#F7F4EA" />
            <text x="-36" y="-42" fontFamily="Sora" fontWeight="800" fontSize="22" fill="#111">K</text>
            <path d="M0 -14 C 18 4, 22 14, 10 22 C 4 26, 1 22, 0 18 C -1 22, -4 26, -10 22 C -22 14, -18 4, 0 -14 Z" fill="#111" />
          </g>
          <g transform="translate(184 168) rotate(10)">
            <rect x="-48" y="-68" width="96" height="136" rx="10" fill="#101216" stroke="#D4AF37" strokeWidth="2" />
            <text x="-36" y="-42" fontFamily="Sora" fontWeight="800" fontSize="22" fill="#F5D778">A</text>
            <path d="M0 -20 L18 4 L0 28 L-18 4 Z" fill={gold} />
          </g>
          <text x="150" y="276" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="600" fontSize="18" fill="#F5D778">21</text>
        </>
      )
    case 'roulette':
    case 'wheel': {
      const n = game.art === 'roulette' ? 18 : 12
      const segs: ReactNode[] = []
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, R = 92
        const p = (a: number, r: number) => `${150 + Math.cos(a) * r} ${160 + Math.sin(a) * r}`
        const fill = game.art === 'roulette' ? (i === 0 ? '#31C48D' : i % 2 ? '#7d1b20' : '#121418') : (i % 3 === 0 ? '#D4AF37' : i % 3 === 1 ? '#2a3039' : '#5a4a1c')
        segs.push(<path key={i} d={`M150 160 L${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} Z`} fill={fill} stroke="#0b0c0f" strokeWidth="1.5" />)
      }
      return (
        <>
          <circle cx="150" cy="160" r="104" fill={gold} />
          <circle cx="150" cy="160" r="98" fill="#0b0c0f" />
          {segs}
          <circle cx="150" cy="160" r="46" fill={steel} stroke="#D4AF37" strokeWidth="2" />
          <circle cx="150" cy="160" r="12" fill={gold} />
          {game.art === 'wheel' && <path d="M150 50 L140 30 L160 30 Z" fill="#F7F7F8" />}
          {game.art === 'roulette' && <circle cx="150" cy="86" r="6" fill="#F7F7F8" />}
        </>
      )
    }
    case 'limbo':
      return (
        <>
          {[90, 66, 42].map((r, i) => <circle key={r} cx="150" cy="160" r={r} fill="none" stroke={i === 2 ? '#D4AF37' : '#fff'} strokeOpacity={i === 2 ? 0.9 : 0.1} strokeWidth={i === 2 ? 3 : 2} />)}
          <path d="M150 230 L150 100 M126 124 L150 100 L174 124" stroke={gold} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <text x="150" y="276" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="600" fontSize="20" fill="#F5D778">10.00×</text>
        </>
      )
    case 'keno': {
      const hits = [1, 6, 7, 12, 14]
      return (
        <>
          {Array.from({ length: 16 }, (_, i) => {
            const x = 78 + (i % 4) * 48, y = 82 + Math.floor(i / 4) * 48
            const hit = hits.includes(i)
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="19" fill={hit ? gold : steel} stroke="#fff" strokeOpacity={hit ? 0 : 0.08} />
                <text x={x} y={y + 5} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="600" fontSize="14" fill={hit ? '#0b0c0f' : '#9299A5'}>{i + 1}</text>
              </g>
            )
          })}
        </>
      )
    }
    case 'hilo':
      return (
        <>
          <g transform="translate(150 160)">
            <rect x="-52" y="-74" width="104" height="148" rx="12" fill="#101216" stroke="#D4AF37" strokeWidth="2" />
            <text x="0" y="16" textAnchor="middle" fontFamily="Sora" fontWeight="800" fontSize="54" fill="#F5D778">7</text>
          </g>
          <path d="M78 140 L96 118 L114 140" stroke="#31C48D" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M186 178 L204 200 L222 178" stroke="#E5484D" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )
    case 'slot': {
      const G = GLYPHS[game.glyph ?? 'star'] ?? Star
      const sparkle = (x: number, y: number, r: number, k: number) => (
        <path key={k} d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`} fill="#fff" opacity="0.85" />
      )
      const coin = (x: number, y: number, n: number, k: string) => (
        <g key={k}>
          {Array.from({ length: n }, (_, i) => (
            <g key={i} transform={`translate(${x} ${y - i * 7})`}>
              <ellipse rx="24" ry="8" cy="3" fill="#5a4410" />
              <ellipse rx="24" ry="8" fill={gold} />
              <ellipse rx="17" ry="5" fill="none" stroke="#fff3c4" strokeOpacity="0.5" />
            </g>
          ))}
        </g>
      )
      return (
        <>
          <circle cx="150" cy="150" r="110" fill={accent} opacity="0.22" filter={`url(#${id('soft')})`} />
          <g>
            <circle cx="150" cy="150" r="84" fill={gold} />
            <circle cx="150" cy="150" r="84" fill={accent} opacity="0.28" />
            <circle cx="150" cy="150" r="76" fill="#000" fillOpacity="0.35" />
            <circle cx="150" cy="150" r="72" fill={`url(#${id('bg')})`} stroke="#fff1c1" strokeOpacity="0.35" />
            {Array.from({ length: 24 }, (_, i) => {
              const a = (i / 24) * Math.PI * 2
              return <circle key={i} cx={150 + Math.cos(a) * 80} cy={150 + Math.sin(a) * 80} r="1.6" fill="#fff8dc" opacity="0.75" />
            })}
            <circle cx="150" cy="150" r="58" fill={accent} opacity="0.12" />
            <G x={102} y={102} width={96} height={96} stroke={`url(#${id('glyph')})`} strokeWidth={1.9} />
            <path d="M88 118 A70 70 0 0 1 160 80" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
          </g>
          {coin(62, 272, 4, 'l')}
          {coin(238, 276, 3, 'r')}
          {coin(214, 286, 2, 'r2')}
          {sparkle(218, 92, 9, 1)}{sparkle(84, 196, 6, 2)}{sparkle(236, 214, 5, 3)}{sparkle(120, 72, 4, 4)}
        </>
      )
    }
    case 'live': {
      const G = GLYPHS[game.glyph ?? 'star'] ?? Star
      return (
        <>
          <ellipse cx="150" cy="250" rx="200" ry="110" fill={accent} opacity="0.07" />
          <ellipse cx="150" cy="250" rx="170" ry="86" fill="none" stroke="#D4AF37" strokeOpacity="0.45" strokeWidth="2" />
          <circle cx="150" cy="138" r="66" fill={gold} />
          <circle cx="150" cy="138" r="60" fill="#000" fillOpacity="0.4" />
          <circle cx="150" cy="138" r="57" fill={`url(#${id('bg')})`} stroke="#fff1c1" strokeOpacity="0.3" />
          {Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return <circle key={`s${i}`} cx={150 + Math.cos(a) * 63} cy={138 + Math.sin(a) * 63} r="1.4" fill="#fff8dc" opacity="0.7" /> })}
          <G x={112} y={100} width={76} height={76} stroke={`url(#${id('glyph')})`} strokeWidth={1.6} />
          <path d="M98 112 A56 56 0 0 1 156 82" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" />
          {[-60, -20, 20, 60].map((dx, i) => (
            <g key={dx} transform={`translate(${150 + dx} ${238 + (i % 2) * 8})`}>
              <ellipse rx="16" ry="6" fill={i % 2 ? '#D4AF37' : '#E5484D'} />
              <ellipse rx="16" ry="6" cy="-4" fill={i % 2 ? '#F5D778' : '#ff7d80'} />
            </g>
          ))}
        </>
      )
    }
  }
}
