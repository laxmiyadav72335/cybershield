import { Bar } from 'react-chartjs-2';
import { VERDICT_COLORS } from './charts';

/** Scans per day for the last 7 days, stacked by verdict. */
export default function WeeklyBar({ scans }) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  const key = (d) => d.toISOString().slice(0, 10);
  const buckets = Object.fromEntries(days.map((d) => [key(d), { safe: 0, suspicious: 0, dangerous: 0 }]));
  scans.forEach((s) => {
    const d = new Date(s.timestamp);
    d.setHours(0, 0, 0, 0);
    const k = key(d);
    if (buckets[k] && buckets[k][s.verdict] != null) buckets[k][s.verdict]++;
  });
  const labels = days.map((d) => d.toLocaleDateString('en-IN', { weekday: 'short' }));
  const ds = (verdict, label) => ({
    label,
    data: days.map((d) => buckets[key(d)][verdict]),
    backgroundColor: VERDICT_COLORS[verdict],
    borderRadius: 4,
    maxBarThickness: 28,
  });
  return (
    <div className="h-56">
      <Bar
        data={{ labels, datasets: [ds('safe', 'Safe'), ds('suspicious', 'Suspicious'), ds('dangerous', 'Dangerous')] }}
        options={{
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
          },
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14 } } },
        }}
      />
    </div>
  );
}
