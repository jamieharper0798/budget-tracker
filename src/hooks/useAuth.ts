import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, firebaseConfigured } from '../lib/firebase';

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

  const signUp = (email: string, password: string) => {
    if (!auth) return Promise.reject(new Error('Firebase is not configured.'));
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logIn = (email: string, password: string) => {
    if (!auth) return Promise.reject(new Error('Firebase is not configured.'));
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logOut = () => {
    if (!auth) return Promise.resolve();
    return signOut(auth);
  };

  const resetPassword = (email: string) => {
    if (!auth) return Promise.reject(new Error('Firebase is not configured.'));
    return sendPasswordResetEmail(auth, email);
  };

  return { user, loading, signUp, logIn, logOut, resetPassword };
}
