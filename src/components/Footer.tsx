import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from './ui'

const COLS = [
  { h: 'Casino', l: [['Originals', '/originals'], ['Slots', '/slots'], ['Live Casino', '/live'], ['Sportsbook', '/sports']] },
  { h: 'Community', l: [['Promotions', '/promotions'], ['Tournaments', '/tournaments'], ['Leaderboards', '/leaderboards'], ['VIP Club', '/vip']] },
  { h: 'Support', l: [['Responsible gaming', '/responsible-gaming'], ['Fairness', '/responsible-gaming#fairness'], ['Help centre (placeholder)', '/responsible-gaming'], ['Contact (placeholder)', '/responsible-gaming']] },
  { h: 'Legal', l: [['Terms of service (placeholder)', '/responsible-gaming'], ['Privacy policy (placeholder)', '/responsible-gaming'], ['Demo credit policy', '/responsible-gaming'], ['Cookie notice (placeholder)', '/responsible-gaming']] },
]

export function Footer() {
  return (
    <footer className="mt-16 border-t border-steel/70 bg-coal/60">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-silver leading-relaxed">
              VAULT is a front-end design prototype. All games run on fictional, non-redeemable Vault Credits (VC). No real money, cryptocurrency, deposits, withdrawals or prizes are involved.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-steel px-2.5 h-8 text-xs font-semibold text-silver"><span className="grid h-5 w-5 place-items-center rounded-full border border-silver/60 text-[9px]">18+</span> Adults only</span>
              <Link to="/responsible-gaming" className="inline-flex items-center gap-1.5 rounded-md border border-steel px-2.5 h-8 text-xs font-semibold text-silver hover:text-snow"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> Play responsibly</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {COLS.map((c) => (
              <div key={c.h}>
                <div className="label mb-3">{c.h}</div>
                <ul className="space-y-2.5">
                  {c.l.map(([t, to]) => <li key={t}><Link to={to} className="text-sm text-silver hover:text-snow transition-colors">{t}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="hairline my-8" />
        <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs text-silver leading-relaxed">
          <p className="max-w-3xl">
            Licensing information placeholder. If gaming stops being fun, take a break. Support organisations exist in most countries; a real platform would list local helplines here.
            Simulated activity shown on this site uses fictional players and is generated in your browser.
          </p>
          <p className="shrink-0">© {new Date().getFullYear()} VAULT · Demo prototype</p>
        </div>
      </div>
    </footer>
  )
}
