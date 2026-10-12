import SourceCard, { Row } from './SourceCard';
import EngineGrid from './EngineGrid';
import GlassCard from '../ui/GlassCard';

/** Findings for a File scan: file identity card + VirusTotal card + engine grid. */
export default function FileFindings({ result }) {
  const vt = result.sources.virusTotal;
  const flagged = vt.stats ? vt.stats.malicious + vt.stats.suspicious : 0;
  const status = !vt.available ? (vt.status === 'rate_limited' ? 'pending' : 'unavailable') : vt.status === 'queued' ? 'pending' : flagged > 0 ? 'danger' : 'ok';
  const label = !vt.available
    ? vt.status === 'rate_limited' ? 'Busy — retry soon' : vt.status === 'not_configured' ? 'Not configured' : 'Unavailable'
    : vt.status === 'queued' ? 'Analysing…' : flagged > 0 ? `${flagged} detections` : 'Clean';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <SourceCard title="File details" status="ok" statusLabel="Hashed locally" delay={0.1}>
          <Row k="Name" v={result.fileName} />
          <Row k="Size" v={result.sizeLabel} />
          <Row k="Type" v={vt.fileType || result.mimeType || 'unknown'} />
          <div className="mt-2 border-t border-white/5 pt-2">
            <p className="text-[11px] text-slate-500">SHA-256</p>
            <p className="break-all font-mono text-[11px] text-slate-300">{result.sha256}</p>
          </div>
          {vt.submitted ? (
            <p className="mt-2 text-[11px] text-cyber-cyan">File was unknown — uploaded for a fresh analysis and discarded.</p>
          ) : vt.found ? (
            <p className="mt-2 text-[11px] text-safe">Known file — looked up by hash, nothing was uploaded.</p>
          ) : null}
        </SourceCard>

        <SourceCard title="VirusTotal" status={status} statusLabel={label} delay={0.2}>
          {vt.available && vt.stats ? (
            <>
              <Row k="Malicious" v={vt.stats.malicious} />
              <Row k="Suspicious" v={vt.stats.suspicious} />
              <Row k="Clean / undetected" v={vt.stats.harmless + vt.stats.undetected} />
              {vt.popularThreat && <Row k="Threat label" v={<span className="text-danger">{vt.popularThreat}</span>} />}
              {vt.families?.length > 0 && <Row k="Malware families" v={vt.families.join(', ')} />}
              {vt.names?.length > 0 && <Row k="Also seen as" v={vt.names.join(', ')} />}
              {vt.permalink && (
                <a href={vt.permalink} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-cyber-cyan hover:underline">
                  View full report on VirusTotal ↗
                </a>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500">{vt.message || 'Detection data could not be fetched for this file.'}</p>
          )}
        </SourceCard>
      </div>

      {vt.available && vt.engines?.length > 0 && (
        <GlassCard className="p-5 sm:p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Antivirus engine results</h3>
          <EngineGrid engines={vt.engines} stats={vt.stats} />
        </GlassCard>
      )}
    </div>
  );
}
