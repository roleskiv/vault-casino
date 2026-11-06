import { useId } from 'react'
import type { Tier } from '../data/vip'
import { TIERS } from '../data/vip'

/** Faceted crest emblem; ornament grows with tier rank. */
export function TierEmblem({ tier, size = 48, locked }: { tier: Tier; size?: number; locked?: boolean }) {
  const id = useId().replace(/:/g, '')
  const rank = TIERS.findIndex((t) => t.id === tier.id)
  const [a, b, c] = tier.colors
  const obs = tier.id === 'obsidian'
  const stroke = obs ? '#D4AF37' : a
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ opacity: locked ? 0.45 : 1, filter: locked ? 'grayscale(.6)' : undefined }} aria-hidden>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="0.5" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {rank >= 3 && <path d="M32 2 L38 8 L32 6 L26 8 Z" fill={stroke} />}
      {rank >= 4 && <><path d="M8 14 L4 22 L10 18 Z" fill={stroke} /><path d="M56 14 L60 22 L54 18 Z" fill={stroke} /></>}
      <path d="M32 6 L54 16 L54 34 C54 46 44 55 32 60 C20 55 10 46 10 34 L10 16 Z" fill={`url(#${id}f)`} stroke={stroke} strokeOpacity={obs ? 0.9 : 0.4} strokeWidth="1.2" />
      <path d="M32 6 L54 16 L54 34 C54 46 44 55 32 60 Z" fill="#000" fillOpacity="0.18" />
      <path d="M32 6 L54 16 L54 26 L10 26 L10 16 Z" fill={`url(#${id}s)`} />
      <path d="M32 14 L46 21 L46 33 C46 41 40 47 32 51 C24 47 18 41 18 33 L18 21 Z" fill="none" stroke={obs ? '#D4AF37' : '#000'} strokeOpacity={obs ? 0.7 : 0.25} strokeWidth="1.2" />
      {/* V mark */}
      <path d="M24 24 L30 24 L32 32 L34 24 L40 24 L33 42 L31 42 Z" fill={obs ? '#D4AF37' : '#0b0c0f'} fillOpacity={obs ? 1 : 0.7} />
      {Array.from({ length: Math.min(rank, 5) }, (_, i) => (
        <circle key={i} cx={32 + (i - (Math.min(rank, 5) - 1) / 2) * 5} cy="47" r="1.3" fill={obs ? '#F5D778' : '#000'} fillOpacity={obs ? 1 : 0.45} />
      ))}
    </svg>
  )
}
