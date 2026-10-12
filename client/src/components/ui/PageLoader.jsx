/** Suspense fallback while a lazily-loaded page chunk downloads. */
export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-cyber-cyan/30 border-t-cyber-cyan" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
