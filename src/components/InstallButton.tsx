import { useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export function InstallButton() {
  const { canInstall, iosHint, promptInstall } = useInstallPrompt();
  const [showIosHint, setShowIosHint] = useState(false);

  if (!canInstall && !iosHint) return null;

  return (
    <div className="relative">
      <button
        onClick={() => (canInstall ? promptInstall() : setShowIosHint((v) => !v))}
        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13m0 0-4-4m4 4 4-4M5 19h14" />
        </svg>
        Install App
      </button>

      {showIosHint && (
        <div className="glass animate-rise absolute right-0 top-full z-10 mt-2 w-56 rounded-xl p-3 text-left text-xs text-white/70">
          Tap the Share icon <span className="text-white">⬆️</span> then{' '}
          <span className="font-semibold text-white">Add to Home Screen</span> to install Ledger.
        </div>
      )}
    </div>
  );
}
