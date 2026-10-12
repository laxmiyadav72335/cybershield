import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';

/** Glass sign-in card with Google. Redirects back to the page the user came from. */
export default function Login() {
  const { user, loading, configured, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const from = location.state?.from || '/dashboard';

  if (!loading && user) return <Navigate to={from} replace />;

  const signIn = async () => {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      const friendly = {
        'auth/popup-closed-by-user': 'The sign-in window was closed before finishing.',
        'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups and try again.',
        'auth/unauthorized-domain': 'This domain is not authorised in Firebase → Authentication → Settings → Authorized domains.',
        'auth/network-request-failed': 'Network error. Check your connection and try again.',
      };
      setError(friendly[err.code] || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-10">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
        <GlassCard glow className="p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-cyber-cyan/15 text-cyber-cyan ring-1 ring-cyber-cyan/40">
            <Icon name="shield" className="h-8 w-8" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold">Welcome to CyberShield</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to save your scan history and view your dashboard. Guests can still scan.</p>

          <Button className="mt-7 w-full" size="lg" onClick={signIn} disabled={!configured || busy || loading}>
            {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-bg-900/30 border-t-bg-900" /> : <GoogleG />}
            {busy ? 'Signing in…' : 'Continue with Google'}
          </Button>

          {!configured && (
            <p className="mt-3 text-xs text-suspicious">
              Firebase not configured — add VITE_FIREBASE_* keys to client/.env and enable Google sign-in in the Firebase console.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 flex items-start gap-2 text-left text-xs text-danger">
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </p>
          )}

          <ul className="mt-6 space-y-1.5 text-left text-xs text-slate-400">
            {['Scan history with charts on your dashboard', 'Re-open and download past reports as PDF', 'We never store passwords or message text — only summaries'].map((t) => (
              <li key={t} className="flex gap-2"><Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-safe" />{t}</li>
            ))}
          </ul>
        </GlassCard>
      </motion.div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.4c-.5-1.5-.5-3.1 0-4.6V6.7H1.4c-1.7 3.3-1.7 7.3 0 10.6l4-2.9z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  );
}
