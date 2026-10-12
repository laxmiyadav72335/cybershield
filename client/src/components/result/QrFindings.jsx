import SourceCard, { Row } from './SourceCard';
import UrlFindings from './UrlFindings';
import GlassCard from '../ui/GlassCard';
import Icon from '../ui/Icon';

const SOURCE_LABEL = { camera: 'Scanned with camera', image: 'Decoded from image', text: 'Pasted text' };

/** Findings for a QR scan. For link QRs the full Link Scanner findings follow. */
export default function QrFindings({ result }) {
  const { qr } = result;
  return (
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Icon name="qr" className="h-4 w-4 text-cyber-cyan" />
            Decoded QR content
          </h3>
          <span className="text-xs text-slate-500">{SOURCE_LABEL[qr.source] || qr.source}</span>
        </div>
        <p className="break-all rounded-xl bg-bg-900/60 p-3 font-mono text-xs text-slate-200">{qr.raw}</p>
      </GlassCard>

      {qr.kind === 'upi' && <UpiCard upi={result.sources.upi} />}
      {qr.kind === 'url' && <UrlFindings result={result} />}
      {qr.kind === 'wifi' && (
        <SourceCard title="Wi-Fi network" status={/nopass/i.test(result.sources.parsed.wifi.security) ? 'warn' : 'ok'} statusLabel={result.sources.parsed.wifi.security.toUpperCase()}>
          <Row k="Network name (SSID)" v={result.sources.parsed.wifi.ssid} />
          <Row k="Security" v={result.sources.parsed.wifi.security} />
          <Row k="Hidden network" v={result.sources.parsed.wifi.hidden ? 'Yes' : 'No'} />
        </SourceCard>
      )}
      {qr.kind === 'tel' && (
        <SourceCard title="Phone number" status="warn" statusLabel="Verify first">
          <Row k="Dials" v={result.sources.parsed.phone} mono />
        </SourceCard>
      )}
    </div>
  );
}

function UpiCard({ upi }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4">
        <Icon name="alert" className="mt-0.5 h-6 w-6 shrink-0 text-danger" strokeWidth={2.2} />
        <div>
          <p className="font-display text-base font-bold text-white">You never need to scan a QR code to RECEIVE money.</p>
          <p className="mt-1 text-sm text-slate-300">
            If someone says "scan this to get your refund / prize / payment", it is a scam. Scanning + entering your UPI PIN
            always <em>sends</em> money.
          </p>
        </div>
      </div>
      <SourceCard title="UPI payment request" status={upi.amount ? 'warn' : 'ok'} statusLabel={upi.amount ? 'Amount pre-filled' : 'Open amount'}>
        <Row k="Pay to (UPI ID)" v={upi.payeeAddress || '—'} mono />
        <Row k="Payee name" v={upi.payeeName || '—'} />
        <Row k="Amount" v={upi.amount != null ? `₹${upi.amount.toLocaleString('en-IN')} ${upi.currency}` : 'You enter it'} />
        {upi.note && <Row k="Note" v={upi.note} />}
        {upi.merchantCode && <Row k="Merchant code" v={upi.merchantCode} mono />}
        {upi.txnRef && <Row k="Transaction ref" v={upi.txnRef} mono />}
        <p className="mt-3 text-[11px] text-slate-500">
          {upi.merchantCode ? 'A merchant code is present — typical of a registered shop QR.' : 'No merchant code — this looks like a personal (P2P) collect request.'}
        </p>
      </SourceCard>
    </div>
  );
}
