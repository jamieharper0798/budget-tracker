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
        className="flex min-h-10 items-center gap-1.5 rounded-[14px] bg-accent px-3 text-xs font-semibold text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13m0 0-4-4m4 4 4-4M5 19h14" />
        </svg>
        Install App
      </button>

      {showIosHint && (
        <div className="animate-rise card-sm absolute right-0 top-full z-10 mt-2 w-56 p-3 text-left text-xs text-muted">
          Tap the Share icon <span className="text-ink">⬆️</span> then{' '}
          <span className="font-semibold text-ink">Add to Home Screen</span> to install Ledgerly.
        </div>
      )}
    </div>
  );
}
