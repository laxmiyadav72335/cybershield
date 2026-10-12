import { useState } from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const MAX = 5000;
const EXAMPLES = [
  {
    label: 'KYC scam SMS',
    text: 'Dear Customer, your SBI account will be blocked today. Update your KYC immediately by clicking http://sbi-kyc-update.verify-login.xyz/claim and share the OTP to confirm.',
  },
  {
    label: 'Fake job offer',
    text: 'Congratulations! You are selected for a part-time job. Earn Rs 3000 daily working from home. Pay Rs 499 registration fee to confirm. WhatsApp +91 98765 43210',
  },
  {
    label: 'Electricity bill',
    text: 'Dear consumer, your electricity power will be disconnected tonight at 9.30 pm because your previous month bill was not updated. Please contact electricity officer 9876543210 immediately.',
  },
  {
    label: 'Normal message',
    text: 'Hi Rahul, the project meeting is moved to 3 pm tomorrow in room 204. Please bring the printed report. Thanks, Priya',
  },
];

export default function MessageScanForm({ onScan, disabled }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const t = text.trim();
        if (t.length < 10) return setError('Paste the full message (at least 10 characters).');
        setError('');
        onScan(t);
      }}
      className="space-y-4"
      noValidate
    >
      <label htmlFor="msg-input" className="block text-sm font-medium text-slate-300">
        Paste the SMS, WhatsApp or email text
      </label>
      <div className="relative">
        <textarea
          id="msg-input"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          rows={6}
          disabled={disabled}
          placeholder="Dear customer, your account will be blocked…"
          aria-invalid={Boolean(error)}
          className="w-full resize-y rounded-xl border border-white/10 bg-bg-900/70 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-slate-500 focus:border-cyber-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyber-cyan/30"
        />
        <span className="pointer-events-none absolute bottom-2.5 right-3 text-[11px] text-slate-500">
          {text.length} / {MAX}
        </span>
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-danger">
          <Icon name="alert" className="h-4 w-4" />
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => { setText(ex.text); setError(''); }}
              className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400 hover:border-cyber-cyan/50 hover:text-cyber-cyan"
            >
              {ex.label}
            </button>
          ))}
        </div>
        <Button type="submit" size="lg" disabled={disabled} className="sm:w-44">
          <Icon name="scan" className="h-5 w-5" />
          Check message
        </Button>
      </div>
    </form>
  );
}
