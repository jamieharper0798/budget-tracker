import { useState } from 'react';
import type { FormEvent } from 'react';
import { firebaseConfigured } from '../lib/firebase';
import { authErrorMessage } from '../lib/authErrors';
import { GoogleIcon } from '../components/Icons';
import { ProgressRing } from '../components/ProgressRing';

interface Props {
  onSignUp: (email: string, password: string, name: string) => Promise<unknown>;
  onLogIn: (email: string, password: string) => Promise<unknown>;
  onGoogle: () => Promise<unknown>;
  onResetPassword: (email: string) => Promise<unknown>;
}

type Mode = 'login' | 'signup' | 'reset';

const FLOATERS = [
  { e: '💧', x: '8%', y: '14%', d: '0s' },
  { e: '📚', x: '82%', y: '10%', d: '0.8s' },
  { e: '🧘', x: '88%', y: '62%', d: '1.6s' },
  { e: '🏃', x: '4%', y: '70%', d: '2.2s' },
  { e: '🔥', x: '70%', y: '86%', d: '1.1s' },
];

export function AuthScreen({ onSignUp, onLogIn, onGoogle, onResetPassword }: Props) {
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const input =
    'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-fuchsia-400/60 focus:bg-white/10';

  if (!firebaseConfigured) {
    return (
      <div className="bg-aurora flex min-h-dvh items-center justify-center px-4">
        <div className="glass max-w-sm rounded-3xl p-6 text-center">
          <p className="text-3xl">🔧</p>
          <p className="mt-2 font-semibold">Firebase isn't set up yet</p>
          <p className="mt-2 text-sm text-white/50">Add your Firebase web config to src/lib/firebaseConfig.ts.</p>
        </div>
      </div>
    );
  }

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setNotice('');
  };

  const run = async (fn: () => Promise<unknown>) => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || (mode !== 'reset' && !password)) {
      setError('Please fill in all fields.');
      return;
    }
    void run(async () => {
      if (mode === 'signup') await onSignUp(trimmed, password, name.trim());
      else if (mode === 'login') await onLogIn(trimmed, password);
      else {
        await onResetPassword(trimmed);
        setNotice('Check your inbox for a reset link.');
      }
    });
  };

  return (
    <div className="bg-aurora relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-10">
      {FLOATERS.map((f) => (
        <span
          key={f.e}
          aria-hidden
          className="animate-float pointer-events-none absolute text-3xl opacity-40 blur-[0.5px] sm:text-4xl"
          style={{ left: f.x, top: f.y, animationDelay: f.d }}
        >
          {f.e}
        </span>
      ))}

      <div className="animate-rise relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative">
            <div className="animate-glow absolute inset-0 rounded-full bg-fuchsia-500/40 blur-2xl" />
            <ProgressRing value={0.8} size={84} stroke={9}>
              <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5 9-10" className="animate-check" />
              </svg>
            </ProgressRing>
          </div>
          <h1 className="font-display mt-5 text-4xl font-extrabold tracking-tight">
            <span className="text-gradient">Momentum</span>
          </h1>
          <p className="mt-2 max-w-[18rem] text-[15px] text-white/60">
            {mode === 'signup'
              ? 'Tiny wins, every day. Build habits that actually stick.'
              : mode === 'reset'
                ? 'We’ll email you a link to reset your password.'
                : 'Welcome back — your streak is waiting.'}
          </p>
        </div>

        <div className="glass rounded-[2rem] p-5 shadow-2xl shadow-black/40">
          {mode !== 'reset' && (
            <>
              <button
                onClick={() => run(onGoogle)}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-3.5 text-[15px] font-semibold text-gray-900 transition active:scale-[0.98] disabled:opacity-60"
              >
                <GoogleIcon className="h-5 w-5" /> Continue with Google
              </button>
              <div className="my-4 flex items-center gap-3 text-xs text-white/35">
                <span className="h-px flex-1 bg-white/10" /> or with email <span className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <input className={input} placeholder="Your first name" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input className={input} type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {mode !== 'reset' && (
              <input
                className={input}
                type="password"
                placeholder="Password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}

            {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}
            {notice && <p className="text-sm text-emerald-400">{notice}</p>}

            <button type="submit" disabled={busy} className="btn-primary mt-1 rounded-2xl py-3.5 text-[15px] font-bold text-white disabled:opacity-60">
              {busy ? 'One sec…' : mode === 'signup' ? 'Start my streak 🔥' : mode === 'reset' ? 'Send reset link' : 'Log in'}
            </button>
          </form>
        </div>

        <div className="mt-5 flex flex-col items-center gap-2.5 text-sm text-white/50">
          {mode === 'signup' && (
            <button onClick={() => switchMode('login')}>
              Already have an account? <span className="font-semibold text-fuchsia-300">Log in</span>
            </button>
          )}
          {mode === 'login' && (
            <>
              <button onClick={() => switchMode('signup')}>
                New here? <span className="font-semibold text-fuchsia-300">Create an account</span>
              </button>
              <button onClick={() => switchMode('reset')} className="text-white/40">Forgot password?</button>
            </>
          )}
          {mode === 'reset' && <button onClick={() => switchMode('login')}>Back to log in</button>}
        </div>
      </div>
    </div>
  );
}
