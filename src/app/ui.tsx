import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { guestStats, useProgress } from '../features/progress/store';

type ArtProps = {
  file: string;
  fallback: ReactNode;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
  eager?: boolean;
};

export function Art({ file, fallback, className = '', alt = '', width = 96, height = 96, eager = false }: ArtProps) {
  const [broken, setBroken] = useState(false);
  return broken
    ? <span className={className} aria-hidden={alt ? undefined : true}>{fallback}</span>
    : (
      <img
        className={className}
        src={file}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setBroken(true)}
      />
    );
}

const mascotArt = {
  hello: '/theme/dino/mascot-hello.webp',
  thinking: '/theme/dino/mascot-thinking.webp',
  cheer: '/theme/dino/mascot-cheer.webp',
  oops: '/theme/dino/mascot-oops.webp',
  sleep: '/theme/dino/mascot-sleep.webp',
} as const;

export function Mascot({
  pose, size, className = '', eager = false,
}: {
  pose: keyof typeof mascotArt; size: number; className?: string; eager?: boolean;
}) {
  return (
    <Art
      file={mascotArt[pose]}
      fallback={pose === 'sleep' ? '💤' : '🦖'}
      className={className}
      alt=""
      width={size}
      height={size}
      eager={eager}
    />
  );
}

export function Shell({ children, title, back = '/', contentClassName = '' }: { children: ReactNode; title?: string; back?: string; contentClassName?: string }) {
  const { pathname } = useLocation();
  const { user, activeProfileId, profiles, guest, streak, todayXp, authAvailable } = useProgress();
  const stats = user ? { streak, todayXp } : guestStats(guest);
  const active = profiles.find(profile => profile.id === activeProfileId);
  return <div className="jungle-page">
    <header className="site-header">
      {pathname !== '/' && <Link className="back-link" to={back} aria-label="Назад">←</Link>}
      {title === 'Класно' ? (
        <div className="header-brand">
          <Art file="/theme/dino/logo-mark.webp" fallback="🦖" className="header-mark" width={40} height={40} eager />
          <strong>Класно</strong>
        </div>
      ) : (
        <>
          <Art file="/theme/dino/logo-mark.webp" fallback="🦖" className="header-mark" width={40} height={40} eager />
          <strong>{title ?? 'Класно'}</strong>
        </>
      )}
      <div className="header-stats">
        <span aria-label={`Серія ${stats.streak} днів`}>🔥 {stats.streak}</span>
        <span aria-label={`${stats.todayXp} досвіду сьогодні`}>⭐ {stats.todayXp}</span>
      </div>
      {user ? (
        <Link className="profile-link" to="/profiles" aria-label="Профілі">
          <span className="profile-icon" aria-hidden="true">{active?.avatar ?? '👤'}</span>
          <span className="profile-label">{active?.name ?? 'Профілі'}</span>
        </Link>
      ) : authAvailable ? (
        <a className="profile-link" href="/api/auth/google" aria-label="Увійти">
          <span className="profile-icon" aria-hidden="true">↪</span>
          <span className="profile-label">Увійти</span>
        </a>
      ) : null}
    </header>
    <main className={`page-content ${contentClassName}`}>{children}</main>
  </div>;
}
