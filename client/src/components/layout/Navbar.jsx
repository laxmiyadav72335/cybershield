import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/', label: 'Home', icon: 'shield', end: true },
  { to: '/scan', label: 'Scanner', icon: 'scan' },
  { to: '/dashboard', label: 'Dashboard', icon: 'chart' },
  { to: '/awareness', label: 'Awareness', icon: 'book' },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
    isActive ? 'text-cyber-cyan bg-cyber-cyan/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
  }`;

/** Sticky glass navigation bar with a mobile drawer. Auth state wired in Phase 5. */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
      <nav className="glass mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2.5" aria-label="CyberShield home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyber-cyan/15 text-cyber-cyan ring-1 ring-cyber-cyan/40">
            <Icon name="shield" className="h-5 w-5" />
          </span>
          <span className="font-display text-base font-bold tracking-wider text-white">
            Cyber<span className="text-cyber-cyan">Shield</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end} className={linkClass}>
                <Icon name={l.icon} className="h-4 w-4" />
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-200 hover:bg-white/5" title={user.email}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="h-7 w-7 rounded-full ring-1 ring-cyber-cyan/40" referrerPolicy="no-referrer" />
                ) : (
                  <Icon name="user" className="h-5 w-5" />
                )}
                <span className="max-w-[120px] truncate">{user.displayName?.split(' ')[0] || 'Account'}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
            </div>
          ) : (
            <Button to="/login" variant="secondary" size="sm">
              <Icon name="user" className="h-4 w-4" />
              Sign in
            </Button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-200 hover:bg-white/5 md:hidden"
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          <Icon name={open ? 'close' : 'menu'} className="h-6 w-6" />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="glass mx-auto mt-2 max-w-7xl rounded-2xl p-2 md:hidden"
          >
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => setOpen(false)}>
                <Icon name={l.icon} className="h-4 w-4" />
                {l.label}
              </NavLink>
            ))}
            <div className="p-2">
              {user ? (
                <Button variant="secondary" size="sm" className="w-full" onClick={() => { signOut(); setOpen(false); }}>
                  Sign out ({user.displayName?.split(' ')[0] || user.email})
                </Button>
              ) : (
                <Button to="/login" variant="secondary" size="sm" className="w-full" onClick={() => setOpen(false)}>
                  <Icon name="user" className="h-4 w-4" />
                  Sign in with Google
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
