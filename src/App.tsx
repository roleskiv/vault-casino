import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import logoFull from './assets/vault-logo-full.png'
import { Footer } from './components/Footer'
import { ActivityPanel, BottomNav, GlobalModals, MobileDrawer, MobileSearch, Sidebar, Toasts, TopNav } from './components/Layout'
import { cn } from './lib/format'
import Home from './pages/Home'
import { CategoryPage, OriginalsPage, SportsPage } from './pages/Browse'
import GamePage from './pages/GamePage'
import { PromotionsPage, TournamentsPage, LeaderboardsPage } from './pages/Community'
import VipPage from './pages/Vip'
import { ProfilePage, RewardsPage, TransactionsPage, SettingsPage, ResponsiblePage, NotFound } from './pages/Account'
import { useStore } from './store'

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
  useEffect(() => { const t = setTimeout(() => setBooted(true), 1100); return () => clearTimeout(t) }, [])
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
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
        <div className="h-16 lg:hidden" />
      </div>
      <BottomNav onMenu={() => setDrawer(true)} onSearch={() => setSearch(true)} />
      <Toasts />
      <GlobalModals />
    </MotionConfig>
  )
}
