import { useState } from 'react';
import type { Settings } from '../types';
import type { Stats } from '../lib/game';
import { levelTitle } from '../lib/game';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

interface Props {
  email: string | null;
  settings: Settings;
  stats: Stats;
  onUpdate: (s: Partial<Settings>) => void;
  onLogOut: () => void;
}

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <button onClick={() => onChange(!on)} className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left" role="switch" aria-checked={on}>
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="block text-xs text-white/45">{hint}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-gradient-to-r from-pink-500 to-fuchsia-500' : 'bg-white/15'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );
}

export function ProfileScreen({ email, settings, stats, onUpdate, onLogOut }: Props) {
  const [name, setName] = useState(settings.name);
  const { canInstall, iosHint, promptInstall } = useInstallPrompt();
  const initial = (settings.name || email || '?').charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[28px] font-extrabold tracking-tight">Profile</h1>

      <section className="glass flex items-center gap-4 rounded-[2rem] p-5">
        <span className="font-display flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-400 text-2xl font-extrabold shadow-lg shadow-fuchsia-500/30">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{settings.name || 'Habit hero'}</p>
          <p className="truncate text-sm text-white/45">{email}</p>
          <p className="mt-1 text-xs font-semibold text-fuchsia-300">
            Level {stats.level} · {levelTitle(stats.level)}
          </p>
        </div>
      </section>

      <section className="glass rounded-3xl p-4">
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-white/40" htmlFor="display-name">
          Display name
        </label>
        <div className="flex gap-2">
          <input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="What should we call you?"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 outline-none placeholder:text-white/30 focus:border-fuchsia-400/60"
          />
          <button
            onClick={() => onUpdate({ name: name.trim() })}
            disabled={name.trim() === settings.name}
            className="rounded-xl bg-white px-4 text-sm font-bold text-gray-900 disabled:opacity-30"
          >
            Save
          </button>
        </div>
      </section>

      <section className="glass divide-y divide-white/8 overflow-hidden rounded-3xl">
        <Toggle on={settings.sound} onChange={(v) => onUpdate({ sound: v })} label="Sounds" hint="Satisfying chimes when you check in" />
        <Toggle on={settings.haptics} onChange={(v) => onUpdate({ haptics: v })} label="Haptics" hint="Vibration feedback on supported phones" />
      </section>

      {(canInstall || iosHint) && (
        <section className="glass rounded-3xl p-4">
          <p className="font-semibold">📲 Install Momentum</p>
          {canInstall ? (
            <>
              <p className="mt-1 text-sm text-white/50">Add it to your home screen for a full-screen, app-like experience.</p>
              <button onClick={promptInstall} className="btn-primary mt-3 w-full rounded-xl py-2.5 text-sm font-bold">Install app</button>
            </>
          ) : (
            <p className="mt-1 text-sm text-white/50">
              Tap the Share icon in Safari, then <span className="font-semibold text-white">Add to Home Screen</span>.
            </p>
          )}
        </section>
      )}

      <button onClick={onLogOut} className="rounded-2xl bg-white/6 py-3.5 font-semibold text-rose-300 transition hover:bg-white/10">
        Log out
      </button>
    </div>
  );
}
