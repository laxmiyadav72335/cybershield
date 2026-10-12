import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { fetchUserScans, deleteScan } from '../services/scans';
import { VERDICTS } from '../config/scanners';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import './../components/dashboard/charts';
import VerdictPie from '../components/dashboard/VerdictPie';
import WeeklyBar from '../components/dashboard/WeeklyBar';
import HistoryTable from '../components/dashboard/HistoryTable';

/** Login-only dashboard: stats, verdict doughnut, 7-day bar chart, history table. */
export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [scans, setScans] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      setScans(await fetchUserScans(user.uid));
    } catch (err) {
      setError(err.code === 'permission-denied' ? 'Permission denied — deploy firestore.rules to your project.' : err.message);
      setScans([]);
    }
  };
  useEffect(() => { load(); }, [user.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (id) => {
    setScans((s) => s.filter((x) => x.id !== id));
    try { await deleteScan(id); } catch { load(); }
  };

  const counts = { safe: 0, suspicious: 0, dangerous: 0 };
  (scans || []).forEach((s) => { if (counts[s.verdict] != null) counts[s.verdict]++; });
  const lastWeek = (scans || []).filter((s) => Date.now() - s.timestamp < 7 * 864e5).length;

  return (
    <div className="py-10">
      <PageHeader eyebrow="Dashboard" title={`Hi, ${user.displayName?.split(' ')[0] || 'there'}`} subtitle="Your scan history and threat overview.">
        <div className="flex items-center gap-3">
          {user.photoURL && <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full ring-2 ring-cyber-cyan/40" referrerPolicy="no-referrer" />}
          <Button variant="secondary" size="sm" onClick={signOut}>Sign out</Button>
        </div>
      </PageHeader>

      {error && (
        <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-slate-200">
          <Icon name="alert" className="h-5 w-5 text-danger" /> {error}
          <Button variant="secondary" size="sm" className="ml-auto" onClick={load}>Retry</Button>
        </div>
      )}

      {scans === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => <div key={i} className="glass h-24 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total scans" value={scans.length} note={`${lastWeek} in the last 7 days`} color="#22D3EE" icon="scan" />
            <Stat label="Safe" value={counts.safe} color={VERDICTS.safe.color} icon="check" />
            <Stat label="Suspicious" value={counts.suspicious} color={VERDICTS.suspicious.color} icon="alert" />
            <Stat label="Dangerous" value={counts.dangerous} color={VERDICTS.dangerous.color} icon="alert" />
          </div>

          {scans.length === 0 ? (
            <GlassCard className="mt-6 p-10 text-center">
              <Icon name="shield" className="mx-auto h-10 w-10 text-cyber-cyan" />
              <h2 className="mt-4 text-xl font-semibold">No scans saved yet</h2>
              <p className="mt-2 text-sm text-slate-400">Every scan you run while signed in will appear here.</p>
              <Button to="/scan" className="mt-6"><Icon name="scan" className="h-4 w-4" /> Run your first scan</Button>
            </GlassCard>
          ) : (
            <>
              <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
                <GlassCard className="p-5">
                  <h3 className="mb-3 text-sm font-semibold text-white">Verdict breakdown</h3>
                  <VerdictPie scans={scans} />
                </GlassCard>
                <GlassCard className="p-5">
                  <h3 className="mb-3 text-sm font-semibold text-white">Scans this week</h3>
                  <WeeklyBar scans={scans} />
                </GlassCard>
              </div>
              <GlassCard className="mt-6 p-5 sm:p-6">
                <h3 className="mb-4 text-sm font-semibold text-white">Scan history</h3>
                <HistoryTable scans={scans} onDelete={remove} />
              </GlassCard>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, note, color, icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass flex items-center gap-4 rounded-2xl p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1" style={{ color, background: `${color}1A`, '--tw-ring-color': `${color}55` }}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
        <p className="font-display text-2xl font-bold text-white">{value}</p>
        {note && <p className="text-[11px] text-slate-500">{note}</p>}
      </div>
    </motion.div>
  );
}
