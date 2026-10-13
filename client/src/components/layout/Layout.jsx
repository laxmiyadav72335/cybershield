import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ParticleNetwork from '../background/ParticleNetwork';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import ErrorBoundary from '../ui/ErrorBoundary';
import PageLoader from '../ui/PageLoader';

/**
 * Keep route content visible immediately. Waiting for an exiting page's
 * animation can strand a lazy-loaded or redirected route at opacity zero.
 */
export default function Layout() {
  const location = useLocation();
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <a
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById('main');
          main?.focus({ preventScroll: true });
          main?.scrollIntoView({ block: 'start' });
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cyber-cyan focus:px-4 focus:py-2 focus:text-bg-900"
      >
        Skip to content
      </a>
      <ParticleNetwork />
      <ScrollToTop />
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 px-4 sm:px-6">
        <div className="mx-auto w-full max-w-7xl">
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      <Footer />
    </div>
  );
}
