import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { loadLastResult, saveLastResult } from '../lib/resultStore';
import { api } from '../services/api';
import { getScanner } from '../config/scanners';
import { downloadPdf } from '../lib/pdfReport';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import ThreatGauge from '../components/result/ThreatGauge';
import VerdictBadge from '../components/result/VerdictBadge';
import DangerAlert from '../components/result/DangerAlert';
import ScoreBreakdown from '../components/result/ScoreBreakdown';
import UrlFindings from '../components/result/UrlFindings';
import FileFindings from '../components/result/FileFindings';
import MessageFindings from '../components/result/MessageFindings';
import IpFindings from '../components/result/IpFindings';
import QrFindings from '../components/result/QrFindings';
import PasswordFindings from '../components/result/PasswordFindings';

const FINDINGS = { url: UrlFindings, file: FileFindings, message: MessageFindings, ip: IpFindings, qr: QrFindings, password: PasswordFindings };

/**
 * Result page. Reads the report from router state (fresh scan) or
 * sessionStorage (page refresh). Module-specific findings render below
 * the shared gauge / verdict / explanation block.
 */
export default function Result() {
  const location = useLocation();
  const reduce = useReducedMotion();
  const [result, setResult] = useState(() => location.state?.result || loadLastResult());
  const [rechecking, setRechecking] = useState(false);
  const [recheckError, setRecheckError] = useState('');

  /**
   * VirusTotal returns "queued" when it has just received a brand-new URL or
   * file; engine results arrive ~1 min later. "Check again" repeats only the
   * lookup (hash / URL id) — no re-upload — and swaps in the full report.
   */
  const vtQueued = result?.sources?.virusTotal?.status === 'queued';
  const recheck = async () => {
    setRechecking(true);
    setRecheckError('');
    try {
      let fresh;
      if (result.scanType === 'file') {
        fresh = await api.scanFile(JSON.stringify({ sha256: result.sha256, fileName: result.fileName, size: result.size, mimeType: result.mimeType }), { headers: { 'content-type': 'application/json' } });
      } else {
        const link = await api.scanUrl(result.linkInput || result.input, { fresh: true });
        // keep QR wrapper fields if this was a QR → link scan
        fresh = result.scanType === 'qr' ? { ...link, scanType: 'qr', qr: result.qr, linkInput: result.linkInput, inputPreview: result.inputPreview, summary: `QR opens a link. ${link.summary}` } : link;
      }
      if (fresh.needsUpload) throw new Error('VirusTotal has not finished analysing this file yet. Try again in a minute.');
      saveLastResult(fresh);
      setResult(fresh);
    } catch (err) {
      setRecheckError(err.message || 'Could not refresh the result.');
    } finally {
      setRechecking(false);
    }
  };

  const dangerous = result?.verdict === 'dangerous';

  if (!result) return <EmptyState />;

  const scanner = getScanner(result.scanType);
  const Findings = FINDINGS[result.scanType];
  const unavailable = result.unavailableSources || [];
  const scannedAt = new Date(result.scannedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className={`py-10 ${dangerous && !reduce ? 'animate-shake' : ''}`}>
      {dangerous && <DangerAlert />}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyber-cyan">
            <Icon name={scanner?.icon || 'scan'} className="h-4 w-4" />
            {scanner?.title || 'Scan'} result
          </p>
          <h1 className="mt-2 break-words font-mono text-lg text-white sm:text-xl" title={result.input}>
            {result.inputPreview || result.input}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            <span>Scanned {scannedAt}</span>
            {result.cached && <span>· served from cache</span>}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 min-[360px]:flex-row sm:w-auto sm:shrink-0">
          <Button to={`/scan/${result.scanType}`} variant="secondary" size="sm" className="w-full min-[360px]:w-auto">
            <Icon name="scan" className="h-4 w-4" />
            Scan another
          </Button>
          <Button size="sm" onClick={() => downloadPdf(result)} className="w-full min-[360px]:w-auto">
            <Icon name="file" className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {unavailable.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="status"
          className="mb-4 flex items-start gap-3 rounded-xl border border-suspicious/40 bg-suspicious/10 px-4 py-3 text-sm"
        >
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-suspicious" />
          <p className="text-slate-200">
            <span className="font-semibold text-suspicious">Partial result.</span> {unavailable.join(', ')} could not be
            checked, {result.threatScore == null ? 'so no threat score is available.' : 'so the score may be lower than the real risk.'}
          </p>
        </motion.div>
      )}

      {vtQueued && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="status"
          className="mb-4 flex flex-col gap-3 rounded-xl border border-cyber-cyan/40 bg-cyber-cyan/10 px-4 py-3 text-sm sm:flex-row sm:items-center"
        >
          <Icon name="bolt" className="h-4 w-4 shrink-0 text-cyber-cyan" />
          <p className="flex-1 text-slate-200">
            <span className="font-semibold text-cyber-cyan">VirusTotal is still analysing this item.</span> Engine results
            usually arrive within a minute — check again to update the score.
          </p>
          <Button size="sm" variant="secondary" onClick={recheck} disabled={rechecking}>
            {rechecking ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyber-cyan/30 border-t-cyber-cyan" /> : <Icon name="scan" className="h-4 w-4" />}
            {rechecking ? 'Checking…' : 'Check again'}
          </Button>
          {recheckError && <span className="text-xs text-suspicious">{recheckError}</span>}
        </motion.div>
      )}

      {/* Verdict block */}
      <GlassCard glow={!dangerous} className={`mb-6 overflow-hidden p-6 sm:p-8 ${dangerous ? 'ring-1 ring-danger/50' : ''}`}>
        <div className="grid items-center gap-8 lg:grid-cols-[320px_1fr]">
          {result.threatScore == null ? (
            <div role="img" aria-label="No threat score available" className="mx-auto flex h-48 w-48 flex-col items-center justify-center rounded-full border border-slate-400/30 bg-slate-500/10 text-center">
              <span className="font-display text-2xl font-bold text-slate-200">Not scored</span>
              <span className="mt-2 text-xs text-slate-400">{result.scanType === 'file' ? (vtQueued ? 'Analysis pending' : 'Detection data unavailable') : result.isPrivate ? 'No public reputation check' : 'Reputation check unavailable'}</span>
            </div>
          ) : <ThreatGauge score={result.threatScore} />}
          <div>
            <VerdictBadge verdict={result.verdict} />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-lg font-semibold text-white"
            >
              {result.summary}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-4 rounded-xl border border-cyber-cyan/20 bg-cyber-cyan/5 p-4"
            >
              <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyber-cyan">
                <Icon name="bolt" className="h-3.5 w-3.5" />
                {result.aiAvailable ? 'AI explanation' : 'Explanation'}
              </p>
              <p className="text-sm leading-relaxed text-slate-200">{result.explanation}</p>
              {!result.aiAvailable && !result.local && result.verdict !== 'unknown' && (
                <p className="mt-2 text-[11px] text-slate-500">This is a rule-based summary of the available findings.</p>
              )}
            </motion.div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {Findings ? <Findings result={result} /> : null}
        </div>
        <aside className="space-y-6">
          <GlassCard className="p-5">
            <ScoreBreakdown breakdown={result.breakdown} score={result.threatScore} reason={result.scanType === 'file' ? (vtQueued ? 'VirusTotal is still analysing this file.' : 'VirusTotal detection data was unavailable.') : result.isPrivate ? 'Public reputation was not checked for this local or reserved address.' : 'The reputation service was unavailable, so this address could not be scored.'} />
          </GlassCard>
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-white">What should I do?</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {result.advice && (
                <li className="flex gap-2">
                  <Icon name="bolt" className="mt-0.5 h-4 w-4 shrink-0 text-cyber-cyan" />
                  {result.advice}
                </li>
              )}
              {adviceFor(result).map((a) => (
                <li key={a} className="flex gap-2">
                  <Icon name="arrow" className="mt-0.5 h-4 w-4 shrink-0 text-cyber-cyan" />
                  {a}
                </li>
              ))}
            </ul>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}

/** Module-specific advice where it exists (password, UPI QR); otherwise the generic verdict advice. */
function adviceFor(result) {
  if (result.scanType === 'file' && result.verdict === 'unknown') return result.sources?.virusTotal?.status === 'queued'
    ? ['Use Check again after VirusTotal finishes analysing the file.', 'Do not treat a pending analysis as a clean result.']
    : ['Try scanning the file again later.', 'Do not treat unavailable detection data as a clean result.'];
  if (result.verdict === 'unknown') return result.isPrivate
    ? ['Use a public IP address to run a reputation check.', 'Do not interpret an unscored address as safe.']
    : ['Try the reputation check again later.', 'Do not interpret an unscored address as safe.'];
  const key = result.scanType === 'qr' ? (result.qr?.kind === 'upi' ? 'qr' : null) : result.scanType;
  return ADVICE[key]?.[result.verdict] || ADVICE[result.verdict] || ADVICE.safe;
}

const ADVICE = {
  password: {
    safe: ['Use a different password for every important account.', 'Turn on two-factor authentication (2FA) wherever possible.', 'A password manager can generate and remember strong passwords.'],
    suspicious: ['Make it longer — 12+ characters or a 4-word passphrase.', 'Never reuse it on email or banking accounts.', 'Enable two-factor authentication.'],
    dangerous: ['Change this password NOW on every site where you use it.', 'Start with your email account — it can reset all the others.', 'Turn on two-factor authentication and use a password manager.'],
  },
  qr: {
    safe: ['Check the payee name shown in your UPI app before entering your PIN.', 'Only scan QR codes from people or shops you actually intend to pay.'],
    suspicious: ['Do not enter your UPI PIN unless YOU want to pay this person.', 'Nobody needs you to scan a QR to send you money — hang up on "refund" callers.', 'Verify the shop or person in front of you matches the payee name.'],
    dangerous: ['Do not scan this QR or enter your PIN.', 'If you already paid, call your bank and report at cybercrime.gov.in / 1930 immediately.', 'Block the sender and warn others.'],
  },
  safe: [
    'No threats found — but still check the sender is someone you know.',
    'Never share OTPs, PINs or passwords, even on safe-looking sites.',
  ],
  suspicious: [
    'Do not enter personal or banking details on this link.',
    'Verify through the official app or website, not the link you received.',
    'If it claims to be from a bank or government, call their official helpline.',
  ],
  dangerous: [
    'Do not open this link. Delete the message that contained it.',
    'If you already entered details, change your passwords and call your bank immediately.',
    'Report it at cybercrime.gov.in or call the 1930 cyber-fraud helpline.',
  ],
};

function EmptyState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10">
      <GlassCard className="max-w-md p-10 text-center">
        <Icon name="scan" className="mx-auto h-10 w-10 text-cyber-cyan" />
        <h1 className="mt-4 font-display text-2xl font-bold">No scan result yet</h1>
        <p className="mt-2 text-sm text-slate-400">Run a scan first and the threat report will appear here.</p>
        <Button to="/scan" className="mt-6">Open the scanner</Button>
      </GlassCard>
    </div>
  );
}
