import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import logoFull from './assets/vault-logo-full.webp'
import { Footer } from './components/Footer'
import { ActivityPanel, BottomNav, GlobalModals, MobileDrawer, MobileSearch, Sidebar, Toasts, TopNav } from './components/Layout'
import { cn } from './lib/format'
import Home from './pages/Home'
import { PageFallback } from './components/PageFallback'

// Everything except the lobby loads on demand, so the first visit downloads less.
const browse = () => import('./pages/Browse')
const community = () => import('./pages/Community')
const account = () => import('./pages/Account')
const OriginalsPage = lazy(() => browse().then((m) => ({ default: m.OriginalsPage })))
const CategoryPage = lazy(() => browse().then((m) => ({ default: m.CategoryPage })))
const SportsPage = lazy(() => browse().then((m) => ({ default: m.SportsPage })))
const GamePage = lazy(() => import('./pages/GamePage'))
const PromotionsPage = lazy(() => community().then((m) => ({ default: m.PromotionsPage })))
const TournamentsPage = lazy(() => community().then((m) => ({ default: m.TournamentsPage })))
const LeaderboardsPage = lazy(() => community().then((m) => ({ default: m.LeaderboardsPage })))
const VipPage = lazy(() => import('./pages/Vip'))
const ProfilePage = lazy(() => account().then((m) => ({ default: m.ProfilePage })))
const RewardsPage = lazy(() => account().then((m) => ({ default: m.RewardsPage })))
const TransactionsPage = lazy(() => account().then((m) => ({ default: m.TransactionsPage })))
const SettingsPage = lazy(() => account().then((m) => ({ default: m.SettingsPage })))
const ResponsiblePage = lazy(() => account().then((m) => ({ default: m.ResponsiblePage })))
const NotFound = lazy(() => account().then((m) => ({ default: m.NotFound })))
import { useStore } from './store'
import { BigWin, DailySpinModal, Tour } from './components/Polish'

function Splash({ done }: { done: boolean }) {
  return (
    <AnimatePresence>
      {!done && (
        <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-ink" exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex flex-col items-center">
            <motion.img src={logoFull} alt="VAULT" className="w-[180px]" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} />
            <div className="mt-8 h-[2px] w-40 overflow-hidden rounded bg-steel">
              <motion.div className="h-full gold-fill" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 0.9, ease: 'easeInOut' }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const loc = useLocation()
  const { settings } = useStore()
  const [collapsed, setCollapsed] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [search, setSearch] = useState(false)
  const [activity, setActivity] = useState(false)
  const [booted, setBooted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setBooted(true), 750); return () => clearTimeout(t) }, [])
  useEffect(() => { window.scrollTo({ top: 0 }); setDrawer(false); setSearch(false) }, [loc.pathname])

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'user'}>
      <Splash done={booted} />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} />
      <MobileSearch open={search} onClose={() => setSearch(false)} />
      <div className={cn('min-h-full transition-[padding] duration-[250ms] ease-out', collapsed ? 'lg:pl-[76px]' : 'lg:pl-[248px]', activity && 'xl:pr-[320px]')}>
        <TopNav onMenu={() => setDrawer(true)} onActivity={() => setActivity((a) => !a)} activityOpen={activity} />
        <ActivityPanel open={activity} />
        <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-6">
          <AnimatePresence mode="wait">
            <motion.div key={loc.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}>
              <Suspense fallback={<PageFallback />}>
              <Routes location={loc}>
                <Route path="/" element={<Home />} />
                <Route path="/originals" element={<OriginalsPage />} />
                <Route path="/slots" element={<CategoryPage kind="slots" />} />
                <Route path="/live" element={<CategoryPage kind="live" />} />
                <Route path="/sports" element={<SportsPage />} />
                <Route path="/game/:id" element={<GamePage />} />
                <Route path="/promotions" element={<PromotionsPage />} />
                <Route path="/tournaments" element={<TournamentsPage />} />
                <Route path="/leaderboards" element={<LeaderboardsPage />} />
                <Route path="/vip" element={<VipPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/rewards" element={<RewardsPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/responsible-gaming" element={<ResponsiblePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
        <div className="h-16 lg:hidden" />
      </div>
      <BottomNav onMenu={() => setDrawer(true)} onSearch={() => setSearch(true)} />
      <Toasts />
      <GlobalModals />
      <DailySpinModal />
      <Tour />
      <BigWin />
    </MotionConfig>
  )
}
