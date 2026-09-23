import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp, type Bindings } from './index';
import type { D1Database } from './d1';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

type Params = (string | number | null)[];
function localD1() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(readFileSync('migrations/0001_init.sql', 'utf8'));
  const prepare = (sql: string) => {
    let values: Params = [];
    const statement = sqlite.prepare(sql);
    const object = {
      bind(...args: Params) { values = args; return object; },
      async first<T>() { return (statement.get(...values) ?? null) as T | null; },
      async all<T>() { return { results: statement.all(...values) as T[] }; },
      async run() { const meta = statement.run(...values); return { meta: { changes: Number(meta.changes) } }; },
    };
    return object;
  };
  return {
    sqlite,
    DB: {
      prepare,
      async batch(statements: ReturnType<typeof prepare>[]) {
        sqlite.exec('BEGIN');
        try { const results = []; for (const item of statements) results.push(await item.run()); sqlite.exec('COMMIT'); return results; }
        catch (error) { sqlite.exec('ROLLBACK'); throw error; }
      },
    } as unknown as D1Database,
  };
}
const base = 'https://klasno.online';
const pepper = 'test-pepper';
const userA = '11111111-1111-4111-8111-111111111111';
const userB = '22222222-2222-4222-8222-222222222222';
const profileA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const profileB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
let local: ReturnType<typeof localD1>;
let env: Bindings;
let time: Date;
let app: ReturnType<typeof createApp>;
async function hash(token: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token + pepper));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
async function login(id: string, token: string, expiry = time.getTime() + 30 * 86400_000) {
  local.sqlite.prepare('INSERT INTO sessions (id_hash, user_id, expires_at) VALUES (?, ?, ?)').run(await hash(token), id, expiry);
  return `klasno_session=${token}`;
}
function call(path: string, method = 'GET', payload?: unknown, cookie?: string, origin: string | null = base) {
  const headers: Record<string, string> = {};
  if (payload !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;
  if (origin !== null) headers.Origin = origin;
  return app.fetch(new Request(base + path, { method, headers, body: payload === undefined ? undefined : JSON.stringify(payload) }), env);
}
async function json(response: Response) { return response.json() as Promise<Record<string, any>>; }
beforeEach(() => {
  local = localD1();
  time = new Date('2026-09-23T12:00:00Z');
  env = { DB: local.DB, APP_ORIGIN: base, SESSION_PEPPER: pepper };
  app = createApp({ now: () => time, exchangeGoogleCode: async () => ({ sub: 'google-1', email: 'parent@example.test', name: 'Parent' }) });
  const insertUser = local.sqlite.prepare('INSERT INTO users (id, google_sub, email, name) VALUES (?, ?, ?, ?)');
  insertUser.run(userA, 'a', 'a@example.test', 'A');
  insertUser.run(userB, 'b', 'b@example.test', 'B');
  const insertProfile = local.sqlite.prepare('INSERT INTO profiles (id, user_id, name, avatar, grade) VALUES (?, ?, ?, ?, ?)');
  insertProfile.run(profileA, userA, 'Child A', 'dino', 3);
  insertProfile.run(profileB, userB, 'Child B', 'dino', 3);
});
afterEach(() => local.sqlite.close());
describe('auth and sessions', () => {
  it('returns config auth false or true and 503 when unconfigured', async () => {
    expect(await json(await call('/api/config'))).toEqual({ auth: false });
    expect((await call('/api/auth/google')).status).toBe(503);
    env.GOOGLE_CLIENT_ID = 'id'; env.GOOGLE_CLIENT_SECRET = 'secret';
    expect(await json(await call('/api/config'))).toEqual({ auth: true });
  });
  it('starts OAuth with state, verifier and PKCE; callback uses injected exchange', async () => {
    env.GOOGLE_CLIENT_ID = 'id'; env.GOOGLE_CLIENT_SECRET = 'secret';
    const start = await call('/api/auth/google');
    expect(start.status).toBe(302);
    const redirect = new URL(start.headers.get('Location')!);
    expect(redirect.host).toBe('accounts.google.com');
    expect(redirect.searchParams.get('code_challenge')).toBeTruthy();
    const cookies = start.headers.getSetCookie();
    expect(cookies).toHaveLength(2);
    expect(cookies.every(value => value.includes('HttpOnly') && value.includes('Secure') && value.includes('SameSite=Lax'))).toBe(true);
    const cookie = cookies.map(value => value.split(';')[0]).join('; ');
    const state = redirect.searchParams.get('state');
    const bad = await app.fetch(new Request(base + '/api/auth/google/callback?code=x&state=wrong', { headers: { Cookie: cookie } }), env);
    expect(bad.status).toBe(400);
    const good = await app.fetch(new Request(base + `/api/auth/google/callback?code=x&state=${state}`, { headers: { Cookie: cookie } }), env);
    expect(good.status).toBe(302);
    expect(good.headers.get('Location')).toBe('/profiles');
    const session = good.headers.getSetCookie().find(value => value.startsWith('klasno_session='))!;
    expect(session).toContain('HttpOnly');
    expect(local.sqlite.prepare('SELECT COUNT(*) AS n FROM sessions').get()?.n).toBe(1);
    const me = await json(await call('/api/me', 'GET', undefined, session.split(';')[0]));
    expect(me.user.email).toBe('parent@example.test');
  });
  it('looks up, expires, renews and logs out a session', async () => {
    const cookie = await login(userA, 'token-a', time.getTime() + 10 * 86400_000);
    const me = await call('/api/me', 'GET', undefined, cookie);
    expect((await json(me)).user.id).toBe(userA);
    expect(me.headers.get('Set-Cookie')).toContain('klasno_session=');
    const expiry = local.sqlite.prepare('SELECT expires_at FROM sessions').get()?.expires_at as number;
    expect(expiry).toBe(time.getTime() + 30 * 86400_000);
    const logout = await call('/api/auth/logout', 'POST', undefined, cookie);
    expect(logout.status).toBe(503); // auth endpoints require configured Google
    env.GOOGLE_CLIENT_ID = 'id'; env.GOOGLE_CLIENT_SECRET = 'secret';
    expect((await call('/api/auth/logout', 'POST', undefined, cookie)).status).toBe(200);
    expect((await json(await call('/api/me', 'GET', undefined, cookie))).user).toBeNull();
    const expired = await login(userA, 'expired', time.getTime() - 1);
    expect((await json(await call('/api/me', 'GET', undefined, expired))).user).toBeNull();
  });
});
describe('ownership, validation and progress', () => {
  it('requires session and rejects missing or hostile Origin', async () => {
    expect((await call('/api/progress/' + profileA)).status).toBe(401);
    const cookie = await login(userA, 'token-a');
    expect((await call('/api/profiles', 'POST', { name: 'x', avatar: 'dino', grade: 3 }, cookie, null)).status).toBe(403);
    expect((await call('/api/profiles', 'POST', { name: 'x', avatar: 'dino', grade: 3 }, cookie, 'https://klasno.online.evil.com')).status).toBe(403);
    expect((await call('/api/profiles', 'POST', { name: 'x', avatar: 'dino', grade: 3 }, cookie, 'bad')).status).toBe(403);
  });
  it('hides another user profile across GET, PATCH, DELETE and lesson write', async () => {
    const cookie = await login(userA, 'token-a');
    expect((await call('/api/progress/' + profileB, 'GET', undefined, cookie)).status).toBe(404);
    expect((await call('/api/review/' + profileB, 'GET', undefined, cookie)).status).toBe(404);
    expect((await call('/api/profiles/' + profileB, 'PATCH', { name: 'Bad' }, cookie)).status).toBe(404);
    expect((await call('/api/profiles/' + profileB, 'DELETE', undefined, cookie)).status).toBe(404);
    expect((await call('/api/progress/lesson', 'POST', { profileId: profileB, lessonKey: 'l1', stars: 1, accuracy: 0.5, xp: 10, attempts: [] }, cookie)).status).toBe(404);
  });
  it('validates bodies and rejects a seventh profile', async () => {
    const cookie = await login(userA, 'token-a');
    expect((await call('/api/profiles', 'POST', { name: 'x'.repeat(21), avatar: 'dino', grade: 3 }, cookie)).status).toBe(400);
    expect((await call('/api/profiles/' + profileA, 'PATCH', {}, cookie)).status).toBe(400);
    expect((await call('/api/progress/lesson', 'POST', { profileId: profileA, lessonKey: 'l1', stars: 4, accuracy: 1, xp: 10, attempts: [] }, cookie)).status).toBe(400);
    for (let n = 1; n <= 5; n++) expect((await call('/api/profiles', 'POST', { name: String(n), avatar: 'dino', grade: 3 }, cookie)).status).toBe(201);
    expect((await call('/api/profiles', 'POST', { name: '7', avatar: 'dino', grade: 3 }, cookie)).status).toBe(409);
  });
  it('updates and deletes an owned profile with cascading data removal', async () => {
    const cookie = await login(userA, 'token-a');
    const changed = await call('/api/profiles/' + profileA, 'PATCH', { name: 'Renamed', grade: 4 }, cookie);
    expect(changed.status).toBe(200);
    expect((await json(changed)).profile).toEqual({ id: profileA, name: 'Renamed', avatar: 'dino', grade: 4 });
    local.sqlite.prepare('INSERT INTO daily_stats (profile_id, day, xp, lessons) VALUES (?, ?, 10, 1)').run(profileA, '2026-09-23');
    expect((await call('/api/profiles/' + profileA, 'DELETE', undefined, cookie)).status).toBe(200);
    expect(local.sqlite.prepare('SELECT COUNT(*) AS n FROM daily_stats WHERE profile_id = ?').get(profileA)?.n).toBe(0);
    expect((await call('/api/profiles/' + profileA, 'DELETE', undefined, cookie)).status).toBe(404);
  });
  it('retains best values and excludes later-corrected mistakes', async () => {
    const cookie = await login(userA, 'token-a');
    const post = (stars: number, correct: boolean) => call('/api/progress/lesson', 'POST', {
      profileId: profileA, lessonKey: 'math/l1', stars, accuracy: stars / 3, xp: 10,
      attempts: [{ exerciseId: 'e1', correct, answer: '42' }],
    }, cookie);
    expect((await post(3, false)).status).toBe(200);
    expect((await json(await call('/api/review/' + profileA, 'GET', undefined, cookie))).mistakes).toEqual([{ lessonKey: 'math/l1', exerciseId: 'e1' }]);
    expect((await post(1, true)).status).toBe(200);
    const progress = await json(await call('/api/progress/' + profileA, 'GET', undefined, cookie));
    expect(progress.lessons).toEqual([{ lessonKey: 'math/l1', bestStars: 3, bestAccuracy: 1, completions: 2, lastAt: time.getTime() }]);
    expect(progress.todayXp).toBe(20);
    expect((await json(await call('/api/review/' + profileA, 'GET', undefined, cookie))).mistakes).toEqual([]);
  });
  it('counts Kyiv days, including yesterday when today has no XP', async () => {
    const cookie = await login(userA, 'token-a');
    const insert = local.sqlite.prepare('INSERT INTO daily_stats (profile_id, day, xp, lessons) VALUES (?, ?, ?, 1)');
    insert.run(profileA, '2026-09-21', 10);
    insert.run(profileA, '2026-09-22', 10);
    time = new Date('2026-09-22T22:30:00Z'); // 01:30 on 23 September in Kyiv
    expect((await json(await call('/api/progress/' + profileA, 'GET', undefined, cookie))).streak).toBe(2);
    insert.run(profileA, '2026-09-23', 10);
    expect((await json(await call('/api/progress/' + profileA, 'GET', undefined, cookie))).streak).toBe(3);
  });
  it('uses auth and write rate-limit bindings when present', async () => {
    env.GOOGLE_CLIENT_ID = 'id'; env.GOOGLE_CLIENT_SECRET = 'secret';
    env.AUTH_LIMIT = { limit: async () => ({ success: false }) };
    expect((await call('/api/auth/google')).status).toBe(429);
    const cookie = await login(userA, 'token-a');
    env.WRITE_LIMIT = { limit: async () => ({ success: false }) };
    expect((await call('/api/profiles', 'POST', { name: 'x', avatar: 'dino', grade: 3 }, cookie)).status).toBe(429);
  });
  it('sets defensive headers without CORS', async () => {
    const response = await call('/api/progress/' + profileA);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
