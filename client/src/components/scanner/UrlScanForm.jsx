import { useState } from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

/**
 * Link Scanner input. Validation mirrors the backend's normalizeUrl: we
 * accept bare domains and prefix https:// for display.
 */
const EXAMPLES = [
  'https://www.google.com',
  'http://sbi-kyc-update.verify-login.xyz/claim',
  'http://testsafebrowsing.appspot.com/s/phishing.html',
];

export default function UrlScanForm({ onScan, disabled }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const value = url.trim();
    if (!value) return setError('Paste a link to scan.');
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const u = new URL(withScheme);
      if (!['http:', 'https:'].includes(u.protocol) || !u.hostname.includes('.')) throw new Error();
    } catch {
      return setError('That does not look like a valid link (e.g. https://example.com/page).');
    }
    setError('');
    onScan(value);
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <label htmlFor="url-input" className="block text-sm font-medium text-slate-300">
        Paste the link you received
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icon name="link" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            id="url-input"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/offer"
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'url-error' : undefined}
            className="w-full rounded-xl border border-white/10 bg-bg-900/70 py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyber-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyber-cyan/30"
          />
        </div>
        <Button type="submit" size="lg" disabled={disabled} className="sm:w-40">
          <Icon name="scan" className="h-5 w-5" />
          Scan link
        </Button>
      </div>
      {error && (
        <p id="url-error" role="alert" className="flex items-center gap-2 text-sm text-danger">
          <Icon name="alert" className="h-4 w-4" />
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setUrl(ex);
              setError('');
            }}
            className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[11px] text-slate-400 hover:border-cyber-cyan/50 hover:text-cyber-cyan"
          >
            {ex.replace(/^https?:\/\//, '').slice(0, 40)}
          </button>
        ))}
      </div>
    </form>
  );
}
