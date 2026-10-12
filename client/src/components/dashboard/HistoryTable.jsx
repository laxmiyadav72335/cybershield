import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SCANNERS, VERDICTS, getScanner } from '../../config/scanners';
import { saveLastResult } from '../../lib/resultStore';
import Icon from '../ui/Icon';

const fmt = (d) => d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Scan history with type filter, "view report" and delete. */
export default function HistoryTable({ scans, onDelete }) {
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const rows = filter === 'all' ? scans : scans.filter((s) => s.scanType === filter);

  const view = (s) => {
    if (!s.report) return;
    saveLastResult(s.report);
    navigate('/result', { state: { result: s.report } });
  };

  return (
    <div>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {[{ id: 'all', label: 'All' }, ...SCANNERS].map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setFilter(s.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === s.id ? 'bg-cyber-cyan/15 text-cyber-cyan ring-1 ring-cyber-cyan/50' : 'bg-white/5 text-slate-300 hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">No scans here yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="pb-2 pr-4 font-medium">When</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 pr-4 font-medium">Item</th>
                <th className="pb-2 pr-4 font-medium text-right">Score</th>
                <th className="pb-2 pr-4 font-medium">Verdict</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((s) => {
                const v = VERDICTS[s.verdict] || VERDICTS.safe;
                const sc = getScanner(s.scanType);
                return (
                  <tr key={s.id} className="group hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap py-2.5 pr-4 text-xs text-slate-400">{fmt(s.timestamp)}</td>
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-200">
                        <Icon name={sc?.icon || 'scan'} className="h-3.5 w-3.5" style={{ color: sc?.accent }} />
                        {sc?.label || s.scanType}
                      </span>
                    </td>
                    <td className="max-w-[260px] py-2.5 pr-4">
                      <span className="block truncate font-mono text-xs text-slate-300" title={s.inputPreview}>{s.inputPreview}</span>
                      <span className="block truncate text-[11px] text-slate-500" title={s.summary}>{s.summary}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-sm font-semibold" style={{ color: v.color }}>{s.threatScore}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${v.bg} ${v.text}`}>{v.label}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100">
                        {s.report && (
                          <button type="button" onClick={() => view(s)} className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-cyber-cyan" title="View report" aria-label="View report">
                            <Icon name="eye" className="h-4 w-4" />
                          </button>
                        )}
                        <button type="button" onClick={() => onDelete(s.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-danger/20 hover:text-danger" title="Delete" aria-label="Delete scan">
                          <Icon name="close" className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
