import { Component } from 'react';
import GlassCard from './GlassCard';
import Button from './Button';
import Icon from './Icon';

/** Catches render errors so one broken page never blanks the whole app. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-10">
        <GlassCard className="max-w-md p-10 text-center">
          <Icon name="alert" className="mx-auto h-10 w-10 text-danger" />
          <h1 className="mt-4 font-display text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-400">{this.state.error.message || 'Unexpected error while rendering this page.'}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => window.location.reload()}>Reload</Button>
            <Button to="/" variant="secondary" onClick={() => this.setState({ error: null })}>Home</Button>
          </div>
        </GlassCard>
      </div>
    );
  }
}
