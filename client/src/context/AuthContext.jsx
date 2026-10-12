import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../lib/firebase';

/**
 * Auth context: exposes { user, loading, signInWithGoogle, signOut, configured }.
 * - Subscribes to Firebase's onAuthStateChanged once for the whole app.
 * - On sign-in, upserts the user's profile in Firestore users/{uid}
 *   (name, email, photoURL, joinDate). totalScans is incremented per scan.
 * - When Firebase is not configured everything is a safe no-op.
 */
const AuthContext = createContext({ user: null, loading: false, configured: false, signInWithGoogle: async () => {}, signOut: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) throw new Error('Firebase is not configured. Add VITE_FIREBASE_* keys to client/.env.');
    const cred = await signInWithPopup(auth, googleProvider);
    const u = cred.user;
    // Upsert profile (merge keeps totalScans / joinDate from earlier sessions)
    await setDoc(
      doc(db, 'users', u.uid),
      { uid: u.uid, name: u.displayName || '', email: u.email || '', photoURL: u.photoURL || '', lastLogin: serverTimestamp(), joinDate: serverTimestamp() },
      { mergeFields: ['uid', 'name', 'email', 'photoURL', 'lastLogin'] },
    ).catch(() => {});
    // joinDate only on first creation: write it separately with merge if missing
    await setDoc(doc(db, 'users', u.uid), { joinDate: serverTimestamp() }, { merge: true }).catch(() => {});
    return u;
  };

  const signOut = () => (isFirebaseConfigured ? fbSignOut(auth) : Promise.resolve());

  return (
    <AuthContext.Provider value={{ user, loading, configured: isFirebaseConfigured, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
