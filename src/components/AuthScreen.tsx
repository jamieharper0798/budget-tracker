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

const inputClass =
  'w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none focus:border-ink/20 focus:bg-surface';

export function AuthScreen({ onSignUp, onLogIn, onResetPassword }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  if (!firebaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="card max-w-sm p-6 text-center">
          <p className="text-3xl">🔧</p>
          <p className="mt-2 text-sm font-semibold text-ink">Firebase isn't set up yet</p>
          <p className="mt-2 text-xs text-muted">
            Add your Firebase project's web config to <code className="text-ink">src/lib/firebaseConfig.ts</code> to
            enable login and cross-device sync. See the README for setup steps.
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
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l6-6 4 4 8-8" />
              <path d="M14 7h7v7" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Ledgerly</h1>
          <p className="text-xs text-muted">
            {mode === 'signup'
              ? 'Create an account to sync across devices'
              : mode === 'reset'
                ? 'Reset your password'
                : 'Log in to your account'}
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

          {error && <p className="text-xs text-alert">{error}</p>}
          {notice && <p className="text-xs text-[var(--color-ok-fg)]">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {busy ? 'Please wait…' : mode === 'signup' ? 'Sign up' : mode === 'reset' ? 'Send reset link' : 'Log in'}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2 text-xs text-muted">
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('signup'); setError(''); setNotice(''); }} className="hover:text-ink">
                Need an account? <span className="font-semibold text-ink">Sign up</span>
              </button>
              <button onClick={() => { setMode('reset'); setError(''); setNotice(''); }} className="hover:text-ink">
                Forgot password?
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button onClick={() => { setMode('login'); setError(''); setNotice(''); }} className="hover:text-ink">
              Already have an account? <span className="font-semibold text-ink">Log in</span>
            </button>
          )}
          {mode === 'reset' && (
            <button onClick={() => { setMode('login'); setError(''); setNotice(''); }} className="hover:text-ink">
              Back to log in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
