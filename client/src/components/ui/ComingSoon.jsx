import GlassCard from './GlassCard';
import Icon from './Icon';
import Button from './Button';

/** Placeholder panel used by pages that are built in later phases. */
export default function ComingSoon({ phase, items = [] }) {
  return (
    <GlassCard className="p-8 text-center sm:p-12">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyber-cyan/15 text-cyber-cyan ring-1 ring-cyber-cyan/40">
        <Icon name="bolt" className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Built in Phase {phase}</h2>
      {items.length > 0 && (
        <ul className="mx-auto mt-4 max-w-md space-y-1.5 text-sm text-slate-400">
          {items.map((it) => (
            <li key={it}>• {it}</li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <Button to="/scan" variant="secondary">
          <Icon name="scan" className="h-4 w-4" />
          Go to Scanner
        </Button>
      </div>
    </GlassCard>
  );
}
