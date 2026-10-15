import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(0.75rem+env(safe-area-inset-top,0px))] z-50 flex justify-center px-4">
      <div className="glass animate-rise pointer-events-auto flex items-center gap-3 rounded-full py-2 pl-4 pr-2 text-sm shadow-xl shadow-black/30">
        <span>A new version is ready</span>
        <button onClick={() => updateServiceWorker(true)} className="btn-primary rounded-full px-3 py-1.5 text-xs font-bold">Refresh</button>
        <button onClick={() => setNeedRefresh(false)} className="rounded-full p-1.5 text-white/40 hover:text-white" aria-label="Dismiss">✕</button>
      </div>
    </div>
  );
}
