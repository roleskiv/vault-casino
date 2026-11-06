import { AnimatePresence, animate, motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import emblem from '../assets/vault-emblem.png'
import wordmark from '../assets/vault-wordmark.png'
import { cn, fmt } from '../lib/format'

type Variant = 'gold' | 'dark' | 'ghost' | 'outline' | 'emerald'
const VARIANTS: Record<Variant, string> = {
  gold: 'gold-fill text-ink shadow-[0_1px_0_rgba(255,255,255,.35)_inset,0_6px_18px_-8px_rgba(212,175,55,.6)] hover:brightness-110 active:brightness-95',
  dark: 'bg-graphite text-snow border border-steel hover:bg-[#232934] hover:border-[#3a414d] active:bg-[#1f242d]',
  ghost: 'text-silver hover:text-snow hover:bg-white/[0.04]',
  outline: 'border border-gold/50 text-gold-bright hover:bg-gold/10 hover:border-gold active:bg-gold/15',
  emerald: 'bg-emerald text-ink hover:brightness-110 active:brightness-95',
}

export function Button({
  variant = 'dark', size = 'md', loading, className, children, disabled, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
        'disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:brightness-100 active:scale-[0.98]',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-[15px]',
        VARIANTS[variant],
        className,
      )}
    >
      {loading && <Loader2 className="absolute h-4 w-4 animate-spin" />}
      <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>{children}</span>
    </button>
  )
}

export function Logo({ collapsed, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img src={emblem} alt="VAULT" className="h-8 w-auto drop-shadow-[0_2px_6px_rgba(212,175,55,.25)]" draggable={false} />
      {!collapsed && <img src={wordmark} alt="" className="h-[15px] w-auto" draggable={false} />}
    </div>
  )
}

/** Smoothly tweens between numeric values. */
export function AnimatedNumber({ value, decimals = 2, className }: { value: number; decimals?: number; className?: string }) {
  const [shown, setShown] = useState(value)
  const prev = useRef(value)
  useEffect(() => {
    const c = animate(prev.current, value, { duration: 0.45, ease: [0.2, 0.8, 0.2, 1], onUpdate: setShown })
    prev.current = value
    return () => c.stop()
  }, [value])
  return <span className={cn('num', className)}>{fmt(shown, decimals)}</span>
}

export function Modal({ open, onClose, title, children, width = 'max-w-md' }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; width?: string }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog" aria-modal="true"
            className={cn('relative w-full panel bg-coal p-6 rounded-b-none sm:rounded-2xl shadow-2xl', width)}
            initial={{ y: 24, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <button onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-silver hover:bg-white/5 hover:text-snow" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
            {title && <h2 className="font-display text-lg font-bold pr-10">{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-xl', className)} />
}

export function Segmented<T extends string>({ value, options, onChange, className, disabled }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; className?: string; disabled?: boolean }) {
  return (
    <div className={cn('relative flex rounded-lg bg-ink border border-steel p-1', disabled && 'opacity-50 pointer-events-none', className)}>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cn('relative flex-1 h-8 rounded-md text-xs font-semibold transition-colors', value === o.value ? 'text-snow' : 'text-silver hover:text-snow')}>
          {value === o.value && <motion.span layoutId={`seg-${options.map((x) => x.value).join('')}`} className="absolute inset-0 rounded-md bg-graphite border border-steel" transition={{ duration: 0.2 }} />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 rounded-full border transition-colors duration-200', checked ? 'bg-gold/90 border-gold' : 'bg-ink border-steel')}>
      <motion.span className={cn('absolute top-0.5 h-[18px] w-[18px] rounded-full shadow', checked ? 'bg-ink' : 'bg-silver')} animate={{ left: checked ? 22 : 2 }} transition={{ duration: 0.18 }} />
    </button>
  )
}

export function DemoPill({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md border border-gold/30 bg-gold/[0.07] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-bright', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Demo credits only
    </span>
  )
}

export function SectionHeader({ icon, title, action, sub }: { icon?: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <span className="text-gold">{icon}</span>}
        <div className="min-w-0">
          <h2 className="font-display text-[17px] sm:text-lg font-bold tracking-tight truncate">{title}</h2>
          {sub && <p className="text-xs text-silver mt-0.5 truncate">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <div className="flex justify-between mb-1.5"><span className="text-xs font-medium text-silver">{label}</span>{hint && <span className="text-xs text-silver num">{hint}</span>}</div>
      {children}
    </label>
  )
}
