# Real-money readiness

VAULT runs on fictional, non-redeemable Vault Credits. Nothing in this
codebase accepts, holds or pays out real money, and it must not until the
company holds a gaming licence.

This document describes the seams that are in place so a licensed backend
can be added later without rewriting the games.

## The switch

`src/config.ts` exports `FEATURES.REAL_MONEY`. It is `false`, and
`src/wallet/wallet.test.ts` fails the build if it is changed. Turning it on
is meant to be a deliberate, reviewed change made only at launch.

While it is off:

- the header button reads **Add Credits** and opens the free demo top-up;
- the cashier screen is never loaded (it is dropped from the production build).

## Wallet layer

| File | Role |
|---|---|
| `src/wallet/ledger.ts` | Pure rules: wager checks (sign-in, limits, funds), debit, payout and credit, rounded to cents. Covered by tests. |
| `src/wallet/provider.ts` | The `WalletProvider` shape, the demo wallet (Vault Credits) and a real-money placeholder that reports `not_licensed`. |
| `src/store.tsx` | Uses the ledger for every bet, so the same rules apply when they move server-side. |
| `src/components/Cashier.tsx` | Deposit and withdrawal screen. Shows the launch checklist with both buttons disabled. It has no payment fields. |

## What a licensed launch still needs

1. A gaming licence and an operating company in the chosen jurisdiction.
2. A server that owns balances and settles every game from a certified RNG.
   Today outcomes are decided in the browser, which is fine for a demo but
   not for real money. Games would request an outcome from the server and
   only animate the result.
3. A licensed payments provider (card and crypto) with KYC, age checks and
   anti-money-laundering controls. The cashier would call that provider; it
   would never collect card or wallet details itself.
4. Geo-blocking, enforced deposit and loss limits, self-exclusion, and
   segregated player funds.
5. An independent audit of the game maths and RNG.
