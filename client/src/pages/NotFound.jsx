import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10">
      <GlassCard className="max-w-md p-10 text-center">
        <Icon name="alert" className="mx-auto h-10 w-10 text-suspicious" />
        <h1 className="mt-4 font-display text-3xl font-bold">404</h1>
        <p className="mt-2 text-sm text-slate-400">This page doesn't exist — which is suspicious in itself.</p>
        <Button to="/" className="mt-6">Back to Home</Button>
      </GlassCard>
    </div>
  );
}
