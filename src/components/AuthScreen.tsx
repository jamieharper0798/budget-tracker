import { useState } from 'react';
import type { FormEvent } from 'react';
import { firebaseConfigured } from '../lib/firebase';
import { authErrorMessage } from '../lib/authErrors';

interface Props {
  onSignUp: (email: string, password: string) => Promise<unknown>;
  onLogIn: (email: string, password: string) => Promise<unknown>;
  onResetPassword: (email: string) => Promise<unknown>;
}

type Mode = 'login' | 'signup' | 'reset';

export function AuthScreen({ onSignUp, onLogIn, onResetPassword }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-400/50 focus:bg-white/8';

  if (!firebaseConfigured) {
    return (
      <div className="bg-ledger flex min-h-screen items-center justify-center px-4">
        <div className="glass max-w-sm rounded-2xl p-6 text-center">
          <p className="text-3xl">🔧</p>
          <p className="mt-2 text-sm font-semibold text-white">Firebase isn't set up yet</p>
          <p className="mt-2 text-xs text-white/50">
            Add your Firebase project's web config to <code className="text-white/70">src/lib/firebaseConfig.ts</code>{' '}
            to enable login and cross-device sync. See the README for setup steps.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail || (mode !== 'reset' && !password)) {
      setError('Please fill in all fields.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        await onSignUp(trimmedEmail, password);
      } else if (mode === 'login') {
        await onLogIn(trimmedEmail, password);
      } else {
        await onResetPassword(trimmedEmail);
        setNotice('Check your email for a password reset link.');
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-ledger flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-sm rounded-2xl p-6">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">💰</span>
          <h1 className="font-display text-xl font-bold text-white">Ledger</h1>
          <p className="text-xs text-white/40">
            {mode === 'signup' ? 'Create an account to sync across devices' : mode === 'reset' ? 'Reset your password' : 'Log in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className={inputClass}
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          {mode !== 'reset' && (
            <input
              className={inputClass}
              type="password"
              placeholder="Password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}

          {error && <p className="text-xs text-rose-400">{error}</p>}
          {notice && <p className="text-xs text-emerald-400">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {busy ? 'Please wait…' : mode === 'signup' ? 'Sign up' : mode === 'reset' ? 'Send reset link' : 'Log in'}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2 text-xs text-white/40">
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('signup'); setError(''); setNotice(''); }} className="hover:text-white">
                Need an account? <span className="text-emerald-400">Sign up</span>
              </button>
              <button onClick={() => { setMode('reset'); setError(''); setNotice(''); }} className="hover:text-white">
                Forgot password?
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button onClick={() => { setMode('login'); setError(''); setNotice(''); }} className="hover:text-white">
              Already have an account? <span className="text-emerald-400">Log in</span>
            </button>
          )}
          {mode === 'reset' && (
            <button onClick={() => { setMode('login'); setError(''); setNotice(''); }} className="hover:text-white">
              Back to log in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
