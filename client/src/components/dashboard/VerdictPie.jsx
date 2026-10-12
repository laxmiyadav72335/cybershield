import { Doughnut } from 'react-chartjs-2';
import { VERDICT_COLORS } from './charts';

/** Safe vs Suspicious vs Dangerous split of the user's scans. */
export default function VerdictPie({ scans }) {
  const counts = { safe: 0, suspicious: 0, dangerous: 0 };
  scans.forEach((s) => { if (counts[s.verdict] != null) counts[s.verdict]++; });
  const total = scans.length;
  const data = {
    labels: ['Safe', 'Suspicious', 'Dangerous'],
    datasets: [{
      data: [counts.safe, counts.suspicious, counts.dangerous],
      backgroundColor: [VERDICT_COLORS.safe, VERDICT_COLORS.suspicious, VERDICT_COLORS.dangerous],
      borderColor: '#0a0f1f',
      borderWidth: 3,
      hoverOffset: 6,
    }],
  };
  return (
    <div className="relative mx-auto h-56 w-56">
      <Doughnut
        data={data}
        options={{
          cutout: '68%',
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14 } }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw} (${total ? Math.round((c.raw / total) * 100) : 0}%)` } } },
          animation: { animateRotate: true, duration: 900 },
        }}
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
        <span className="font-display text-3xl font-bold text-white">{total}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400">scans</span>
      </div>
    </div>
  );
}
