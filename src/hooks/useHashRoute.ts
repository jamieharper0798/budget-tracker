import { useEffect, useState } from 'react';

export type Route = 'overview' | 'bills' | 'savings' | 'calendar' | 'settings';

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (h === 'bills') return 'bills';
  if (h === 'savings') return 'savings';
  if (h === 'calendar') return 'calendar';
  if (h === 'settings') return 'settings';
  return 'overview';
}

/** Hash-based navigation for the desktop top-bar tabs (Overview/Bills/Savings/Calendar/Settings).
 * Not react-router: the app deploys as a static site on GitHub Pages with no SPA-fallback 404, so a
 * direct hit on a path-based route like /bills would 404. A URL hash always resolves to the same
 * index.html with no server config needed. */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => (typeof window === 'undefined' ? 'overview' : parseHash()));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}
