import SourceCard, { Row } from './SourceCard';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never');

/** Findings for an IP scan: AbuseIPDB reputation + geolocation / network. */
export default function IpFindings({ result }) {
  const { abuseIpdb: ab, geo } = result.sources;
  const score = ab.abuseConfidenceScore || 0;
  const abStatus = !ab.available ? 'unavailable' : score >= 50 ? 'danger' : score > 0 ? 'warn' : 'ok';
  const abLabel = !ab.available
    ? ab.reason === 'private' ? 'Private IP' : ab.reason === 'not_configured' ? 'Not configured' : 'Unavailable'
    : `${score}% abuse confidence`;

  const country = ab.countryName || geo.country;
  const flag = (ab.countryCode || geo.countryCode) ? String.fromCodePoint(...[...(ab.countryCode || geo.countryCode)].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : '';

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SourceCard title="AbuseIPDB reputation" status={abStatus} statusLabel={abLabel} delay={0.1}>
        {ab.available ? (
          <>
            <div className="mb-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${score}%`, background: score >= 50 ? '#EF4444' : score > 0 ? '#F59E0B' : '#22C55E' }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Abuse confidence score (last 90 days)</p>
            </div>
            <Row k="Total reports" v={ab.totalReports} />
            <Row k="Distinct reporters" v={ab.numDistinctUsers} />
            <Row k="Last reported" v={fmtDate(ab.lastReportedAt)} />
            <Row k="Usage type" v={ab.usageType || '—'} />
            <Row k="ISP" v={ab.isp || '—'} />
            <Row k="Domain" v={ab.domain || '—'} mono />
            {ab.isTor && <Row k="Tor exit node" v={<span className="text-suspicious">Yes</span>} />}
            {ab.isWhitelisted && <Row k="Whitelisted" v={<span className="text-safe">Yes</span>} />}
            <a href={`https://www.abuseipdb.com/check/${result.input}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-cyber-cyan hover:underline">
              View on AbuseIPDB ↗
            </a>
          </>
        ) : (
          <p className="text-xs text-slate-500">
            {ab.reason === 'private'
              ? 'Private addresses (10.x, 192.168.x, 127.x…) exist only inside your own network.'
              : 'Abuse reports could not be fetched for this address.'}
          </p>
        )}
      </SourceCard>

      <SourceCard title="Location & network" status={geo.available ? (geo.isProxy || geo.isHosting ? 'warn' : 'ok') : 'unavailable'} statusLabel={geo.available ? (geo.isProxy ? 'Proxy / VPN' : geo.isHosting ? 'Hosting' : 'Residential / ISP') : abLabel === 'Private IP' ? 'Private IP' : 'Unavailable'} delay={0.2}>
        {geo.available ? (
          <>
            <Row k="Country" v={`${flag} ${country}`} />
            <Row k="Region / city" v={[geo.region, geo.city].filter(Boolean).join(', ') || '—'} />
            <Row k="ISP" v={geo.isp || '—'} />
            <Row k="Organisation" v={geo.org || '—'} />
            <Row k="ASN" v={geo.asn || '—'} mono />
            <Row k="Proxy / VPN" v={geo.isProxy ? 'Yes' : 'No'} />
            <Row k="Data centre" v={geo.isHosting ? 'Yes' : 'No'} />
            {geo.lat != null && (
              <a
                href={`https://www.openstreetmap.org/?mlat=${geo.lat}&mlon=${geo.lon}#map=6/${geo.lat}/${geo.lon}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-cyber-cyan hover:underline"
              >
                Show on map ↗
              </a>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-500">No geolocation data for this address.</p>
        )}
      </SourceCard>
    </div>
  );
}
