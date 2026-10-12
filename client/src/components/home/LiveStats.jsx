import { useTotalScans } from '../../hooks/useTotalScans';
import { useCountUp } from '../../hooks/useCountUp';

/**
 * Three stat tiles under the hero. "Total scans" is live from Firestore
 * (stats/global.totalScans) once Firebase is configured.
 */
export default function LiveStats() {
  const { total, isLive, loading } = useTotalScans();
  const animated = useCountUp(total ?? 0);

  const stats = [
    {
      label: 'Total scans',
      value: loading ? '…' : animated.toLocaleString('en-IN'),
      note: isLive ? 'live' : 'demo',
      live: isLive,
    },
    { label: 'Antivirus engines', value: '70+', note: 'VirusTotal' },
    { label: 'Scanner types', value: '6', note: 'Link · File · SMS · QR · IP · Password' },
  ];

  return (
    <dl className="grid max-w-xl grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="glass rounded-xl px-3 py-3 sm:px-4">
          <dt className="text-[11px] uppercase tracking-wider text-slate-400">{s.label}</dt>
          <dd className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">{s.value}</dd>
          <dd className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-500">
            {s.live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-safe" />}
            {s.note}
          </dd>
        </div>
      ))}
    </dl>
  );
}
