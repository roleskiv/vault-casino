import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell, Crown, Dices, Gamepad2, Gift, History, Home, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, Radio, Search,
  Settings, Sparkles, Trophy, Tv, User, Wallet, X, Medal, Activity, Eye, EyeOff, ShieldCheck, ChevronDown, CheckCircle2, Info, AlertTriangle,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { GAMES } from '../data/games'
import { tierFor } from '../data/vip'
import { cn, fmt } from '../lib/format'
import { useSimFeed } from '../lib/sim'
import { useStore } from '../store'
import { DailySpinButton } from './Polish'
import { GameArt } from './GameArt'
import { AnimatedNumber, Button, DemoPill, Logo, Modal } from './ui'
import { TierEmblem } from './TierEmblem'

export const NAV: { group: string; items: { to: string; label: string; icon: typeof Home }[] }[] = [
  { group: 'Main', items: [
    { to: '/', label: 'Lobby', icon: Home },
    { to: '/originals', label: 'Originals', icon: Sparkles },
    { to: '/slots', label: 'Slots', icon: Gamepad2 },
    { to: '/live', label: 'Live Casino', icon: Tv },
    { to: '/sports', label: 'Sportsbook', icon: Radio },
  ] },
  { group: 'Discover', items: [
    { to: '/promotions', label: 'Promotions', icon: Gift },
    { to: '/vip', label: 'VIP Club', icon: Crown },
    { to: '/tournaments', label: 'Tournaments', icon: Trophy },
    { to: '/leaderboards', label: 'Leaderboards', icon: Medal },
  ] },
  { group: 'Account', items: [
    { to: '/profile', label: 'My Profile', icon: User },
    { to: '/rewards', label: 'Rewards', icon: Gift },
    { to: '/transactions', label: 'Transaction History', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings },
  ] },
]

function NavItems({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-5">
      {NAV.map((g) => (
        <div key={g.group}>
          <div className={cn('label mb-2 px-3 transition-opacity duration-150', collapsed && 'opacity-0 h-0 mb-0 overflow-hidden')}>{g.group}</div>
          <ul className="flex flex-col gap-0.5">
            {g.items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to} end={to === '/'} onClick={onNavigate} title={collapsed ? label : undefined}
                  className={({ isActive }) => cn(
                    'group relative flex items-center gap-3 rounded-lg h-10 text-[13.5px] font-medium transition-colors duration-150',
                    collapsed ? 'justify-center px-0' : 'px-3',
                    isActive ? 'bg-gold/[0.09] text-snow' : 'text-silver hover:text-snow hover:bg-white/[0.035]',
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <motion.span layoutId={collapsed ? 'nav-c' : 'nav'} className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-gold" transition={{ duration: 0.2 }} />}
                      <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-gold' : 'text-silver group-hover:text-snow')} />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function SidebarPromo() {
  const { wagered } = useStore()
  const { tier, next, progress } = tierFor(wagered)
  return (
    <Link to="/vip" className="block rounded-xl border border-gold/25 bg-gradient-to-b from-gold/[0.08] to-transparent p-3.5 hover:border-gold/45 transition-colors">
      <div className="flex items-center gap-2.5">
        <TierEmblem tier={tier} size={34} />
        <div className="min-w-0">
          <div className="text-[11px] text-silver">VIP status</div>
          <div className="text-sm font-semibold">{tier.name}</div>
        </div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-ink overflow-hidden"><div className="h-full gold-fill rounded-full" style={{ width: `${Math.max(4, progress * 100)}%` }} /></div>
      <div className="mt-1.5 text-[11px] text-silver">{next ? `${Math.round(progress * 100)}% to ${next.name}` : 'Top tier reached'}</div>
    </Link>
  )
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 248 }} transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 flex-col border-r border-steel/70 bg-coal"
    >
      <div className={cn('flex h-16 items-center border-b border-steel/70', collapsed ? 'justify-center px-0' : 'justify-between px-5')}>
        <Link to="/" aria-label="VAULT home"><Logo collapsed={collapsed} /></Link>
        {!collapsed && (
          <button onClick={onToggle} aria-label="Collapse sidebar" className="grid h-8 w-8 place-items-center rounded-lg text-silver hover:text-snow hover:bg-white/5"><PanelLeftClose className="h-4 w-4" /></button>
        )}
      </div>
      {collapsed && (
        <button onClick={onToggle} aria-label="Expand sidebar" className="mx-auto mt-3 grid h-9 w-9 place-items-center rounded-lg text-silver hover:text-snow hover:bg-white/5"><PanelLeftOpen className="h-4 w-4" /></button>
      )}
      <div className={cn('flex-1 overflow-y-auto no-scrollbar py-5', collapsed ? 'px-3' : 'px-3')}>
        <NavItems collapsed={collapsed} />
      </div>
      {!collapsed && <div className="p-3 border-t border-steel/70"><SidebarPromo /></div>}
    </motion.aside>
  )
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-black/70 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside className="fixed left-0 top-0 bottom-0 z-[61] w-[84%] max-w-[320px] bg-coal border-r border-steel flex flex-col lg:hidden"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}>
            <div className="flex h-16 items-center justify-between px-5 border-b border-steel/70">
              <Logo />
              <button onClick={onClose} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-lg text-silver hover:text-snow"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 pb-6"><NavItems onNavigate={onClose} /></div>
            <div className="p-3 border-t border-steel/70"><SidebarPromo /></div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function useClickOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open, close])
  return ref
}

function Dropdown({ open, children, className }: { open: boolean; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.16 }}
          className={cn('absolute z-50 mt-2 panel bg-coal shadow-2xl shadow-black/60 origin-top', className)}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function SearchBox({ autoFocus, onPick, className }: { autoFocus?: boolean; onPick?: () => void; className?: string }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const ref = useClickOutside(open, () => setOpen(false))
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return GAMES.filter((g) => g.tags?.includes('hot')).slice(0, 6)
    return GAMES.filter((g) => `${g.name} ${g.provider} ${g.category}`.toLowerCase().includes(s)).slice(0, 8)
  }, [q])
  return (
    <div ref={ref} className={cn('relative', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
        <input value={q} autoFocus={autoFocus} onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) { nav(`/game/${results[0].id}`); setOpen(false); setQ(''); onPick?.() } }}
          placeholder="Search games, studios…" className="input pl-9 bg-ink/80" aria-label="Search games" />
      </div>
      <Dropdown open={open} className="left-0 right-0 p-2 max-h-[420px] overflow-y-auto">
        <div className="label px-2 py-1.5">{q ? `Results for “${q}”` : 'Trending (simulated)'}</div>
        {results.length === 0 && <div className="px-2 py-6 text-center text-sm text-silver">No games match “{q}”.</div>}
        {results.map((g) => (
          <button key={g.id} onClick={() => { nav(`/game/${g.id}`); setOpen(false); setQ(''); onPick?.() }} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-white/[0.04]">
            <div className="h-12 w-9 overflow-hidden rounded-md border border-steel shrink-0"><GameArt game={g} className="h-full w-full" /></div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{g.name}</div>
              <div className="text-xs text-silver truncate">{g.provider}</div>
            </div>
            <span className="ml-auto text-[10px] uppercase tracking-wider text-silver">{g.category}</span>
          </button>
        ))}
      </Dropdown>
    </div>
  )
}

const NOTES = [
  { icon: Crown, title: 'You reached Gold', body: 'Your demo level-up bonus is waiting in Rewards.', to: '/rewards', t: '2h' },
  { icon: Trophy, title: 'Weekly Challenge is live', body: 'Climb the demo leaderboard in Vault Crash.', to: '/promotions', t: '5h' },
  { icon: Sparkles, title: 'New Original: Vault Hi-Lo', body: 'Preview the newest VAULT Original.', to: '/game/vault-hilo', t: '1d' },
]

export function TopNav({ onMenu, onActivity, activityOpen }: { onMenu: () => void; onActivity: () => void; activityOpen: boolean }) {
  const { loggedIn, balance, username, openModal, logout, settings, updateSettings } = useStore()
  const [notif, setNotif] = useState(false)
  const [menu, setMenu] = useState(false)
  const [unread, setUnread] = useState(true)
  const nRef = useClickOutside(notif, () => setNotif(false))
  const mRef = useClickOutside(menu, () => setMenu(false))
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-steel/70 bg-ink/85 backdrop-blur-xl">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6">
        <button onClick={onMenu} aria-label="Open menu" className="lg:hidden grid h-10 w-10 -ml-2 place-items-center rounded-lg text-silver hover:text-snow"><Menu className="h-5 w-5" /></button>
        <Link to="/" className="lg:hidden" aria-label="VAULT home"><Logo collapsed className="sm:hidden" /><Logo className="hidden sm:flex" /></Link>
        <SearchBox className="hidden md:block w-full max-w-[340px]" />
        <div className="flex-1" />

        {loggedIn && (
          <div className="flex items-center rounded-lg border border-steel bg-coal h-10 pl-3 pr-1 gap-2">
            <Wallet className="h-4 w-4 text-gold hidden sm:block" />
            <div className="flex flex-col leading-none">
              <span className="hidden sm:block text-[9.5px] uppercase tracking-[0.14em] text-silver mb-0.5">Balance</span>
              <span className="text-[13px] font-semibold whitespace-nowrap">
                {settings.hideBalance ? <span className="num">•••••</span> : <AnimatedNumber value={balance} />} <span className="text-gold text-[11px] font-bold">VC</span>
              </span>
            </div>
            <button onClick={() => updateSettings({ hideBalance: !settings.hideBalance })} aria-label="Toggle balance visibility" className="hidden sm:grid h-8 w-7 place-items-center text-silver hover:text-snow">
              {settings.hideBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <Button variant="gold" size="sm" className="h-8 px-2.5 sm:px-3" onClick={() => openModal('credits')}>
              <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">Add Credits</span>
            </Button>
          </div>
        )}

        {!loggedIn && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" onClick={() => openModal('login')}>Log in</Button>
            <Button variant="gold" size="md" onClick={() => openModal('register')}>Register</Button>
          </div>
        )}

        <DailySpinButton />

        <div ref={nRef} className="relative hidden sm:block">
          <button onClick={() => { setNotif((v) => !v); setUnread(false) }} aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-lg border border-steel bg-coal text-silver hover:text-snow transition-colors">
            <Bell className="h-4 w-4" />
            {unread && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-gold ring-2 ring-coal" />}
          </button>
          <Dropdown open={notif} className="right-0 w-[320px] p-2">
            <div className="flex items-center justify-between px-2 py-1.5"><span className="label">Notifications</span><span className="text-[11px] text-silver">Demo</span></div>
            {NOTES.map((n) => (
              <Link key={n.title} to={n.to} onClick={() => setNotif(false)} className="flex gap-3 rounded-lg p-2.5 hover:bg-white/[0.04]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold/10 text-gold"><n.icon className="h-4 w-4" /></span>
                <span className="min-w-0"><span className="block text-sm font-medium">{n.title}</span><span className="block text-xs text-silver">{n.body}</span></span>
                <span className="ml-auto text-[11px] text-silver">{n.t}</span>
              </Link>
            ))}
          </Dropdown>
        </div>

        <button onClick={onActivity} aria-label="Toggle live activity" className={cn('hidden xl:grid h-10 w-10 place-items-center rounded-lg border bg-coal transition-colors', activityOpen ? 'border-gold/50 text-gold' : 'border-steel text-silver hover:text-snow')}>
          <Activity className="h-4 w-4" />
        </button>

        {loggedIn && (
          <div ref={mRef} className="relative">
            <button onClick={() => setMenu((v) => !v)} className="flex items-center gap-1.5 rounded-lg p-1 hover:bg-white/[0.04]" aria-label="Account menu">
              <Avatar name={username} size={32} />
              <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-silver" />
            </button>
            <Dropdown open={menu} className="right-0 w-[240px] p-2">
              <div className="flex items-center gap-3 p-2.5">
                <Avatar name={username} size={40} />
                <div className="min-w-0"><div className="text-sm font-semibold truncate">{username}</div><div className="text-xs text-silver">Demo account</div></div>
              </div>
              <div className="hairline my-1.5" />
              {[{ to: '/profile', l: 'My Profile', i: User }, { to: '/vip', l: 'VIP Club', i: Crown }, { to: '/rewards', l: 'Rewards', i: Gift }, { to: '/transactions', l: 'Transactions', i: History }, { to: '/settings', l: 'Settings', i: Settings }, { to: '/responsible-gaming', l: 'Responsible gaming', i: ShieldCheck }].map((x) => (
                <Link key={x.to} to={x.to} onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-lg px-2.5 h-9 text-sm text-silver hover:text-snow hover:bg-white/[0.04]"><x.i className="h-4 w-4" />{x.l}</Link>
              ))}
              <div className="hairline my-1.5" />
              <button onClick={() => { setMenu(false); logout() }} className="flex w-full items-center gap-3 rounded-lg px-2.5 h-9 text-sm text-silver hover:text-snow hover:bg-white/[0.04]"><LogOut className="h-4 w-4" />Sign out</button>
            </Dropdown>
          </div>
        )}
      </div>
    </header>
  )
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span className="relative grid place-items-center rounded-full font-display font-bold text-ink shrink-0" style={{ width: size, height: size, fontSize: size * 0.4, background: 'conic-gradient(from 200deg, #F5D778, #D4AF37, #8A6A17, #F5D778)' }}>
      <span className="absolute inset-[2px] rounded-full bg-graphite grid place-items-center text-gold-bright">{name.slice(0, 1).toUpperCase()}</span>
    </span>
  )
}

export function BottomNav({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const loc = useLocation()
  const items = [
    { to: '/', label: 'Lobby', icon: Home },
    { to: '/originals', label: 'Originals', icon: Dices },
    { to: '#search', label: 'Search', icon: Search },
    { to: '/vip', label: 'VIP', icon: Crown },
    { to: '#menu', label: 'Menu', icon: Menu },
  ]
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-steel bg-coal/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 h-16">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === loc.pathname
          const cls = cn('relative flex flex-col items-center justify-center gap-1 text-[10.5px] font-medium', active ? 'text-gold' : 'text-silver')
          const inner = (<>{active && <motion.span layoutId="bn" className="absolute top-0 h-[2px] w-8 rounded-b bg-gold" />}<Icon className="h-5 w-5" />{label}</>)
          if (to === '#menu') return <button key={to} className={cls} onClick={onMenu}>{inner}</button>
          if (to === '#search') return <button key={to} className={cls} onClick={onSearch}>{inner}</button>
          return <Link key={to} to={to} className={cls}>{inner}</Link>
        })}
      </div>
    </nav>
  )
}

export function MobileSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] bg-ink/95 backdrop-blur-xl p-4 pt-5 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
          <div className="flex items-start gap-2">
            <SearchBox autoFocus onPick={onClose} className="flex-1" />
            <button onClick={onClose} className="h-10 px-3 text-sm text-silver">Cancel</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ActivityPanel({ open }: { open: boolean }) {
  const rows = useSimFeed(14, 1800)
  return (
    <AnimatePresence>
      {open && (
        <motion.aside initial={{ x: 340, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 340, opacity: 0 }} transition={{ duration: 0.25 }}
          className="hidden xl:flex fixed right-0 top-16 bottom-0 z-20 w-[320px] flex-col border-l border-steel/70 bg-coal">
          <div className="flex items-center justify-between px-4 h-12 border-b border-steel/70">
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" /></span>Live activity</div>
            <span className="text-[10px] uppercase tracking-wider text-silver">Simulated</span>
          </div>
          <div className="flex-1 overflow-hidden p-2">
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <motion.div key={r.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.03]">
                  <Avatar name={r.user} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-medium truncate">{r.user}</div>
                    <div className="text-[11px] text-silver truncate">{r.game}</div>
                  </div>
                  <div className="text-right">
                    <div className={cn('num text-[12px]', r.multiplier >= 10 ? 'text-gold-bright' : r.multiplier > 0 ? 'text-emerald' : 'text-silver')}>{r.multiplier > 0 ? `+${fmt(r.payout)}` : `-${fmt(r.wager)}`}</div>
                    <div className="num text-[10.5px] text-silver">{r.multiplier.toFixed(2)}×</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="p-3 border-t border-steel/70 text-[11px] text-silver leading-relaxed">Fictional players and outcomes generated in your browser for demonstration. Not real customers.</div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

export function Toasts() {
  const { toasts, dismissToast } = useStore()
  const icon = { gold: Crown, win: CheckCircle2, info: Info, warn: AlertTriangle }
  return (
    <div className="fixed z-[90] bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto flex flex-col gap-2 sm:w-[360px] pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const I = icon[t.tone ?? 'info']
          return (
            <motion.div key={t.id} layout initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.22 }}
              className="pointer-events-auto panel bg-coal/95 backdrop-blur p-3.5 pr-9 shadow-2xl shadow-black/50 relative">
              <div className="flex gap-3">
                <span className={cn('grid h-8 w-8 place-items-center rounded-lg shrink-0', t.tone === 'win' ? 'bg-emerald/15 text-emerald' : t.tone === 'warn' ? 'bg-ruby/15 text-ruby' : 'bg-gold/10 text-gold')}><I className="h-4 w-4" /></span>
                <div className="min-w-0"><div className="text-sm font-semibold">{t.title}</div>{t.body && <div className="text-xs text-silver mt-0.5">{t.body}</div>}</div>
              </div>
              <button onClick={() => dismissToast(t.id)} className="absolute right-2.5 top-2.5 text-silver hover:text-snow" aria-label="Dismiss"><X className="h-3.5 w-3.5" /></button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export function GlobalModals() {
  const { modal, openModal, addCredits, login } = useStore()
  const [amt, setAmt] = useState(5000)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const close = () => openModal(null)
  const submit = () => { setBusy(true); setTimeout(() => { setBusy(false); login(name.trim() || 'aurelius') }, 700) }
  return (
    <>
      <Modal open={modal === 'credits'} onClose={close} title="Add demo credits">
        <p className="mt-1.5 text-sm text-silver">Top up your balance with free Vault Credits for exploring the demo.</p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[1000, 5000, 10000, 25000, 50000, 100000].map((v) => (
            <button key={v} onClick={() => setAmt(v)} className={cn('h-14 rounded-lg border text-sm font-semibold num transition-colors', amt === v ? 'border-gold bg-gold/10 text-gold-bright' : 'border-steel bg-ink text-snow hover:border-[#3a414d]')}>
              {v.toLocaleString()}<span className="block text-[10px] text-silver font-sans font-medium">VC</span>
            </button>
          ))}
        </div>
        <div className="mt-5 rounded-lg border border-steel bg-ink p-3 text-xs text-silver leading-relaxed flex gap-2.5">
          <ShieldCheck className="h-4 w-4 text-gold shrink-0 mt-0.5" />
          Vault Credits (VC) are fictional and non-redeemable. They cannot be purchased, withdrawn, transferred or exchanged for money, crypto or prizes.
        </div>
        <Button variant="gold" size="lg" className="mt-5 w-full" onClick={() => { addCredits(amt); close() }}>Add {amt.toLocaleString()} VC</Button>
      </Modal>
      <Modal open={modal === 'login' || modal === 'register'} onClose={close} title={modal === 'register' ? 'Create your demo account' : 'Log in to VAULT'}>
        <div className="mt-2 flex justify-center py-4"><Logo /></div>
        <div className="space-y-3">
          <input className="input h-11" placeholder="Username" value={name} onChange={(e) => setName(e.target.value)} />
          {modal === 'register' && <input className="input h-11" placeholder="Email (not stored)" />}
          <input className="input h-11" type="password" placeholder="Password (any value)" />
        </div>
        <Button variant="gold" size="lg" className="mt-5 w-full" loading={busy} onClick={submit}>{modal === 'register' ? 'Create account' : 'Log in'}</Button>
        <p className="mt-4 text-center text-xs text-silver">
          {modal === 'register' ? 'Already have an account? ' : 'New to VAULT? '}
          <button className="text-gold-bright hover:underline" onClick={() => openModal(modal === 'register' ? 'login' : 'register')}>{modal === 'register' ? 'Log in' : 'Register'}</button>
        </p>
        <div className="mt-4 flex justify-center"><DemoPill /></div>
        <p className="mt-2 text-center text-[11px] text-silver">This is a prototype. Nothing you enter leaves your browser.</p>
      </Modal>
    </>
  )
}
