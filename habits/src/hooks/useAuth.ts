import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseConfigured } from '../lib/firebase';

const notConfigured = () => Promise.reject(new Error('Firebase is not configured.'));

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    if (!auth) return notConfigured();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    return cred;
  };

  const logIn = (email: string, password: string) =>
    auth ? signInWithEmailAndPassword(auth, email, password) : notConfigured();

  const logInWithGoogle = async () => {
    if (!auth) return notConfigured();
    const provider = new GoogleAuthProvider();
    try {
      return await signInWithPopup(auth, provider);
    } catch (err) {
      if ((err as { code?: string }).code === 'auth/popup-blocked') return signInWithRedirect(auth, provider);
      throw err;
    }
  };

  const logOut = () => (auth ? signOut(auth) : Promise.resolve());

  const resetPassword = (email: string) => (auth ? sendPasswordResetEmail(auth, email) : notConfigured());

  return { user, loading, signUp, logIn, logInWithGoogle, logOut, resetPassword };
}
