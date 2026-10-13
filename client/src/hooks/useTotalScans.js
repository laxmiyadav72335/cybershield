/**
 * Live "total scans" counter for the Home page.
 * Subscribes to Firestore document stats/global { totalScans } in real time.
 * Falls back to a demo value when Firebase isn't configured yet, so the
 * Home page renders without any keys.
 */
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';

const DEMO_TOTAL = 12_480;

export function useTotalScans() {
  const [total, setTotal] = useState(isFirebaseConfigured ? null : DEMO_TOTAL);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    const unsubscribe = onSnapshot(
      doc(db, 'stats', 'global'),
      (snap) => {
        setTotal(snap.exists() ? snap.data().totalScans ?? 0 : 0);
        setIsLive(true);
      },
      () => {
        // Permission or network error → graceful fallback
        setTotal(DEMO_TOTAL);
        setIsLive(false);
      },
    );
    return unsubscribe;
  }, []);

  return { total, isLive, loading: total === null };
}
