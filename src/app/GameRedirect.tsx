import { useEffect } from 'react';

export function GameRedirect() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('game')) {
      const game = params.get('game');
      window.location.href = `/g2/?game=${game}`;
    } else {
      window.location.href = '/';
    }
  }, []);

  return null;
}
