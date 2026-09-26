import { create } from 'zustand';
import { api, type Profile, type User, type LessonProgress } from '../../lib/api';
import type { Attempt } from '../lesson/engine';

export const GUEST_KEY = 'klasno.guest.v1';
const PROFILE_KEY = 'klasno.profile.v1';
const IMPORT_KEY = 'klasno.imported.v1';
const GAME_KEY = 'klasno.game.v1';
export type GameContext = { grade: number; subject: string; section: string };
type GameData = { tickets: number; rubies: number; lastContext: GameContext | null; mistakes: string[]; practised: string[] };
const emptyGame = (): GameData => ({ tickets: 0, rubies: 0, lastContext: null, mistakes: [], practised: [] });
const gameProfileKey = (user: User | null, activeProfileId: string | null) => user && activeProfileId ? activeProfileId : 'guest';
export type GuestData = {
  lessons: Record<string, { bestStars: number; bestAccuracy: number; completions: number; lastAt?: number }>;
  days: Record<string, number>;
  mistakes: string[];
};
const emptyGuest = (): GuestData => ({ lessons: {}, days: {}, mistakes: [] });
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private browsing */ } };
function readGame(profileKey: string): GameData {
  try {
    const raw = read(`${GAME_KEY}.${profileKey}`);
    if (!raw) return profileKey === 'guest'
      ? { ...emptyGame(), mistakes: readGuest().mistakes } : emptyGame();
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return emptyGame();
    const value = data as Partial<GameData>;
    const guestMistakes = profileKey === 'guest' ? readGuest().mistakes : [];
    const practised = Array.isArray(value.practised) ? value.practised.filter((item): item is string => typeof item === 'string') : [];
    return {
      tickets: Number.isInteger(value.tickets) ? Math.max(0, Math.min(3, value.tickets!)) : 0,
      rubies: Number.isInteger(value.rubies) ? Math.max(0, value.rubies!) : 0,
      lastContext: value.lastContext && Number.isInteger(value.lastContext.grade)
        && typeof value.lastContext.subject === 'string' && typeof value.lastContext.section === 'string'
        ? value.lastContext : null,
      mistakes: [...new Set([
        ...(Array.isArray(value.mistakes) ? value.mistakes.filter((item): item is string => typeof item === 'string') : []),
        ...guestMistakes,
      ])].filter(key => !practised.includes(key)).slice(-100),
      practised,
    };
  } catch { return emptyGame(); }
}

export function readGuest(): GuestData {
  try {
    const raw = read(GUEST_KEY);
    if (!raw) return emptyGuest();
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !data.lessons || !data.days || !Array.isArray(data.mistakes)) return emptyGuest();
    return data as GuestData;
  } catch { return emptyGuest(); }
}

function kyivDay(): string {
  return new Intl.DateTimeFormat(
    'en-CA',
    { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit' },
  ).format(new Date());
}
function guestStreak(days: Record<string, number>) {
  const day = new Date(`${kyivDay()}T12:00:00Z`);
  if (!days[kyivDay()]) day.setUTCDate(day.getUTCDate() - 1);
  let streak = 0;
  while (days[day.toISOString().slice(0, 10)]) { streak++; day.setUTCDate(day.getUTCDate() - 1); }
  return streak;
}

type ProgressState = {
  guest: GuestData; authAvailable: boolean; user: User | null; profiles: Profile[]; activeProfileId: string | null;
  remote: LessonProgress[]; streak: number; todayXp: number;
  gameTickets: number; gameRubies: number; lastGameContext: GameContext | null;
  gameMistakes: string[]; gamePractised: string[];
  spendGameTicket: () => boolean; addGameRubies: (amount: number) => void;
  recordGameMistake: (mistakeKey: string) => void; markGamePractised: (mistakeKey: string) => void;
  initialize: () => Promise<void>; selectProfile: (id: string) => Promise<void>;
  recordLesson: (lessonKey: string, stars: number, accuracy: number, xp: number, attempts: Attempt[]) => Promise<void>;
  refreshProgress: () => Promise<void>; importGuest: () => Promise<boolean>; clearUser: () => Promise<void>;
};

export const useProgress = create<ProgressState>((set, get) => ({
  guest: readGuest(), authAvailable: false, user: null, profiles: [], activeProfileId: read(PROFILE_KEY), remote: [], streak: 0, todayXp: 0,
  ...gameFields(readGame('guest')),
  spendGameTicket: () => {
    if (get().gameTickets < 1) return false;
    saveGame(get, set, data => ({ ...data, tickets: data.tickets - 1 }));
    return true;
  },
  addGameRubies: amount => {
    if (!Number.isInteger(amount) || amount <= 0) return;
    saveGame(get, set, data => ({ ...data, rubies: data.rubies + amount }));
  },
  recordGameMistake: mistakeKey => {
    if (!mistakeKey.includes('|')) return;
    saveGame(get, set, data => ({ ...data,
      mistakes: [...new Set([...data.mistakes, mistakeKey])].slice(-100),
      practised: data.practised.filter(key => key !== mistakeKey),
    }));
  },
  markGamePractised: mistakeKey => {
    saveGame(get, set, data => ({ ...data,
      mistakes: data.mistakes.filter(key => key !== mistakeKey),
      practised: [...new Set([...data.practised, mistakeKey])].slice(-100),
    }));
  },
  initialize: async () => {
    try {
      const config = await api.config();
      if (!config.auth) { set({ authAvailable: false, user: null, activeProfileId: null, ...gameFields(readGame('guest')) }); return; }
      set({ authAvailable: true });
      const me = await api.me();
      const active = me.profiles.some(profile => profile.id === get().activeProfileId) ? get().activeProfileId : me.profiles[0]?.id ?? null;
      set({ user: me.user, profiles: me.profiles, activeProfileId: active,
        ...gameFields(readGame(gameProfileKey(me.user, active))) });
      if (me.user && active) await get().refreshProgress();
    } catch { set({ authAvailable: false, user: null, profiles: [], activeProfileId: null, ...gameFields(readGame('guest')) }); }
  },
  selectProfile: async id => { write(PROFILE_KEY, id); set({ activeProfileId: id,
    ...gameFields(readGame(gameProfileKey(get().user, id))) }); await get().refreshProgress(); },
  refreshProgress: async () => {
    const id = get().activeProfileId;
    if (!get().user || !id) return;
    try {
      const data = await api.progress(id);
      if (get().activeProfileId !== id) return;
      set({ remote: data.lessons, streak: data.streak, todayXp: data.todayXp });
      try {
        const review = await api.review(id);
        if (get().activeProfileId !== id) return;
        saveGame(get, set, game => ({ ...game,
          mistakes: [...new Set([...game.mistakes,
            ...review.mistakes.map(item => `${item.lessonKey}|${item.exerciseId}`)])]
            .filter(key => !game.practised.includes(key)).slice(-100),
        }));
      } catch { /* game uses locally recorded mistakes when review is unavailable */ }
    }
    catch {
      set({
        user: null, profiles: [], activeProfileId: null, remote: [],
        streak: guestStreak(get().guest.days), todayXp: get().guest.days[kyivDay()] ?? 0,
        ...gameFields(readGame('guest')),
      });
    }
  },
  recordLesson: async (lessonKey, stars, accuracy, xp, attempts) => {
    const [gradeText, subject, section] = lessonKey.split('/');
    const grade = Number(gradeText);
    if (Number.isInteger(grade) && subject && section && !lessonKey.startsWith('review/')) {
      saveGame(get, set, data => ({ ...data, tickets: Math.min(3, data.tickets + 1),
        lastContext: { grade, subject, section },
        mistakes: [...new Set([...data.mistakes,
          ...attempts.filter(attempt => !attempt.correct).map(attempt => `${lessonKey}|${attempt.exerciseId}`)])].slice(-100),
        practised: data.practised.filter(key => !attempts.some(attempt => !attempt.correct && key === `${lessonKey}|${attempt.exerciseId}`)),
      }));
    }
    const id = get().activeProfileId;
    if (get().user && id) {
      try { await api.saveLesson({ profileId: id, lessonKey, stars, accuracy, xp, attempts }); await get().refreshProgress(); return; }
      catch {
        set({ user: null, profiles: [], activeProfileId: null, remote: [], ...gameFields(readGame('guest')) });
        if (Number.isInteger(grade) && subject && section) {
          saveGame(get, set, data => ({ ...data, tickets: Math.min(3, data.tickets + 1),
            lastContext: { grade, subject, section },
            mistakes: [...new Set([...data.mistakes,
              ...attempts.filter(attempt => !attempt.correct).map(attempt => `${lessonKey}|${attempt.exerciseId}`)])].slice(-100),
          }));
        }
      }
    }
    const guest = get().guest;
    const prior = guest.lessons[lessonKey];
    const next: GuestData = {
      lessons: {
        ...guest.lessons,
        [lessonKey]: {
          bestStars: Math.max(prior?.bestStars ?? 0, stars),
          bestAccuracy: Math.max(prior?.bestAccuracy ?? 0, accuracy),
          completions: (prior?.completions ?? 0) + 1,
          lastAt: Date.now(),
        },
      },
      days: { ...guest.days, [kyivDay()]: (guest.days[kyivDay()] ?? 0) + xp },
      mistakes: [
        ...guest.mistakes,
        ...attempts.filter(attempt => !attempt.correct).map(attempt => `${lessonKey}|${attempt.exerciseId}`),
      ].slice(-100),
    };
    write(GUEST_KEY, JSON.stringify(next)); set({ guest: next });
  },
  importGuest: async () => {
    const { user, activeProfileId, guest } = get();
    if (!user || !activeProfileId || read(IMPORT_KEY)) return false;
    try {
      for (const [lessonKey, progress] of Object.entries(guest.lessons)) {
        for (let count = 0; count < Math.max(1, Math.min(progress.completions, 100)); count++) {
          const attempts = count === 0
            ? guest.mistakes.filter(item => item.startsWith(`${lessonKey}|`))
              .map(item => ({ exerciseId: item.slice(lessonKey.length + 1), correct: false, answer: '' }))
            : [];
          await api.saveLesson({
            profileId: activeProfileId, lessonKey, stars: progress.bestStars,
            accuracy: progress.bestAccuracy, xp: 0, attempts,
          });
        }
      }
      write(IMPORT_KEY, '1'); await get().refreshProgress(); return true;
    } catch { return false; }
  },
  clearUser: async () => {
    try { await api.logout(); } catch { /* already offline */ }
    set({ user: null, profiles: [], activeProfileId: null, remote: [], ...gameFields(readGame('guest')) });
  },
}));

function gameFields(data: GameData) {
  return { gameTickets: data.tickets, gameRubies: data.rubies, lastGameContext: data.lastContext,
    gameMistakes: data.mistakes, gamePractised: data.practised };
}
function saveGame(
  get: () => ProgressState,
  set: (partial: Partial<ProgressState>) => void,
  update: (data: GameData) => GameData,
) {
  const state = get();
  const profileKey = gameProfileKey(state.user, state.activeProfileId);
  const data = update({ tickets: state.gameTickets, rubies: state.gameRubies,
    lastContext: state.lastGameContext, mistakes: state.gameMistakes, practised: state.gamePractised });
  write(`${GAME_KEY}.${profileKey}`, JSON.stringify(data));
  set(gameFields(data));
}

export function isImportAvailable(profileId: string | null, guest: GuestData): boolean {
  return Boolean(profileId && Object.keys(guest.lessons).length && !read(IMPORT_KEY));
}
export function guestStats(guest: GuestData) { return { streak: guestStreak(guest.days), todayXp: guest.days[kyivDay()] ?? 0 }; }
