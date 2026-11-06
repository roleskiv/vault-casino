import { useMemo } from 'react'
import { useNow } from '../lib/sim'

/** Countdown to a fixed point `hours` from first render (resets each visit — demo only). */
export function Countdown({ hours, compact }: { hours: number; compact?: boolean }) {
  const end = useMemo(() => Date.now() + hours * 3600e3, [hours])
  const now = useNow(1000)
  const left = Math.max(0, end - now)
  const parts = [
    ['D', Math.floor(left / 86400e3)],
    ['H', Math.floor(left / 3600e3) % 24],
    ['M', Math.floor(left / 60e3) % 60],
    ['S', Math.floor(left / 1e3) % 60],
  ] as const
  return (
    <div className="flex items-center gap-1.5" aria-label="Time remaining">
      {parts.map(([k, v]) => (
        <div key={k} className={compact ? 'flex items-baseline gap-0.5' : 'flex flex-col items-center rounded-md border border-steel bg-ink/80 min-w-[42px] py-1'}>
          <span className="num text-sm font-semibold text-snow">{String(v).padStart(2, '0')}</span>
          <span className="text-[9px] font-semibold text-silver">{k}</span>
        </div>
      ))}
    </div>
  )
}
