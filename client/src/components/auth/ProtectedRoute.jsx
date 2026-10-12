import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

/** Wraps login-only pages. Shows a spinner while auth state loads, redirects guests to /login. */
export default function ProtectedRoute({ children }) {
  const { user, loading, configured } = useAuth();
  const location = useLocation();

  if (!configured) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-10">
        <GlassCard className="max-w-md p-10 text-center">
          <Icon name="alert" className="mx-auto h-10 w-10 text-suspicious" />
          <h1 className="mt-4 font-display text-2xl font-bold">Firebase not configured</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign-in and scan history need Firebase. Copy <span className="font-mono">client/.env.example</span> to{' '}
            <span className="font-mono">.env</span> and add your project's keys.
          </p>
          <Button to="/scan" variant="secondary" className="mt-6">Continue as guest</Button>
        </GlassCard>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-cyber-cyan/30 border-t-cyber-cyan" />
        <span className="sr-only">Checking sign-in…</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
