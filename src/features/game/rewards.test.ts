import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProgress } from '../progress/store';

const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
});

beforeEach(() => {
  storage.clear();
  useProgress.setState({
    user: null, activeProfileId: null, gameTickets: 0, gameRubies: 0,
    lastGameContext: null, gameMistakes: [], gamePractised: [],
    guest: { lessons: {}, days: {}, mistakes: [] },
  });
});

describe('game rewards', () => {
  it('grants one ticket per real lesson, stores at most three, and spends one on a spin', async () => {
    for (let i = 0; i < 5; i++) await useProgress.getState().recordLesson('3/math/tables/l1', 3, 1, 10, []);
    expect(useProgress.getState().gameTickets).toBe(3);
    expect(useProgress.getState().lastGameContext).toEqual({ grade: 3, subject: 'math', section: 'tables' });
    expect(useProgress.getState().spendGameTicket()).toBe(true);
    expect(useProgress.getState().gameTickets).toBe(2);
    await useProgress.getState().recordLesson('review/recent/all/review', 3, 1, 0, []);
    expect(useProgress.getState().gameTickets).toBe(2);
    expect(JSON.parse(storage.get('klasno.game.v1.guest') ?? '{}').tickets).toBe(2);
  });

  it('persists rubies and marks a wrong exercise as practised', () => {
    const key = '3/english/animals/l1|cat';
    useProgress.getState().addGameRubies(14);
    useProgress.getState().recordGameMistake(key);
    expect(useProgress.getState().gameMistakes).toContain(key);
    useProgress.getState().markGamePractised(key);
    expect(useProgress.getState().gameMistakes).not.toContain(key);
    expect(useProgress.getState().gamePractised).toContain(key);
    expect(JSON.parse(storage.get('klasno.game.v1.guest') ?? '{}').rubies).toBe(14);
  });
});
