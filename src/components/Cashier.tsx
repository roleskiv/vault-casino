import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Circle, Lock } from 'lucide-react'
import { activeWallet } from '../wallet/provider'
import { useStore } from '../store'
import { Button, Modal } from './ui'

/**
 * Deposit and withdrawal screen for a future licensed launch.
 * Only mounted when FEATURES.REAL_MONEY is on (it is off). It holds no
 * payment fields and moves no money: until a licensed provider is connected
 * it shows what is still missing and keeps both actions disabled.
 */
const LAUNCH_CHECKS = [
  { label: 'Gaming licence', done: false },
  { label: 'Licensed payments provider connected', done: false },
  { label: 'Identity and age checks (KYC)', done: false },
  { label: 'Certified server-side game engine', done: false },
  { label: 'Geo-blocking and enforced limits', done: false },
]

export default function Cashier() {
  const { modal, openModal } = useStore()
  const wallet = activeWallet()
  const ready = wallet.cashierStatus() === 'ready' && LAUNCH_CHECKS.every((c) => c.done)
  return (
    <Modal open={modal === 'cashier'} onClose={() => openModal(null)} title="Cashier">
      <div className="mt-3 flex items-start gap-3 rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-snow">
        <Lock className="h-4 w-4 text-gold shrink-0 mt-0.5" />
        <p>Real-money play is not available yet. Deposits and withdrawals open only after every step below is complete.</p>
      </div>
      <ul className="mt-4 space-y-2">
        {LAUNCH_CHECKS.map((c) => (
          <li key={c.label} className="flex items-center gap-2.5 rounded-lg border border-steel bg-ink px-3 py-2.5 text-sm">
            {c.done ? <CheckCircle2 className="h-4 w-4 text-win" /> : <Circle className="h-4 w-4 text-silver" />}
            <span className={c.done ? 'text-snow' : 'text-silver'}>{c.label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="gold" size="lg" disabled={!ready}><ArrowDownToLine className="h-4 w-4" />Deposit</Button>
        <Button variant="ghost" size="lg" disabled={!ready}><ArrowUpFromLine className="h-4 w-4" />Withdraw</Button>
      </div>
    </Modal>
  )
}
