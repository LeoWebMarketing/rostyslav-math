import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export function legacyGameDestination(pathname: string, search: string): string | null {
  if (pathname !== '/') return null;
  const params = new URLSearchParams(search);
  return params.has('game') ? `/g2/?${params.toString()}` : null;
}

export function LegacyGameRedirect({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  const destination = legacyGameDestination(pathname, search);
  if (destination) {
    if (typeof window !== 'undefined') window.location.replace(destination);
    return null;
  }
  return <>{children}</>;
}
