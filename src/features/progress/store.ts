import { create } from 'zustand';
import { api, type Profile, type User, type LessonProgress } from '../../lib/api';
import type { Attempt } from '../lesson/engine';

export const GUEST_KEY = 'klasno.guest.v1';
const PROFILE_KEY = 'klasno.profile.v1';
const IMPORT_KEY = 'klasno.imported.v1';
export type GuestData = {
  lessons: Record<string, { bestStars: number; bestAccuracy: number; completions: number }>;
  days: Record<string, number>;
  mistakes: string[];
};
const emptyGuest = (): GuestData => ({ lessons: {}, days: {}, mistakes: [] });
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private browsing */ } };

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
  initialize: () => Promise<void>; selectProfile: (id: string) => Promise<void>;
  recordLesson: (lessonKey: string, stars: number, accuracy: number, xp: number, attempts: Attempt[]) => Promise<void>;
  refreshProgress: () => Promise<void>; importGuest: () => Promise<boolean>; clearUser: () => Promise<void>;
};

export const useProgress = create<ProgressState>((set, get) => ({
  guest: readGuest(), authAvailable: false, user: null, profiles: [], activeProfileId: read(PROFILE_KEY), remote: [], streak: 0, todayXp: 0,
  initialize: async () => {
    try {
      const config = await api.config();
      if (!config.auth) { set({ authAvailable: false, user: null }); return; }
      set({ authAvailable: true });
      const me = await api.me();
      const active = me.profiles.some(profile => profile.id === get().activeProfileId) ? get().activeProfileId : me.profiles[0]?.id ?? null;
      set({ user: me.user, profiles: me.profiles, activeProfileId: active });
      if (me.user && active) await get().refreshProgress();
    } catch { set({ authAvailable: false, user: null, profiles: [], activeProfileId: null }); }
  },
  selectProfile: async id => { write(PROFILE_KEY, id); set({ activeProfileId: id }); await get().refreshProgress(); },
  refreshProgress: async () => {
    const id = get().activeProfileId;
    if (!get().user || !id) return;
    try { const data = await api.progress(id); set({ remote: data.lessons, streak: data.streak, todayXp: data.todayXp }); }
    catch {
      set({
        user: null, profiles: [], activeProfileId: null, remote: [],
        streak: guestStreak(get().guest.days), todayXp: get().guest.days[kyivDay()] ?? 0,
      });
    }
  },
  recordLesson: async (lessonKey, stars, accuracy, xp, attempts) => {
    const id = get().activeProfileId;
    if (get().user && id) {
      try { await api.saveLesson({ profileId: id, lessonKey, stars, accuracy, xp, attempts }); await get().refreshProgress(); return; }
      catch { set({ user: null, profiles: [], activeProfileId: null, remote: [] }); }
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
    set({ user: null, profiles: [], activeProfileId: null, remote: [] });
  },
}));

export function isImportAvailable(profileId: string | null, guest: GuestData): boolean {
  return Boolean(profileId && Object.keys(guest.lessons).length && !read(IMPORT_KEY));
}
export function guestStats(guest: GuestData) { return { streak: guestStreak(guest.days), todayXp: guest.days[kyivDay()] ?? 0 }; }
