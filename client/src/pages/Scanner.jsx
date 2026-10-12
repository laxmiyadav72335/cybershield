import { useState, useRef, useEffect } from 'react';
import { NavLink, useParams, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SCANNERS, SCANNER_IDS, getScanner } from '../config/scanners';
import { api } from '../services/api';
import { saveLastResult } from '../lib/resultStore';
import { useAuth } from '../context/AuthContext';
import { saveScan, bumpGlobalCounter } from '../services/scans';
import GlassCard from '../components/ui/GlassCard';
import Icon from '../components/ui/Icon';
import PageHeader from '../components/ui/PageHeader';
import RadarScan from '../components/scanner/RadarScan';
import { STATUS_LINES } from '../components/scanner/statusLines';
import UrlScanForm from '../components/scanner/UrlScanForm';
import FileScanForm from '../components/scanner/FileScanForm';
import MessageScanForm from '../components/scanner/MessageScanForm';
import IpScanForm from '../components/scanner/IpScanForm';
import QrScanForm from '../components/scanner/QrScanForm';
import PasswordScanForm from '../components/scanner/PasswordScanForm';
import { buildQrReport } from '../lib/qrReport';
import { buildPasswordReport } from '../lib/password';
import ScanError from '../components/scanner/ScanError';
import { sha256Hex } from '../lib/hash';

/** Minimum time the radar stays on screen so fast (cached) scans still feel "scanned". */
const MIN_SCAN_MS = 2400;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Scanner page: a tab per module, driven by /scan/:type.
 * Owns the scanning state machine: idle → scanning (radar) → navigate to /result | error.
 */
export default function Scanner() {
  const { type = 'url' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [statusLines, setStatusLines] = useState(STATUS_LINES.url);
  const [subtitle, setSubtitle] = useState('');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  // Cancel in-flight request if the user leaves the page
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => setError(null), [type]);

  if (!SCANNER_IDS.includes(type)) return <Navigate to="/scan/url" replace />;
  const scanner = getScanner(type);

  /** Generic runner used by every module: runs `fn`, shows radar, routes to result. */
  const runScan = async (fn, { lines = STATUS_LINES[type], preview = '' } = {}) => {
    setError(null);
    setStatusLines(lines);
    setSubtitle(preview);
    setScanning(true);
    abortRef.current = new AbortController();
    try {
      const [result] = await Promise.all([fn(abortRef.current.signal), wait(MIN_SCAN_MS)]);
      saveLastResult(result);
      // Fire-and-forget persistence: public counter for everyone, history for signed-in users
      bumpGlobalCounter();
      const savedPromise = user ? saveScan(user, result) : Promise.resolve(null);
      navigate('/result', { state: { result, savedFor: user ? user.uid : null } });
      savedPromise.then((id) => { if (id) saveLastResult({ ...result, savedId: id }); });
    } catch (err) {
      if (err.name !== 'AbortError') setError(err);
    } finally {
      setScanning(false);
    }
  };

  const handleUrlScan = (url) => runScan((signal) => api.scanUrl(url, { signal }), { preview: url });
  const handleMessageScan = (text) => runScan((signal) => api.scanMessage(text, { signal }), { preview: text.slice(0, 60) });
  const handleIpScan = (ip) => runScan((signal) => api.scanIp(ip, { signal }), { preview: ip });

  /**
   * File scan = hash-first:
   *  1. SHA-256 in the browser (Web Crypto)
   *  2. JSON lookup by hash → instant report if VirusTotal knows the file
   *  3. Only if unknown → send the bytes (multipart) for a fresh analysis
   */
  const handleFileScan = (file) =>
    runScan(
      async (signal) => {
        const sha256 = await sha256Hex(file);
        const meta = { sha256, fileName: file.name, size: file.size, mimeType: file.type };
        const first = await api.scanFile(JSON.stringify(meta), { signal, headers: { 'content-type': 'application/json' } });
        if (!first.needsUpload) return first;
        const form = new FormData();
        form.append('file', file, file.name);
        Object.entries(meta).forEach(([k, v]) => form.append(k, String(v)));
        return api.scanFile(form, { signal });
      },
      { preview: file.name },
    );

  /** QR: decoded text → link scan (backend) or local UPI / other report. */
  const handleQrDecode = (text, source) =>
    runScan((signal) => buildQrReport(text, source, signal), { preview: text.slice(0, 60) });

  /** Password: entirely local + k-anonymity call to HIBP. Never touches our backend. */
  const handlePasswordScan = (pw) =>
    runScan((signal) => buildPasswordReport(pw, signal), { preview: `${'•'.repeat(Math.min(pw.length, 12))} (${pw.length} chars)` });

  const FORMS = {
    url: <UrlScanForm onScan={handleUrlScan} disabled={scanning} />,
    file: <FileScanForm onScan={handleFileScan} disabled={scanning} />,
    message: <MessageScanForm onScan={handleMessageScan} disabled={scanning} />,
    ip: <IpScanForm onScan={handleIpScan} disabled={scanning} />,
    qr: <QrScanForm onDecode={handleQrDecode} disabled={scanning} />,
    password: <PasswordScanForm onScan={handlePasswordScan} disabled={scanning} />,
  };

  return (
    <div className="py-10">
      <PageHeader eyebrow="Scanner" title="What do you want to check?" />

      {/* Tab strip */}
      <nav className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Scanner types">
        {SCANNERS.map((s) => (
          <NavLink
            key={s.id}
            to={`/scan/${s.id}`}
            className={({ isActive }) =>
              `relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'text-white' : 'glass text-slate-300 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="scanner-tab"
                    className="absolute inset-0 rounded-xl bg-cyber-cyan/15 ring-1 ring-cyber-cyan/60"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <Icon name={s.icon} className="h-4 w-4" />
                  {s.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <GlassCard className="p-6 sm:p-8">
          <div className="mb-6 flex items-start gap-4">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1"
              style={{ color: scanner.accent, background: `${scanner.accent}1A`, '--tw-ring-color': `${scanner.accent}55` }}
            >
              <Icon name={scanner.icon} className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">{scanner.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{scanner.description}</p>
            </div>
          </div>

          {FORMS[type]}

          <ScanError error={error} onRetry={() => setError(null)} />
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Data sources</h3>
          <ul className="mt-4 space-y-2.5">
            {scanner.sources.map((src) => (
              <li key={src} className="flex items-center gap-2.5 text-sm text-slate-200">
                <Icon name="check" className="h-4 w-4 text-safe" />
                {src}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            All third-party API calls go through our backend. API keys never reach the browser.
          </p>
        </GlassCard>
      </div>

      <AnimatePresence>
        {scanning && <RadarScan lines={statusLines} title={`Scanning ${scanner.label.toLowerCase()}`} subtitle={subtitle} />}
      </AnimatePresence>
    </div>
  );
}
