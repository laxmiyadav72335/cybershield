import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PageLoader from './components/ui/PageLoader';
import Home from './pages/Home';

// Route-level code splitting: heavy pages (PDF, QR decoder) load on demand.
const Scanner = lazy(() => import('./pages/Scanner'));
const Result = lazy(() => import('./pages/Result'));
const Awareness = lazy(() => import('./pages/Awareness'));
const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * Route map
 *  /                 Home
 *  /scan             → redirects to /scan/url
 *  /scan/:type       Scanner (url | file | message | qr | ip | password)
 *  /result           Result (router state or sessionStorage)
 *  /awareness        Scam awareness + quiz
 */
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/scan" element={<Navigate to="/scan/url" replace />} />
            <Route path="/scan/:type" element={<Scanner />} />
            <Route path="/result" element={<Result />} />
            <Route path="/awareness" element={<Awareness />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
