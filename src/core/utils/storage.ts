import type { StorageAdapter, GameStats, DalgonaStats } from '@core/types';

const STATS_KEY = 'squidMathStats';
const DALGONA_KEY = 'dalgonaStats';

/**
 * Create web storage adapter (localStorage)
 */
export function createWebStorage(): StorageAdapter {
  return {
    get: async (key: string) => localStorage.getItem(key),
    set: async (key: string, value: string) => localStorage.setItem(key, value),
    remove: async (key: string) => localStorage.removeItem(key),
  };
}

/**
 * Get today's date key
 */
export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Load game stats from storage
 */
export function loadGameStats(): GameStats {
  const data = localStorage.getItem(STATS_KEY);
  if (data) {
    const stats: GameStats = JSON.parse(data);
    if (stats.date !== getTodayKey()) {
      return { date: getTodayKey(), sessions: 0, correct: 0, best: stats.best || 0 };
    }
    return stats;
  }
  return { date: getTodayKey(), sessions: 0, correct: 0, best: 0 };
}

/**
 * Save game stats to storage
 */
export function saveGameStats(stats: GameStats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

/**
 * Load dalgona stats from storage
 */
export function loadDalgonaStats(): DalgonaStats {
  const data = localStorage.getItem(DALGONA_KEY);
  return data ? JSON.parse(data) : { completed: [] };
}

/**
 * Save dalgona stats to storage
 */
export function saveDalgonaStats(stats: DalgonaStats): void {
  localStorage.setItem(DALGONA_KEY, JSON.stringify(stats));
}
