import SourceCard, { Row } from './SourceCard';
import GlassCard from '../ui/GlassCard';
import Icon from '../ui/Icon';

const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#22C55E', '#22D3EE'];

/** Findings for a password check: breach lookup + strength + k-anonymity explainer. */
export default function PasswordFindings({ result }) {
  const { hibp, strength } = result.sources;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <SourceCard
          title="Have I Been Pwned"
          status={!hibp.available ? 'unavailable' : hibp.breachCount > 0 ? 'danger' : 'ok'}
          statusLabel={!hibp.available ? 'Unreachable' : hibp.breachCount > 0 ? 'Leaked' : 'Not found'}
          delay={0.1}
        >
          {hibp.available ? (
            <>
              <p className="font-display text-3xl font-bold" style={{ color: hibp.breachCount > 0 ? '#EF4444' : '#22C55E' }}>
                {hibp.breachCount.toLocaleString('en-IN')}
              </p>
              <p className="mb-2 text-xs text-slate-400">times seen in known data breaches</p>
              <Row k="Hash prefix sent" v={hibp.prefix} mono />
              <Row k="Hashes returned for that prefix" v={hibp.candidates.toLocaleString('en-IN')} />
            </>
          ) : (
            <p className="text-xs text-slate-500">The breach database could not be reached. Check your internet connection and try again.</p>
          )}
        </SourceCard>

        <SourceCard title="Strength (local)" status={strength.score <= 1 ? 'danger' : strength.score === 2 ? 'warn' : 'ok'} statusLabel={strength.label} delay={0.2}>
          <div className="mb-3 grid grid-cols-5 gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-2 rounded-full" style={{ background: i <= strength.score ? COLORS[strength.score] : 'rgba(255,255,255,0.08)' }} />
            ))}
          </div>
          <Row k="Length" v={`${strength.length} characters`} />
          <Row k="Entropy" v={`≈ ${strength.entropyBits} bits`} />
          <Row k="Offline crack time" v={strength.crackTime} />
          <Row
            k="Character types"
            v={['lower', 'upper', 'digit', 'symbol'].filter((c) => strength.classes[c]).join(', ') || '—'}
          />
          {(strength.warnings.length > 0 || strength.suggestions.length > 0) && (
            <ul className="mt-3 space-y-1.5 text-xs">
              {strength.warnings.map((w) => (
                <li key={w} className="flex gap-1.5 text-slate-300"><Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-suspicious" />{w}</li>
              ))}
              {strength.suggestions.map((s) => (
                <li key={s} className="flex gap-1.5 text-slate-300"><Icon name="arrow" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyber-cyan" />{s}</li>
              ))}
            </ul>
          )}
        </SourceCard>
      </div>

      {hibp.available && <GlassCard className="p-5 sm:p-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Icon name="key" className="h-4 w-4 text-cyber-cyan" />
          How k-anonymity kept your password private
        </h3>
        <ol className="grid gap-3 text-xs text-slate-300 sm:grid-cols-4">
          {[
            ['1. Hash locally', 'Your browser computed SHA-1 of the password. The password itself never left this page.'],
            ['2. Send 5 characters', `Only the prefix ${hibp.prefix ? `"${hibp.prefix}"` : ''} was sent — it matches about 1 in a million hashes.`],
            ['3. Receive candidates', `The API returned ${hibp.candidates ? hibp.candidates.toLocaleString('en-IN') : 'hundreds of'} suffixes sharing that prefix, padded to a fixed size.`],
            ['4. Compare locally', 'Your browser looked for its own suffix in the list. Nobody else can tell which one you meant.'],
          ].map(([t, d]) => (
            <li key={t} className="rounded-xl bg-white/[0.03] p-3">
              <p className="font-semibold text-cyber-cyan">{t}</p>
              <p className="mt-1 leading-relaxed text-slate-400">{d}</p>
            </li>
          ))}
        </ol>
      </GlassCard>}
    </div>
  );
}
