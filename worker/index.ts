import { Google, generateCodeVerifier, generateState } from 'arctic';
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';
import type { D1Database } from './d1';

type Limit = { limit(input: { key: string }): Promise<{ success: boolean }> };
export type Bindings = {
  DB: D1Database; APP_ORIGIN?: string; GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string;
  SESSION_PEPPER?: string; AUTH_LIMIT?: Limit; WRITE_LIMIT?: Limit;
};
type User = { id: string; name: string; email: string; avatar_url: string | null };
type Identity = { sub: string; email: string; name: string; picture?: string };
type Deps = { now?: () => Date; exchangeGoogleCode?: (env: Bindings, code: string, verifier: string, redirectUri: string) => Promise<Identity> };
const DAY = 86_400_000;
const COOKIE = 'klasno_session';
const profileSchema = z.object({ name: z.string().trim().min(1).max(20), avatar: z.string().min(1).max(100), grade: z.number().int().min(1).max(12) }).strict();
const patchSchema = profileSchema.partial().refine(value => Object.keys(value).length > 0);
const lessonSchema = z.object({
  profileId: z.string().uuid(), lessonKey: z.string().min(1).max(200), stars: z.number().int().min(1).max(3),
  accuracy: z.number().min(0).max(1), xp: z.number().int().min(0).max(200),
  attempts: z.array(z.object({ exerciseId: z.string().min(1).max(200), correct: z.boolean(), answer: z.string().max(200) }).strict()).max(100),
}).strict();
function kyivDay(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type: string) => parts.find(part => part.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function previousDay(day: string) { return new Date(Date.parse(`${day}T12:00:00Z`) - DAY).toISOString().slice(0, 10); }
async function hashToken(token: string, pepper: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token + pepper));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
function randomToken() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function setSession(c: Parameters<typeof setCookie>[0], token: string) {
  setCookie(c, COOKIE, token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 30 * 86400 });
}
function clear(c: Parameters<typeof deleteCookie>[0], name: string, path = '/') {
  deleteCookie(c, name, { path, secure: true, sameSite: 'Lax' });
}
async function body<T extends z.ZodTypeAny>(c: { req: { json(): Promise<unknown> } }, schema: T): Promise<z.infer<T> | null> {
  try { const result = schema.safeParse(await c.req.json()); return result.success ? result.data : null; } catch { return null; }
}
function publicProfile(row: { id: string; name: string; avatar: string; grade: number }) {
  return { id: row.id, name: row.name, avatar: row.avatar, grade: row.grade };
}
async function owns(db: D1Database, userId: string, profileId: string) {
  return !!await db.prepare('SELECT id FROM profiles WHERE id = ? AND user_id = ?').bind(profileId, userId).first();
}
function decodeIdentity(token: string, clientId: string): Identity {
  const chunks = token.split('.');
  if (chunks.length !== 3) throw new Error('Invalid ID token');
  const payload = JSON.parse(atob(chunks[1].replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(String(payload.iss)) || payload.aud !== clientId ||
    typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now() || typeof payload.sub !== 'string' ||
    typeof payload.email !== 'string' || payload.email_verified !== true) throw new Error('Invalid ID token claims');
  return { sub: payload.sub, email: payload.email, name: typeof payload.name === 'string' ? payload.name : payload.email,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined };
}
async function exchangeGoogleCode(env: Bindings, code: string, verifier: string, redirectUri: string) {
  const tokens = await new Google(env.GOOGLE_CLIENT_ID!, env.GOOGLE_CLIENT_SECRET!, redirectUri).validateAuthorizationCode(code, verifier);
  return decodeIdentity(tokens.idToken, env.GOOGLE_CLIENT_ID!);
}
export function createApp(deps: Deps = {}) {
  const app = new Hono<{ Bindings: Bindings; Variables: { user: User | null } }>();
  const now = deps.now ?? (() => new Date());
  const exchange = deps.exchangeGoogleCode ?? exchangeGoogleCode;
  app.use('/api/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    c.header('X-Content-Type-Options', 'nosniff');
    if (['POST', 'PATCH', 'DELETE'].includes(c.req.method)) {
      const origin = c.req.header('Origin');
      let valid = false;
      try {
        if (origin) {
          const parsed = new URL(origin);
          const allowed = [new URL(c.req.url).origin, new URL(c.env.APP_ORIGIN ?? 'https://klasno.online').origin, 'https://www.klasno.online'];
          valid = origin === parsed.origin && allowed.includes(parsed.origin);
        }
      } catch { valid = false; }
      if (!valid) return c.text('Forbidden', 403);
    }
    await next();
  });
  app.use('/api/auth/*', async (c, next) => {
    if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET || !c.env.SESSION_PEPPER) return c.text('Auth unavailable', 503);
    if (c.env.AUTH_LIMIT && !(await c.env.AUTH_LIMIT.limit({ key: c.req.header('cf-connecting-ip') ?? 'unknown' })).success) return c.text('Too many requests', 429);
    return next();
  });
  app.use('/api/*', async (c, next) => {
    if (c.req.path.startsWith('/api/auth/') || c.req.path === '/api/config') return next();
    const token = getCookie(c, COOKIE);
    let user: User | null = null;
    if (token && c.env.SESSION_PEPPER) {
      const hash = await hashToken(token, c.env.SESSION_PEPPER);
      const row = await c.env.DB.prepare('SELECT u.id, u.name, u.email, u.avatar_url, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id_hash = ?').bind(hash).first<User & { expires_at: number }>();
      if (row && row.expires_at > now().getTime()) {
        user = { id: row.id, name: row.name, email: row.email, avatar_url: row.avatar_url };
        if (row.expires_at - now().getTime() < 15 * DAY) {
          await c.env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE id_hash = ?').bind(now().getTime() + 30 * DAY, hash).run();
          setSession(c, token);
        }
      }
    }
    c.set('user', user);
    if (c.req.path !== '/api/me' && !user) return c.json({ error: 'Unauthorized' }, 401);
    if (user && ['POST', 'PATCH', 'DELETE'].includes(c.req.method) && c.env.WRITE_LIMIT &&
      !(await c.env.WRITE_LIMIT.limit({ key: user.id })).success) return c.json({ error: 'Too many requests' }, 429);
    return next();
  });
  app.get('/api/config', c => c.json({ auth: !!c.env.GOOGLE_CLIENT_ID }));
  app.get('/api/auth/google', async c => {
    const state = generateState(); const verifier = generateCodeVerifier();
    const redirect = `${new URL(c.req.url).origin}/api/auth/google/callback`;
    const url = await new Google(c.env.GOOGLE_CLIENT_ID!, c.env.GOOGLE_CLIENT_SECRET!, redirect).createAuthorizationURL(state, verifier, { scopes: ['openid', 'email', 'profile'] });
    for (const [name, value] of [['klasno_oauth_state', state], ['klasno_oauth_verifier', verifier]])
      setCookie(c, name, value, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/api/auth/google', maxAge: 600 });
    return c.redirect(url.toString());
  });
  app.get('/api/auth/google/callback', async c => {
    const state = c.req.query('state'); const code = c.req.query('code');
    const saved = getCookie(c, 'klasno_oauth_state'); const verifier = getCookie(c, 'klasno_oauth_verifier');
    clear(c, 'klasno_oauth_state', '/api/auth/google'); clear(c, 'klasno_oauth_verifier', '/api/auth/google');
    if (!state || !code || !saved || !verifier || state !== saved) return c.json({ error: 'Invalid OAuth state' }, 400);
    let identity: Identity;
    try { identity = await exchange(c.env, code, verifier, `${new URL(c.req.url).origin}/api/auth/google/callback`); }
    catch { return c.json({ error: 'OAuth exchange failed' }, 400); }
    await c.env.DB.prepare('INSERT INTO users (id, google_sub, email, name, avatar_url) VALUES (?, ?, ?, ?, ?) ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email, name = excluded.name, avatar_url = excluded.avatar_url')
      .bind(crypto.randomUUID(), identity.sub, identity.email, identity.name, identity.picture ?? null).run();
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE google_sub = ?').bind(identity.sub).first<{ id: string }>();
    if (!user) throw new Error('User upsert failed');
    const token = randomToken();
    await c.env.DB.prepare('INSERT INTO sessions (id_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await hashToken(token, c.env.SESSION_PEPPER!), user.id, now().getTime() + 30 * DAY).run();
    setSession(c, token);
    return c.redirect('/profiles');
  });
  app.post('/api/auth/logout', async c => {
    const token = getCookie(c, COOKIE);
    if (token) await c.env.DB.prepare('DELETE FROM sessions WHERE id_hash = ?').bind(await hashToken(token, c.env.SESSION_PEPPER!)).run();
    clear(c, COOKIE);
    return c.json({ ok: true });
  });
  app.get('/api/me', async c => {
    const user = c.get('user');
    if (!user) return c.json({ user: null, profiles: [] });
    const rows = await c.env.DB.prepare('SELECT id, name, avatar, grade FROM profiles WHERE user_id = ? ORDER BY created_at, id').bind(user.id).all<{ id: string; name: string; avatar: string; grade: number }>();
    return c.json({ user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatar_url ?? '' }, profiles: rows.results.map(publicProfile) });
  });
  app.post('/api/profiles', async c => {
    const input = await body(c, profileSchema);
    if (!input) return c.json({ error: 'Invalid body' }, 400);
    const id = crypto.randomUUID();
    const result = await c.env.DB.prepare('INSERT INTO profiles (id, user_id, name, avatar, grade) SELECT ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM profiles WHERE user_id = ?) < 6')
      .bind(id, c.get('user')!.id, input.name, input.avatar, input.grade, c.get('user')!.id).run();
    if (!result.meta.changes) return c.json({ error: 'Profile limit reached' }, 409);
    return c.json({ profile: publicProfile({ id, ...input }) }, 201);
  });
  app.patch('/api/profiles/:id', async c => {
    const id = c.req.param('id'); const userId = c.get('user')!.id;
    if (!await owns(c.env.DB, userId, id)) return c.json({ error: 'Not found' }, 404);
    const input = await body(c, patchSchema);
    if (!input) return c.json({ error: 'Invalid body' }, 400);
    await c.env.DB.prepare('UPDATE profiles SET name = COALESCE(?, name), avatar = COALESCE(?, avatar), grade = COALESCE(?, grade) WHERE id = ? AND user_id = ?')
      .bind(input.name ?? null, input.avatar ?? null, input.grade ?? null, id, userId).run();
    const row = await c.env.DB.prepare('SELECT id, name, avatar, grade FROM profiles WHERE id = ? AND user_id = ?').bind(id, userId).first<{ id: string; name: string; avatar: string; grade: number }>();
    return c.json({ profile: publicProfile(row!) });
  });
  app.delete('/api/profiles/:id', async c => {
    const result = await c.env.DB.prepare('DELETE FROM profiles WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('user')!.id).run();
    return result.meta.changes ? c.json({ ok: true }) : c.json({ error: 'Not found' }, 404);
  });
  app.post('/api/progress/lesson', async c => {
    const input = await body(c, lessonSchema);
    if (!input) return c.json({ error: 'Invalid body' }, 400);
    if (!await owns(c.env.DB, c.get('user')!.id, input.profileId)) return c.json({ error: 'Not found' }, 404);
    const timestamp = now().getTime();
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO lesson_progress (profile_id, lesson_key, best_stars, best_accuracy, completions, last_at) VALUES (?, ?, ?, ?, 1, ?) ON CONFLICT(profile_id, lesson_key) DO UPDATE SET best_stars = MAX(best_stars, excluded.best_stars), best_accuracy = MAX(best_accuracy, excluded.best_accuracy), completions = completions + 1, last_at = excluded.last_at')
        .bind(input.profileId, input.lessonKey, input.stars, input.accuracy, timestamp),
      ...input.attempts.map(attempt => c.env.DB.prepare('INSERT INTO attempts (id, profile_id, lesson_key, exercise_id, correct, answer, at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), input.profileId, input.lessonKey, attempt.exerciseId, attempt.correct ? 1 : 0, attempt.answer, timestamp)),
      c.env.DB.prepare('INSERT INTO daily_stats (profile_id, day, xp, lessons) VALUES (?, ?, ?, 1) ON CONFLICT(profile_id, day) DO UPDATE SET xp = xp + excluded.xp, lessons = lessons + 1')
        .bind(input.profileId, kyivDay(now()), input.xp),
    ]);
    return c.json({ ok: true });
  });
  app.get('/api/progress/:profileId', async c => {
    const id = c.req.param('profileId');
    if (!await owns(c.env.DB, c.get('user')!.id, id)) return c.json({ error: 'Not found' }, 404);
    const [progress, stats] = await Promise.all([
      c.env.DB.prepare('SELECT lesson_key AS lessonKey, best_stars AS bestStars, best_accuracy AS bestAccuracy, completions FROM lesson_progress WHERE profile_id = ? ORDER BY lesson_key').bind(id).all(),
      c.env.DB.prepare('SELECT day, xp FROM daily_stats WHERE profile_id = ? AND xp > 0 ORDER BY day DESC').bind(id).all<{ day: string; xp: number }>(),
    ]);
    const today = kyivDay(now()); const days = new Set(stats.results.map(row => row.day));
    let cursor = days.has(today) ? today : previousDay(today); let streak = 0;
    while (days.has(cursor)) { streak++; cursor = previousDay(cursor); }
    return c.json({ lessons: progress.results, streak, todayXp: stats.results.find(row => row.day === today)?.xp ?? 0 });
  });
  app.get('/api/review/:profileId', async c => {
    const id = c.req.param('profileId');
    if (!await owns(c.env.DB, c.get('user')!.id, id)) return c.json({ error: 'Not found' }, 404);
    const rows = await c.env.DB.prepare('SELECT lesson_key AS lessonKey, exercise_id AS exerciseId FROM (SELECT lesson_key, exercise_id, correct, at, rowid, ROW_NUMBER() OVER (PARTITION BY lesson_key, exercise_id ORDER BY at DESC, rowid DESC) AS rank FROM attempts WHERE profile_id = ?) WHERE rank = 1 AND correct = 0 ORDER BY at DESC, rowid DESC LIMIT 50').bind(id).all();
    return c.json({ mistakes: rows.results });
  });
  app.onError((_error, c) => c.json({ error: 'Internal server error' }, 500));
  return app;
}
export default createApp();
