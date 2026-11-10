import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="animate-rise card pointer-events-auto flex items-center gap-3 !rounded-full py-2 pl-4 pr-2 text-sm text-ink">
        <span>A new version is ready</span>
        <button onClick={() => updateServiceWorker(true)} className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-ink">
          Refresh
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          className="rounded-full p-1.5 text-muted hover:text-ink"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
