import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import QrCamera from './QrCamera';
import { decodeImageFile } from '../../lib/qr';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const MODES = [
  { id: 'camera', label: 'Camera', icon: 'camera' },
  { id: 'upload', label: 'Upload image', icon: 'upload' },
  { id: 'paste', label: 'Paste QR text', icon: 'text' },
];

const EXAMPLES = [
  { label: 'UPI "refund" trap', text: 'upi://pay?pa=refund.helpdesk@okaxis&pn=Customer%20Care%20Refund&am=4999&cu=INR&tn=Refund%20verification' },
  { label: 'Genuine shop QR', text: 'upi://pay?pa=sharmastores@paytm&pn=Sharma%20General%20Stores&mc=5411&cu=INR' },
  { label: 'Website link', text: 'https://www.wikipedia.org/' },
];

/**
 * QR input with three modes. Whatever the source, the decoded string goes to
 * onDecode(text, source) and the Scanner page decides what to do with it.
 */
export default function QrScanForm({ onDecode, disabled }) {
  const [mode, setMode] = useState('upload');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pasted, setPasted] = useState('');
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  const handleCameraDecode = useCallback((text) => onDecode(text, 'camera'), [onDecode]);
  const handleCameraError = useCallback((msg) => setError(msg), []);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please choose an image (PNG, JPG, WEBP…).');
    setError('');
    setBusy(true);
    setPreview(URL.createObjectURL(file));
    try {
      const text = await decodeImageFile(file);
      if (!text) return setError('No QR code found in that image. Try a sharper, closer photo.');
      onDecode(text, 'image');
    } catch (err) {
      setError(err.message || 'Could not read that image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="QR input method">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => { setMode(m.id); setError(''); }}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
              mode === m.id ? 'bg-cyber-cyan/15 text-cyber-cyan ring-1 ring-cyber-cyan/60' : 'glass text-slate-300 hover:text-white'
            }`}
          >
            <Icon name={m.icon} className="h-4 w-4" />
            {m.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          {mode === 'camera' && !disabled && <QrCamera onDecode={handleCameraDecode} onError={handleCameraError} />}

          {mode === 'upload' && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-bg-900/40 px-6 py-10 text-center transition-colors hover:border-cyber-cyan/50"
            >
              <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} disabled={disabled} />
              {preview ? (
                <img src={preview} alt="Selected QR" className="mb-3 h-28 w-28 rounded-lg object-contain ring-1 ring-white/10" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cyber-cyan/15 text-cyber-cyan ring-1 ring-cyber-cyan/40">
                  <Icon name="qr" className="h-7 w-7" />
                </span>
              )}
              <p className="mt-3 font-medium text-white">{busy ? 'Decoding…' : 'Drop a screenshot or photo of the QR code'}</p>
              <p className="mt-1 text-xs text-slate-400">or click to choose an image</p>
            </div>
          )}

          {mode === 'paste' && (
            <form
              onSubmit={(e) => { e.preventDefault(); if (!pasted.trim()) return setError('Paste the QR code text first.'); setError(''); onDecode(pasted.trim(), 'text'); }}
              className="space-y-3"
            >
              <textarea
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                rows={3}
                placeholder="upi://pay?pa=someone@upi&pn=Name&am=500"
                className="w-full rounded-xl border border-white/10 bg-bg-900/70 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-cyber-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyber-cyan/30"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Try:</span>
                  {EXAMPLES.map((ex) => (
                    <button key={ex.label} type="button" onClick={() => setPasted(ex.text)} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400 hover:border-cyber-cyan/50 hover:text-cyber-cyan">
                      {ex.label}
                    </button>
                  ))}
                </div>
                <Button type="submit" size="lg" disabled={disabled} className="sm:w-40">
                  <Icon name="scan" className="h-5 w-5" />
                  Check QR
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-danger">
          <Icon name="alert" className="h-4 w-4" />
          {error}
        </p>
      )}

      <p className="rounded-xl border border-suspicious/30 bg-suspicious/10 px-4 py-3 text-xs leading-relaxed text-slate-200">
        <span className="font-semibold text-suspicious">Remember:</span> you never need to scan a QR code or enter your UPI PIN
        to <em>receive</em> money. Scanning + PIN always means money leaves your account.
      </p>
    </div>
  );
}
