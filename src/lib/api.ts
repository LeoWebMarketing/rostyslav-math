export type Profile = { id: string; name: string; avatar: string; grade: number };
export type User = { id: string; name: string; email: string; avatarUrl: string };
export type LessonProgress = { lessonKey: string; bestStars: number; bestAccuracy: number; completions: number };
export type ProgressResponse = { lessons: LessonProgress[]; streak: number; todayXp: number };
export type ApiAttempt = { exerciseId: string; correct: boolean; answer: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...init });
  if (!response.ok) throw new Error(`Запит не вдався (${response.status})`);
  return response.json() as Promise<T>;
}

export const api = {
  config: () => request<{ auth: boolean }>('/config'),
  me: () => request<{ user: User | null; profiles: Profile[] }>('/me'),
  createProfile: (profile: Pick<Profile, 'name' | 'avatar' | 'grade'>) => request<{ profile: Profile }>(
    '/profiles', { method: 'POST', body: JSON.stringify(profile) },
  ),
  updateProfile: (id: string, changes: Partial<Pick<Profile, 'name' | 'avatar' | 'grade'>>) => request<{ profile: Profile }>(
    `/profiles/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(changes) },
  ),
  deleteProfile: (id: string) => request<{ ok: boolean }>(`/profiles/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  saveLesson: (data: {
    profileId: string; lessonKey: string; stars: number; accuracy: number; xp: number; attempts: ApiAttempt[];
  }) => request<{ ok: boolean }>(
    '/progress/lesson', { method: 'POST', body: JSON.stringify(data) },
  ),
  progress: (id: string) => request<ProgressResponse>(`/progress/${encodeURIComponent(id)}`),
  review: (id: string) => request<{ mistakes: { lessonKey: string; exerciseId: string }[] }>(`/review/${encodeURIComponent(id)}`),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
};
