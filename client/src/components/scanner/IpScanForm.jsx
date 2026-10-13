import { useState } from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { isValidIp } from '../../lib/ipValidation';

const EXAMPLES = ['8.8.8.8', '1.1.1.1', '185.220.101.1', '2001:4860:4860::8888'];

export default function IpScanForm({ onScan, disabled }) {
  const [ip, setIp] = useState('');
  const [error, setError] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = ip.trim().replace(/^\[|\]$/g, '');
        if (!isValidIp(v)) return setError('Enter a valid IPv4 (e.g. 8.8.8.8) or IPv6 address.');
        setError('');
        onScan(v);
      }}
      className="space-y-4"
      noValidate
    >
      <label htmlFor="ip-input" className="block text-sm font-medium text-slate-300">
        Enter an IP address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icon name="ip" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            id="ip-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="e.g. 103.21.244.0"
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className="w-full rounded-xl border border-white/10 bg-bg-900/70 py-3.5 pl-12 pr-4 font-mono text-sm text-white placeholder:text-slate-500 focus:border-cyber-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyber-cyan/30"
          />
        </div>
        <Button type="submit" size="lg" disabled={disabled} className="sm:w-40">
          <Icon name="scan" className="h-5 w-5" />
          Check IP
        </Button>
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-danger">
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
            onClick={() => { setIp(ex); setError(''); }}
            className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[11px] text-slate-400 hover:border-cyber-cyan/50 hover:text-cyber-cyan"
          >
            {ex}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Tip: find the sender's IP in an email's "Show original" headers (look for <span className="font-mono">Received: from</span>).
      </p>
    </form>
  );
}
