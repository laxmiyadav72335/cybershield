/**
 * Firestore access for scan history.
 *
 *  scans/{scanId}  { uid, scanType, inputPreview, threatScore, verdict, summary, timestamp, report? }
 *  users/{uid}     { …profile, totalScans }
 *  stats/global    { totalScans }   ← public live counter on the Home page
 *
 * Privacy: for message scans only the preview + summary are stored (never the
 * full text). Password reports never contain the password. Files store only
 * name + hash (inside the report).
 */
import {
  collection, addDoc, getDocs, query, where, limit, doc, setDoc, deleteDoc, increment, serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';

const STORE_FULL_REPORT = new Set(['url', 'file', 'ip', 'qr', 'password']);

/** Anyone (guest or user) bumps the public counter. Rules only allow +1 on totalScans. */
export async function bumpGlobalCounter() {
  if (!isFirebaseConfigured) return;
  try {
    await setDoc(doc(db, 'stats', 'global'), { totalScans: increment(1) }, { merge: true });
  } catch (err) {
    console.warn('[scans] global counter not updated:', err.code || err.message);
  }
}

/** Save a finished scan for a signed-in user. Returns the new doc id or null. */
export async function saveScan(user, result) {
  if (!isFirebaseConfigured || !user || !result) return null;
  const entry = {
    uid: user.uid,
    scanType: result.scanType,
    inputPreview: result.inputPreview || '',
    threatScore: result.threatScore,
    verdict: result.verdict,
    summary: result.summary || '',
    timestamp: serverTimestamp(),
    report: STORE_FULL_REPORT.has(result.scanType) ? stripForStorage(result) : null,
  };
  try {
    const ref = await addDoc(collection(db, 'scans'), entry);
    await setDoc(doc(db, 'users', user.uid), { totalScans: increment(1) }, { merge: true }).catch(() => {});
    return ref.id;
  } catch (err) {
    console.warn('[scans] save failed:', err.code || err.message);
    return null;
  }
}

/** Firestore rejects nested undefined values; also trim huge engine lists. */
function stripForStorage(result) {
  const clone = JSON.parse(JSON.stringify(result));
  if (clone.scanType === 'message') clone.input = null;
  return clone;
}

/**
 * Fetch the user's scans. We filter by uid only (single-field index exists by
 * default) and sort client-side, which avoids needing a composite index.
 */
export async function fetchUserScans(uid, max = 200) {
  if (!isFirebaseConfigured || !uid) return [];
  const q = query(collection(db, 'scans'), where('uid', '==', uid), limit(max));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return { id: d.id, ...data, timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date() };
    })
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function deleteScan(id) {
  if (!isFirebaseConfigured) return;
  await deleteDoc(doc(db, 'scans', id));
}
