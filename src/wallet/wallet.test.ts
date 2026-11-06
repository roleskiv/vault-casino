import { describe, expect, it } from 'vitest'
import { FEATURES } from '../config'
import { checkWager, credit, debit, payoutFor } from './ledger'
import { activeWallet, demoWallet, realWalletPlaceholder } from './provider'

describe('real-money switch', () => {
  it('is off: VAULT is not licensed for real-money play', () => {
    expect(FEATURES.REAL_MONEY).toBe(false)
  })
  it('the active wallet is the demo wallet with non-redeemable credits', () => {
    const w = activeWallet()
    expect(w).toBe(demoWallet)
    expect(w.currency.redeemable).toBe(false)
    expect(w.freeTopUps).toBe(true)
  })
  it('the real-money placeholder offers no working cashier', () => {
    expect(activeWallet({ REAL_MONEY: true })).toBe(realWalletPlaceholder)
    expect(realWalletPlaceholder.cashierStatus()).toBe('not_licensed')
    expect(realWalletPlaceholder.freeTopUps).toBe(false)
  })
})

describe('ledger rules', () => {
  const base = { loggedIn: true, balance: 100, wager: 10, wagerLimit: 0 }
  it('accepts a normal wager', () => expect(checkWager(base)).toEqual({ ok: true }))
  it('needs a signed-in player', () => expect(checkWager({ ...base, loggedIn: false })).toEqual({ ok: false, reason: 'login' }))
  it('rejects zero, negative and non-numeric wagers', () => {
    for (const wager of [0, -5, NaN, Infinity]) expect(checkWager({ ...base, wager })).toEqual({ ok: false, reason: 'invalid' })
  })
  it('enforces the per-bet limit', () => {
    expect(checkWager({ ...base, wagerLimit: 5 })).toEqual({ ok: false, reason: 'limit' })
    expect(checkWager({ ...base, wagerLimit: 10 })).toEqual({ ok: true })
  })
  it('rejects wagers above the balance', () => {
    expect(checkWager({ ...base, wager: 100.01 })).toEqual({ ok: false, reason: 'funds' })
    expect(checkWager({ ...base, wager: 100 })).toEqual({ ok: true })
  })
  it('rounds money to cents', () => {
    expect(debit(0.3, 0.1)).toBe(0.2)
    expect(credit(0.1, 0.2)).toBe(0.3)
    expect(payoutFor(3, 1.955)).toBe(5.87)
    expect(payoutFor(10, 0)).toBe(0)
    expect(payoutFor(10, NaN)).toBe(0)
  })
  it('a full bet round never creates money from nothing', () => {
    let bal = 1000
    for (const m of [0, 1, 1.98, 0, 24, 0.5]) { bal = debit(bal, 10); bal = credit(bal, payoutFor(10, m)) }
    expect(bal).toBe(1000 - 60 + 10 * (0 + 1 + 1.98 + 0 + 24 + 0.5))
  })
})
