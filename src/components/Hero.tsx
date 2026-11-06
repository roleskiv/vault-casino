import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, Sparkles, Crown } from 'lucide-react'
import { Link } from 'react-router-dom'
import emblem from '../assets/vault-emblem.webp'
import { Button } from './ui'

function VaultDoor() {
  const bolts = Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2)
  return (
    <div className="relative aspect-square w-full max-w-[440px]">
      <div className="absolute inset-[6%] rounded-full bg-gold/20 blur-3xl" />
      <svg viewBox="0 0 400 400" className="relative h-full w-full">
        <defs>
          <radialGradient id="hd-rim" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#4a505b" /><stop offset="0.5" stopColor="#23272f" /><stop offset="1" stopColor="#0c0e12" />
          </radialGradient>
          <linearGradient id="hd-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FBE7A1" /><stop offset="0.35" stopColor="#D4AF37" /><stop offset="0.7" stopColor="#8A6A17" /><stop offset="1" stopColor="#E8C964" />
          </linearGradient>
          <radialGradient id="hd-face" cx="0.4" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#2a2f38" /><stop offset="1" stopColor="#0d0f13" />
          </radialGradient>
          <linearGradient id="hd-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.12" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="hd-clip"><circle cx="200" cy="200" r="186" /></clipPath>
        </defs>
        {/* outer frame */}
        <circle cx="200" cy="200" r="194" fill="url(#hd-rim)" stroke="#3a414d" />
        <circle cx="200" cy="200" r="178" fill="none" stroke="url(#hd-gold)" strokeWidth="3" />
        {bolts.map((a, i) => (
          <g key={i} transform={`translate(${200 + Math.cos(a) * 186} ${200 + Math.sin(a) * 186})`}>
            <circle r="5.5" fill="#15181d" /><circle r="3.6" fill="url(#hd-gold)" />
          </g>
        ))}
        {/* rotating machined ring */}
        <motion.g animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}>
          <circle cx="200" cy="200" r="162" fill="url(#hd-face)" stroke="#2A3039" />
          {Array.from({ length: 72 }, (_, i) => {
            const a = (i / 72) * Math.PI * 2, r1 = 150, r2 = i % 6 === 0 ? 136 : 143
            return <line key={i} x1={200 + Math.cos(a) * r1} y1={200 + Math.sin(a) * r1} x2={200 + Math.cos(a) * r2} y2={200 + Math.sin(a) * r2} stroke={i % 6 === 0 ? '#D4AF37' : '#5b6270'} strokeWidth={i % 6 === 0 ? 2 : 1} strokeOpacity={i % 6 === 0 ? 0.9 : 0.5} />
          })}
        </motion.g>
        <circle cx="200" cy="200" r="128" fill="#0b0d10" stroke="url(#hd-gold)" strokeWidth="1.5" strokeOpacity="0.7" />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2
          return <rect key={i} x="194" y="80" width="12" height="44" rx="6" fill="url(#hd-gold)" opacity="0.85" transform={`rotate(${(a * 180) / Math.PI + 90} 200 200)`} />
        })}
        <circle cx="200" cy="200" r="98" fill="url(#hd-face)" stroke="#2A3039" />
        {/* light sweep */}
        <g clipPath="url(#hd-clip)">
          <g transform="skewX(-18)"><motion.rect y="0" width="160" height="400" fill="url(#hd-sheen)"
            initial={{ x: -260 }} animate={{ x: [-260, 620] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }} /></g>
        </g>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <motion.img src={emblem} alt="" className="w-[40%] drop-shadow-[0_10px_30px_rgba(212,175,55,.35)]"
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }} draggable={false} />
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-steel/70 bg-coal">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_40%,rgba(212,175,55,0.16),transparent_55%),radial-gradient(ellipse_at_0%_100%,rgba(212,175,55,0.06),transparent_50%)]" />
      <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_70%_50%,black,transparent_75%)]" />
      <div className="relative grid items-center gap-6 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[1.1fr_1fr] lg:py-14 xl:px-14">
        <div className="order-2 lg:order-1">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-bright">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Prototype · Demo credits only
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}
            className="mt-5 font-display text-[40px] leading-[1.02] sm:text-[56px] xl:text-[64px] font-extrabold tracking-[-0.03em]">
            WELCOME TO <span className="gold-text">VAULT</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }} className="mt-4 max-w-md text-base sm:text-lg text-silver">
            A premium gaming experience. Exclusive Originals, a considered design and complete transparency on every outcome.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15 }} className="mt-8 flex flex-wrap gap-3">
            <Link to="/originals"><Button variant="gold" size="lg">Explore Games <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/vip"><Button variant="dark" size="lg"><Crown className="h-4 w-4 text-gold" /> VIP Club</Button></Link>
          </motion.div>
          <div className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-steel/70 pt-6">
            {[{ i: Sparkles, k: '10', v: 'VAULT Originals' }, { i: ShieldCheck, k: '99%', v: 'Displayed RTP*' }, { i: Crown, k: '6', v: 'VIP tiers' }].map((s) => (
              <div key={s.v}>
                <div className="flex items-center gap-1.5 font-display text-xl font-bold"><s.i className="h-4 w-4 text-gold" />{s.k}</div>
                <div className="mt-0.5 text-xs text-silver">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
          <div className="w-[62%] sm:w-[48%] lg:w-full flex justify-center"><VaultDoor /></div>
        </div>
      </div>
    </section>
  )
}
