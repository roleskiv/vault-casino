import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { uid } from './lib/format'

export interface BetRecord { id: string; game: string; gameId: string; wager: number; multiplier: number; payout: number; time: number }
export interface Txn { id: string; type: 'credit' | 'wager' | 'payout' | 'reward'; amount: number; note: string; time: number }
export interface Toast { id: string; title: string; body?: string; tone?: 'gold' | 'win' | 'info' | 'warn' }
export interface Settings {
  hideBalance: boolean
  sounds: boolean
  reduceMotion: boolean
  sessionReminder: number // minutes, 0 = off
  wagerLimit: number // per-bet cap, 0 = off
  instantBet: boolean
}

interface State {
  loggedIn: boolean
  username: string
  balance: number
  wagered: number
  bets: BetRecord[]
  txns: Txn[]
  favorites: string[]
  settings: Settings
  claimed: string[]
}

const DEFAULT: State = {
  loggedIn: true,
  username: 'aurelius',
  balance: 12450,
  wagered: 142_300,
  bets: [],
  txns: [
    { id: 'seed1', type: 'credit', amount: 10000, note: 'Welcome demo credits', time: Date.now() - 86400e3 * 3 },
    { id: 'seed2', type: 'reward', amount: 2450, note: 'Gold level-up bonus (demo)', time: Date.now() - 86400e3 * 1.2 },
  ],
  favorites: ['vault-crash', 'vault-mines', 'sakura-drift'],
  settings: { hideBalance: false, sounds: false, reduceMotion: false, sessionReminder: 60, wagerLimit: 0, instantBet: false },
  claimed: [],
}

const KEY = 'vault-demo-state-v1'
function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULT, ...JSON.parse(raw), settings: { ...DEFAULT.settings, ...JSON.parse(raw).settings } }
  } catch { /* storage unavailable */ }
  return DEFAULT
}

type Modal = null | 'credits' | 'login' | 'register'

interface Ctx extends State {
  toasts: Toast[]
  modal: Modal
  openModal: (m: Modal) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  /** Reserve a wager. Returns false (and explains why) when it can't be placed. */
  placeBet: (wager: number) => boolean
  /** Settle a previously placed wager with a final multiplier (0 = loss). */
  settle: (gameId: string, game: string, wager: number, multiplier: number) => void
  addCredits: (amount: number) => void
  claimReward: (id: string, amount: number, note: string) => void
  login: (name: string) => void
  logout: () => void
  toggleFavorite: (id: string) => void
  updateSettings: (p: Partial<Settings>) => void
  resetDemo: () => void
}

const StoreCtx = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(load)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [modal, setModal] = useState<Modal>(null)
  const ref = useRef(s)
  ref.current = s

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ }
  }, [s])

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = uid()
    setToasts((all) => [...all.slice(-3), { ...t, id }])
    setTimeout(() => dismissToast(id), 3600)
  }, [dismissToast])

  const placeBet = useCallback((wager: number) => {
    const cur = ref.current
    if (!cur.loggedIn) { setModal('login'); return false }
    if (!(wager > 0)) { toast({ title: 'Enter a demo wager', body: 'Wager must be greater than 0 VC.', tone: 'warn' }); return false }
    if (cur.settings.wagerLimit > 0 && wager > cur.settings.wagerLimit) {
      toast({ title: 'Wager limit reached', body: `Your demo limit is ${cur.settings.wagerLimit.toLocaleString()} VC per bet.`, tone: 'warn' }); return false
    }
    if (wager > cur.balance + 1e-9) { toast({ title: 'Not enough demo credits', body: 'Add free demo credits from your wallet.', tone: 'warn' }); return false }
    const next = { ...cur, balance: +(cur.balance - wager).toFixed(2), wagered: cur.wagered + wager }
    ref.current = next
    setS(next)
    return true
  }, [toast])

  const settle = useCallback((gameId: string, game: string, wager: number, multiplier: number) => {
    const payout = +(wager * multiplier).toFixed(2)
    const time = Date.now()
    const bet: BetRecord = { id: uid(), game, gameId, wager, multiplier, payout, time }
    setS((cur) => {
      const txns: Txn[] = [{ id: uid(), type: 'wager', amount: -wager, note: game, time }]
      if (payout > 0) txns.unshift({ id: uid(), type: 'payout', amount: payout, note: `${game} · ${multiplier.toFixed(2)}×`, time })
      const next = { ...cur, balance: +(cur.balance + payout).toFixed(2), bets: [bet, ...cur.bets].slice(0, 200), txns: [...txns, ...cur.txns].slice(0, 300) }
      ref.current = next
      return next
    })
  }, [])

  const addCredits = useCallback((amount: number) => {
    setS((cur) => ({ ...cur, balance: cur.balance + amount, txns: [{ id: uid(), type: 'credit' as const, amount, note: 'Demo credits added', time: Date.now() }, ...cur.txns] }))
    toast({ title: `+${amount.toLocaleString()} VC added`, body: 'Demo credits have no cash value.', tone: 'gold' })
  }, [toast])

  const claimReward = useCallback((id: string, amount: number, note: string) => {
    setS((cur) => cur.claimed.includes(id) ? cur : ({
      ...cur, balance: cur.balance + amount, claimed: [...cur.claimed, id],
      txns: [{ id: uid(), type: 'reward' as const, amount, note, time: Date.now() }, ...cur.txns],
    }))
    toast({ title: `Reward claimed: +${amount.toLocaleString()} VC`, body: note, tone: 'gold' })
  }, [toast])

  const login = useCallback((name: string) => {
    setS((cur) => ({ ...cur, loggedIn: true, username: name || cur.username }))
    setModal(null)
    toast({ title: `Welcome back, ${name || 'player'}`, body: 'You are signed in to the VAULT demo.', tone: 'gold' })
  }, [toast])
  const logout = useCallback(() => {
    setS((cur) => ({ ...cur, loggedIn: false }))
    toast({ title: 'Signed out', body: 'You are browsing as a guest.', tone: 'info' })
  }, [toast])
  const toggleFavorite = useCallback((id: string) => {
    setS((cur) => ({ ...cur, favorites: cur.favorites.includes(id) ? cur.favorites.filter((f) => f !== id) : [...cur.favorites, id] }))
  }, [])
  const updateSettings = useCallback((p: Partial<Settings>) => setS((cur) => ({ ...cur, settings: { ...cur.settings, ...p } })), [])
  const resetDemo = useCallback(() => { setS(DEFAULT); toast({ title: 'Demo reset', body: 'Balance and history restored to defaults.', tone: 'info' }) }, [toast])

  const value = useMemo<Ctx>(() => ({
    ...s, toasts, modal, openModal: setModal, toast, dismissToast, placeBet, settle, addCredits, claimReward,
    login, logout, toggleFavorite, updateSettings, resetDemo,
  }), [s, toasts, modal, toast, dismissToast, placeBet, settle, addCredits, claimReward, login, logout, toggleFavorite, updateSettings, resetDemo])

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('useStore outside provider')
  return c
}
