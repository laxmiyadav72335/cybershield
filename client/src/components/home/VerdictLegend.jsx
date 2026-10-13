import { VERDICTS } from '../../config/scanners';

/** Small strip explaining scored verdicts and unavailable results. */
export default function VerdictLegend() {
  const ranges = { unknown: 'No score available', safe: 'Score 0 – 30', suspicious: 'Score 31 – 60', dangerous: 'Score 61 – 100' };
  return (
    <section className="py-8">
      <div className="glass mx-auto grid max-w-4xl gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(VERDICTS).map(([key, v]) => (
          <div key={key} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${v.bg} ring-1 ${v.ring}`}>
            <span className="h-3 w-3 rounded-full" style={{ background: v.color, boxShadow: `0 0 12px ${v.color}` }} />
            <div>
              <p className={`text-sm font-semibold ${v.text}`}>{v.label}</p>
              <p className="text-xs text-slate-400">{ranges[key]}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
