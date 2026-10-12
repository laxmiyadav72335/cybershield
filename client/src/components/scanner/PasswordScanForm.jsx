import { useMemo, useState } from 'react';
import { estimateStrength } from '../../lib/password';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#22C55E', '#22D3EE'];

/**
 * Password input with a live local strength meter. The value is kept only in
 * component state and cleared after submit; it is never sent to our backend.
 */
export default function PasswordScanForm({ onScan, disabled }) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const strength = useMemo(() => estimateStrength(pw), [pw]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!pw) return;
        onScan(pw);
        setPw(''); // wipe from the form immediately
      }}
      className="space-y-5"
      autoComplete="off"
    >
      <label htmlFor="pw-input" className="block text-sm font-medium text-slate-300">
        Enter a password to check
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icon name="key" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            id="pw-input"
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="new-password"
            spellCheck={false}
            maxLength={128}
            disabled={disabled}
            placeholder="••••••••••••"
            className="w-full rounded-xl border border-white/10 bg-bg-900/70 py-3.5 pl-12 pr-12 font-mono text-sm text-white placeholder:text-slate-500 focus:border-cyber-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyber-cyan/30"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-white"
          >
            <Icon name={show ? 'eyeOff' : 'eye'} className="h-5 w-5" />
          </button>
        </div>
        <Button type="submit" size="lg" disabled={disabled || !pw} className="sm:w-44">
          <Icon name="scan" className="h-5 w-5" />
          Check leaks
        </Button>
      </div>

      {/* Live strength meter */}
      <div aria-live="polite">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-slate-400">Strength</span>
          <span className="font-semibold" style={{ color: pw ? COLORS[strength.score] : '#64748B' }}>
            {pw ? strength.label : '—'}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-2 rounded-full transition-colors duration-300"
              style={{ background: pw && i <= strength.score ? COLORS[strength.score] : 'rgba(255,255,255,0.08)' }}
            />
          ))}
        </div>
        {pw && (
          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
            <div className="rounded-lg bg-white/[0.03] p-3">
              <p className="text-slate-500">Estimated crack time (offline GPU)</p>
              <p className="mt-0.5 font-semibold text-white">{strength.crackTime}</p>
              <p className="text-[11px] text-slate-500">≈ {strength.entropyBits} bits of entropy · {strength.length} chars</p>
            </div>
            <ul className="space-y-1 text-slate-300">
              {strength.warnings.slice(0, 2).map((w) => (
                <li key={w} className="flex gap-1.5"><Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-suspicious" />{w}</li>
              ))}
              {strength.suggestions.slice(0, 2).map((s) => (
                <li key={s} className="flex gap-1.5"><Icon name="arrow" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyber-cyan" />{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="rounded-xl border border-cyber-cyan/20 bg-cyber-cyan/5 px-4 py-3 text-xs leading-relaxed text-slate-300">
        <span className="font-semibold text-cyber-cyan">How this stays private:</span> your password is hashed (SHA-1) inside
        your browser and only the <span className="font-mono text-white">first 5 characters</span> of that hash are sent to
        Have I Been Pwned. The password itself never leaves this page and is never saved.
      </p>
    </form>
  );
}
