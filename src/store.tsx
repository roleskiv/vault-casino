import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { uid } from './lib/format'
import { setSfxEnabled, sfx } from './lib/sfx'
import { checkWager, credit, debit, payoutFor } from './wallet/ledger'

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
  tourDone: boolean
  lastDailySpin: number
}

export interface Celebration { id: string; game: string; multiplier: number; payout: number }
export const DAILY_MS = 24 * 3600e3

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
  settings: { hideBalance: false, sounds: true, reduceMotion: false, sessionReminder: 60, wagerLimit: 0, instantBet: false },
  claimed: [],
  tourDone: false,
  lastDailySpin: 0,
}

const KEY = 'vault-demo-state-v1'
function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw)
      const settings = { ...DEFAULT.settings, ...p.settings }
      // sounds were a placeholder before v2; switch them on once for existing demo states
      if (p.lastDailySpin === undefined) settings.sounds = true
      return { ...DEFAULT, ...p, settings }
    }
  } catch { /* storage unavailable */ }
  return DEFAULT
}

type Modal = null | 'credits' | 'cashier' | 'login' | 'register' | 'daily' | 'tour'

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
  celebration: Celebration | null
  clearCelebration: () => void
  claimDailySpin: (amount: number) => void
  finishTour: () => void
}

const StoreCtx = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(load)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [modal, setModal] = useState<Modal>(null)
  const [celebration, setCelebration] = useState<Celebration | null>(null)
  const lastCeleb = useRef(0)
  const ref = useRef(s)
  ref.current = s
  useEffect(() => { setSfxEnabled(s.settings.sounds) }, [s.settings.sounds])

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
    const check = checkWager({ loggedIn: cur.loggedIn, balance: cur.balance, wager, wagerLimit: cur.settings.wagerLimit })
    if (!check.ok) {
      if (check.reason === 'login') setModal('login')
      else if (check.reason === 'invalid') toast({ title: 'Enter a demo wager', body: 'Wager must be greater than 0 VC.', tone: 'warn' })
      else if (check.reason === 'limit') toast({ title: 'Wager limit reached', body: `Your demo limit is ${cur.settings.wagerLimit.toLocaleString()} VC per bet.`, tone: 'warn' })
      else toast({ title: 'Not enough demo credits', body: 'Add free demo credits from your wallet.', tone: 'warn' })
      return false
    }
    const next = { ...cur, balance: debit(cur.balance, wager), wagered: cur.wagered + wager }
    ref.current = next
    setS(next)
    sfx('bet')
    return true
  }, [toast])

  const settle = useCallback((gameId: string, game: string, wager: number, multiplier: number) => {
    const payout = payoutFor(wager, multiplier)
    const time = Date.now()
    const bet: BetRecord = { id: uid(), game, gameId, wager, multiplier, payout, time }
    const big = multiplier >= 10 && payout > wager
    if (big) sfx('bigwin'); else if (payout > wager) sfx('win'); else if (payout > 0) sfx('coin'); else sfx('lose')
    if (big && Date.now() - lastCeleb.current > 3500) {
      lastCeleb.current = Date.now()
      setCelebration({ id: uid(), game, multiplier, payout })
    }
    setS((cur) => {
      const txns: Txn[] = [{ id: uid(), type: 'wager', amount: -wager, note: game, time }]
      if (payout > 0) txns.unshift({ id: uid(), type: 'payout', amount: payout, note: `${game} · ${multiplier.toFixed(2)}×`, time })
      const next = { ...cur, balance: credit(cur.balance, payout), bets: [bet, ...cur.bets].slice(0, 200), txns: [...txns, ...cur.txns].slice(0, 300) }
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
  const clearCelebration = useCallback(() => setCelebration(null), [])
  const claimDailySpin = useCallback((amount: number) => {
    setS((cur) => Date.now() - cur.lastDailySpin < DAILY_MS ? cur : ({
      ...cur, balance: cur.balance + amount, lastDailySpin: Date.now(),
      txns: [{ id: uid(), type: 'reward' as const, amount, note: 'Daily free spin', time: Date.now() }, ...cur.txns],
    }))
  }, [])
  const finishTour = useCallback(() => { setS((cur) => ({ ...cur, tourDone: true })); setModal(null) }, [])
  const resetDemo = useCallback(() => { setS({ ...DEFAULT, tourDone: true }); toast({ title: 'Demo reset', body: 'Balance and history restored to defaults.', tone: 'info' }) }, [toast])

  const value = useMemo<Ctx>(() => ({
    ...s, toasts, modal, openModal: setModal, toast, dismissToast, placeBet, settle, addCredits, claimReward,
    login, logout, toggleFavorite, updateSettings, resetDemo, celebration, clearCelebration, claimDailySpin, finishTour,
  }), [s, toasts, modal, toast, dismissToast, placeBet, settle, addCredits, claimReward, login, logout, toggleFavorite, updateSettings, resetDemo, celebration, clearCelebration, claimDailySpin, finishTour])

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('useStore outside provider')
  return c
}
