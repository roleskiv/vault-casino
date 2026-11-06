import { FEATURES } from '../config'

/**
 * A wallet provider is where money (or demo credits) actually lives.
 *
 * Today only the demo provider exists: balances are fictional Vault Credits
 * kept in the browser. A licensed real-money provider would implement the
 * same shape, but call a server that holds balances, settles game outcomes
 * from a certified RNG and talks to a licensed payments provider. Nothing in
 * this codebase moves real money.
 */
export interface Currency {
  code: string
  label: string
  /** True only for a currency backed by real money. */
  redeemable: boolean
}

export type CashierStatus = 'not_licensed' | 'kyc_required' | 'ready'

export interface WalletProvider {
  mode: 'demo' | 'real'
  currency: Currency
  /** Players can top up for free (demo only). */
  freeTopUps: boolean
  /** State of the deposit and withdrawal screen. */
  cashierStatus(): CashierStatus
}

export const VAULT_CREDITS: Currency = { code: 'VC', label: 'Vault Credits', redeemable: false }

export const demoWallet: WalletProvider = {
  mode: 'demo',
  currency: VAULT_CREDITS,
  freeTopUps: true,
  cashierStatus: () => 'not_licensed',
}

/**
 * Placeholder for a future licensed provider. It reports that no licence is
 * in place and offers no way to deposit or withdraw.
 */
export const realWalletPlaceholder: WalletProvider = {
  mode: 'real',
  currency: { code: '---', label: 'Not available', redeemable: true },
  freeTopUps: false,
  cashierStatus: () => 'not_licensed',
}

export function activeWallet(flags: { REAL_MONEY: boolean } = FEATURES): WalletProvider {
  return flags.REAL_MONEY ? realWalletPlaceholder : demoWallet
}
