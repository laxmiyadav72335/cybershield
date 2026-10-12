import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ParticleNetwork from '../background/ParticleNetwork';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import ErrorBoundary from '../ui/ErrorBoundary';

/**
 * App shell: background → navbar → animated page outlet → footer.
 * Pages fade/slide in on route change.
 */
export default function Layout() {
  const location = useLocation();
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cyber-cyan focus:px-4 focus:py-2 focus:text-bg-900"
      >
        Skip to content
      </a>
      <ParticleNetwork />
      <ScrollToTop />
      <Navbar />
      <main id="main" className="flex-1 px-4 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mx-auto w-full max-w-7xl"
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
