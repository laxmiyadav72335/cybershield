/**
 * Firestore access: the public live counter shown on the Home page.
 *   stats/global { totalScans }
 * Nothing user-specific is stored — there are no accounts in CyberShield.
 */
import { doc, setDoc, increment } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';

/** Every finished scan bumps the public counter. Rules only allow +1 on totalScans. */
export async function bumpGlobalCounter() {
  if (!isFirebaseConfigured) return;
  try {
    await setDoc(doc(db, 'stats', 'global'), { totalScans: increment(1) }, { merge: true });
  } catch (err) {
    console.warn('[scans] global counter not updated:', err.code || err.message);
  }
}
