/**
 * Feature switches.
 *
 * REAL_MONEY must stay `false` until VAULT holds a gaming licence and has a
 * licensed payments provider, identity checks (KYC/AML) and a certified
 * server-side game engine in place. A unit test fails the build if it is
 * switched on, so turning it on is a deliberate, reviewed change.
 */
export const FEATURES = {
  REAL_MONEY: false,
} as const
