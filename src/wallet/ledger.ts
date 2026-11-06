/**
 * Pure wallet rules shared by every wallet provider. No React, no storage,
 * so they can run in tests today and move to a server later unchanged.
 */

export type WagerCheck =
  | { ok: true }
  | { ok: false; reason: 'login' | 'invalid' | 'limit' | 'funds' }

export interface WagerInput {
  loggedIn: boolean
  balance: number
  wager: number
  /** Per-bet cap set by the player, 0 = off. */
  wagerLimit: number
}

export function checkWager({ loggedIn, balance, wager, wagerLimit }: WagerInput): WagerCheck {
  if (!loggedIn) return { ok: false, reason: 'login' }
  if (!(wager > 0) || !Number.isFinite(wager)) return { ok: false, reason: 'invalid' }
  if (wagerLimit > 0 && wager > wagerLimit) return { ok: false, reason: 'limit' }
  if (wager > balance + 1e-9) return { ok: false, reason: 'funds' }
  return { ok: true }
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Balance after a wager is reserved. */
export const debit = (balance: number, wager: number) => round2(balance - wager)

/** What a settled wager pays back (0 on a loss). */
export function payoutFor(wager: number, multiplier: number) {
  if (!(multiplier > 0)) return 0
  return round2(wager * multiplier)
}

/** Balance after a settled wager pays out. */
export const credit = (balance: number, amount: number) => round2(balance + amount)
