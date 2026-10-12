import SourceCard, { Row } from './SourceCard';
import EngineGrid from './EngineGrid';
import GlassCard from '../ui/GlassCard';
import Icon from '../ui/Icon';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** Detailed findings for a Link scan: one card per source + the engine grid. */
export default function UrlFindings({ result }) {
  const { safeBrowsing: sb, virusTotal: vt, domainAge: da, heuristics: h } = result.sources;

  const vtStatus = !vt.available
    ? vt.status === 'rate_limited' ? 'pending' : 'unavailable'
    : vt.status === 'queued' ? 'pending'
    : (vt.stats.malicious > 0) ? 'danger' : (vt.stats.suspicious > 0) ? 'warn' : 'ok';
  const vtLabel = !vt.available
    ? vt.status === 'rate_limited' ? 'Busy — retry soon' : vt.status === 'not_configured' ? 'Not configured' : 'Unavailable'
    : vt.status === 'queued' ? 'Analysing…' : undefined;

  const heurWarns = h.flags.filter((f) => f.severity === 'warn');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <SourceCard
          title="Google Safe Browsing"
          status={!sb.available ? 'unavailable' : sb.matched ? 'danger' : 'ok'}
          statusLabel={!sb.available ? (sb.reason === 'not_configured' ? 'Not configured' : 'Unavailable') : sb.matched ? 'Flagged' : 'No match'}
          delay={0.1}
        >
          {!sb.available ? (
            <p className="text-xs text-slate-500">Google's phishing & malware blocklist could not be queried for this scan.</p>
          ) : sb.matched ? (
            <ul className="space-y-1">
              {sb.threats.map((t) => (
                <li key={t} className="flex items-center gap-2 text-danger"><Icon name="alert" className="h-4 w-4" />{t}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">Not on Google's malware, phishing or unwanted-software lists.</p>
          )}
        </SourceCard>

        <SourceCard title="VirusTotal" status={vtStatus} statusLabel={vtLabel} delay={0.2}>
          {vt.available && vt.stats ? (
            <>
              <Row k="Malicious" v={vt.stats.malicious} />
              <Row k="Suspicious" v={vt.stats.suspicious} />
              <Row k="Clean / undetected" v={vt.stats.harmless + vt.stats.undetected} />
              {vt.lastAnalysisDate && <Row k="Last analysed" v={fmtDate(vt.lastAnalysisDate)} />}
              {vt.permalink && (
                <a href={vt.permalink} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-cyber-cyan hover:underline">
                  View full report on VirusTotal ↗
                </a>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500">{vt.message || 'Engine results could not be fetched for this scan.'}</p>
          )}
        </SourceCard>

        <SourceCard
          title="Domain age (RDAP)"
          status={!da.available ? 'unavailable' : da.isNew ? 'warn' : 'ok'}
          statusLabel={!da.available ? (da.reason === 'ip_url' ? 'Not applicable' : 'Unknown') : da.isNew ? 'Newly registered' : 'Established'}
          delay={0.3}
        >
          {da.available ? (
            <>
              <Row k="Domain" v={da.domain} mono />
              <Row k="Registered" v={fmtDate(da.registered)} />
              <Row k="Age" v={da.ageDays >= 365 ? `${Math.floor(da.ageDays / 365)} years` : `${da.ageDays} days`} />
              {da.registrar && <Row k="Registrar" v={da.registrar} />}
            </>
          ) : (
            <p className="text-xs text-slate-500">
              {da.reason === 'ip_url' ? 'The link uses an IP address, so there is no domain to look up.' : 'Registration data is not available for this domain (some TLDs do not support RDAP).'}
            </p>
          )}
        </SourceCard>

        <SourceCard title="Link heuristics" status={heurWarns.length ? 'warn' : 'ok'} statusLabel={heurWarns.length ? `${heurWarns.length} warning${heurWarns.length > 1 ? 's' : ''}` : 'Looks normal'} delay={0.4}>
          <ul className="space-y-2">
            {h.flags.map((f) => (
              <li key={f.label} className="flex gap-2 text-xs">
                <Icon name={f.severity === 'ok' ? 'check' : 'alert'} className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${f.severity === 'ok' ? 'text-safe' : f.severity === 'warn' ? 'text-suspicious' : 'text-slate-400'}`} />
                <span><span className="font-medium text-slate-200">{f.label}.</span> <span className="text-slate-400">{f.detail}</span></span>
              </li>
            ))}
          </ul>
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
