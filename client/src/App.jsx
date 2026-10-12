import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import PageLoader from './components/ui/PageLoader';
import Home from './pages/Home';

// Route-level code splitting: heavy pages (charts, PDF, QR decoder) load on demand.
const Scanner = lazy(() => import('./pages/Scanner'));
const Result = lazy(() => import('./pages/Result'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Awareness = lazy(() => import('./pages/Awareness'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * Route map
 *  /                 Home
 *  /scan             → redirects to /scan/url
 *  /scan/:type       Scanner (url | file | message | qr | ip | password)
 *  /result           Result (router state or sessionStorage)
 *  /dashboard        Dashboard (login required)
 *  /awareness        Scam awareness + quiz
 *  /login            Google sign-in
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/scan" element={<Navigate to="/scan/url" replace />} />
              <Route path="/scan/:type" element={<Scanner />} />
              <Route path="/result" element={<Result />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/awareness" element={<Awareness />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
