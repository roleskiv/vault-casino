import { motion } from 'framer-motion'
import { cn, rand } from '../lib/format'

export interface PCard { rank: number; suit: 0 | 1 | 2 | 3; id: string }
export const SUITS = ['♠', '♥', '♦', '♣'] as const
export const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
let n = 0
export const drawCard = (): PCard => ({ rank: 1 + Math.floor(rand() * 13), suit: Math.floor(rand() * 4) as PCard['suit'], id: `c${++n}` })

export function PlayingCard({ card, hidden, size = 'md', dim, highlight, delay = 0 }: { card?: PCard; hidden?: boolean; size?: 'sm' | 'md' | 'lg'; dim?: boolean; highlight?: 'win' | 'lose'; delay?: number }) {
  const red = card && (card.suit === 1 || card.suit === 2)
  const dims = size === 'lg' ? 'w-[108px] h-[152px] sm:w-[128px] sm:h-[180px]' : size === 'sm' ? 'w-[46px] h-[64px]' : 'w-[72px] h-[102px] sm:w-[86px] sm:h-[122px]'
  return (
    <motion.div initial={{ y: -24, opacity: 0, rotateY: hidden ? 0 : 90 }} animate={{ y: 0, opacity: dim ? 0.45 : 1, rotateY: 0 }} transition={{ duration: 0.28, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn('relative shrink-0 rounded-xl shadow-[0_10px_24px_-10px_rgba(0,0,0,.8)] [transform-style:preserve-3d]', dims,
        highlight === 'win' && 'ring-2 ring-gold', highlight === 'lose' && 'ring-2 ring-ruby/70')}>
      {hidden || !card ? (
        <div className="absolute inset-0 rounded-xl border border-gold/50 bg-[#101216] overflow-hidden">
          <div className="absolute inset-[5px] rounded-lg border border-gold/25 [background:repeating-linear-gradient(45deg,rgba(212,175,55,.09)_0_6px,transparent_6px_12px)]" />
          <div className="absolute inset-0 grid place-items-center"><span className="font-display text-gold/80 font-extrabold" style={{ fontSize: size === 'lg' ? 34 : size === 'sm' ? 14 : 24 }}>V</span></div>
        </div>
      ) : (
        <div className="absolute inset-0 rounded-xl bg-[#F7F4EA] border border-black/10 overflow-hidden">
          <div className={cn('absolute left-1.5 top-1 leading-none font-display font-extrabold', red ? 'text-[#C4313A]' : 'text-[#111318]')} style={{ fontSize: size === 'lg' ? 26 : size === 'sm' ? 13 : 19 }}>
            {RANKS[card.rank]}<div style={{ fontSize: size === 'lg' ? 22 : size === 'sm' ? 11 : 16 }}>{SUITS[card.suit]}</div>
          </div>
          <div className={cn('absolute inset-0 grid place-items-center', red ? 'text-[#C4313A]' : 'text-[#111318]')} style={{ fontSize: size === 'lg' ? 64 : size === 'sm' ? 22 : 42 }}>
            {SUITS[card.suit]}
          </div>
          <div className={cn('absolute right-1.5 bottom-1 rotate-180 leading-none font-display font-extrabold', red ? 'text-[#C4313A]' : 'text-[#111318]')} style={{ fontSize: size === 'lg' ? 26 : size === 'sm' ? 13 : 19 }}>
            {RANKS[card.rank]}
          </div>
        </div>
      )}
    </motion.div>
  )
}
