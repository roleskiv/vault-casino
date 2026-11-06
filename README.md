# VAULT — demo casino prototype

Front-end prototype using fictional, non-redeemable Vault Credits (VC). No payments, crypto, or real-money play.

Stack: React 18 + TypeScript + Vite, Tailwind CSS 3, Framer Motion, Lucide, Recharts.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # dist/
npm run build:single # dist-single/index.html (one self-contained file)
```

## Layout
- `src/components` — layout shell (sidebar, top nav, bottom nav, drawer, activity panel, modals, toasts), cards/shelves, procedural game art, tier emblems, hero
- `src/games` — playable Originals (Mines, Crash, Dice, Plinko) + a themed demo slot engine, all on a shared `GameShell`
- `src/pages` — Lobby, Originals, Slots, Live (mock), Sportsbook (preview), Promotions, Tournaments, Leaderboards, VIP, Profile, Rewards, Transactions, Settings, Responsible gaming
- `src/store.tsx` — local demo state (balance, bets, ledger, favourites, settings) persisted to localStorage
- `src/assets` — logo crops made from the supplied VAULT logo (emblem, wordmark, full logo, favicon, app icon)

## Hosting
Every push to `main` builds the site and deploys it to GitHub Pages via `.github/workflows/deploy.yml`.
Live site: https://roleskiv.github.io/vault-casino/
