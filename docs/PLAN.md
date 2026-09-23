# Klasno platform - base build plan (2026-09-23)

Owner decision (Roman, 2026-09-23): turn the Squid Game math app into **Klasno** (klasno.online),
a Duolingo-style learning platform. Structure **Клас > Предмет > Розділ > Урок**. Old app kept
unchanged as **2 клас > Математика**. New content starts at **3 клас** in a cartoon-dinosaur theme.
Roman then feeds current school topics (screenshots/photos); new sections and exercises are added as data.

## 1. Stack
| Layer | Choice | Why |
|---|---|---|
| Hosting | **Cloudflare Workers with static assets** (one Worker `klasno`) | API + SPA in one deploy, D1 binding, custom domain. Replaces the Pages project; Pages project `rostyslav-math` kept untouched as rollback. |
| Frontend | React 18 + Vite 6 + TypeScript + Tailwind 3 (existing), **React Router 6** | Reuse the existing toolchain; URLs per grade/subject/lesson so back button and deep links work. |
| API | **Hono** on the Worker, routes under `/api/*` | Small, typed, Workers-native. |
| DB | **Cloudflare D1** `klasno-db`, SQL migrations in `migrations/` via `wrangler d1 migrations` | Roman asked for D1. Raw SQL, no ORM - schema is small. |
| Auth | **Google OAuth 2.0** (authorization code + PKCE, `arctic` lib), own session table in D1, HttpOnly Secure SameSite=Lax cookie | Parent logs in; kids get profiles. |
| Validation | **zod** for content schema and API bodies | Content errors fail the build, not the child. |
| Tests | **vitest** (engine, answer checking, content schema, API with D1 local) + Playwright screenshots on the public URL | |

## 2. Repository layout (target)
```
legacy/                 original Squid app, moved as-is (own index.html, own CSS, own store)
  index.html            Vite multi-page entry, served at /g2/
src/                    new app (Klasno)
  app/                  router, layout, providers
  features/catalog/     grade picker, subject picker, section map
  features/lesson/      lesson engine + exercise components
  features/auth/        login, profile picker, profile create
  features/progress/    XP, stars, streak, mistakes review
  lib/                  api client, storage (guest), speech (TTS)
content/                lesson data, one file per section
  grade-3/math/*.ts
  grade-3/ukrainian/*.ts
  grade-3/english/*.ts
  schema.ts             zod schema for every exercise type
worker/                 Hono app: auth, profiles, progress
migrations/             D1 SQL
public/theme/dino/      Codex-generated art
wrangler.jsonc
```
Legacy isolation: the old app becomes a second Vite entry (`legacy/index.html` > `/g2/`) with its
own CSS and zustand store, so its global Squid styles never leak into Klasno and it stays byte-for-byte
the same behaviour. Secret params (`/g2/?game=zuma`) keep working. The old root URL params
(`/?game=...`) redirect to `/g2/?game=...`.

## 3. Navigation
```
/                       Grade picker: "2 клас" (legacy card, Squid look preview) | "3 клас" (dino)
/g2/                    legacy app, unchanged
/g/3                    subject picker: Математика, Українська мова, Англійська мова
/g/3/:subject           section map (Duolingo-style path of lesson nodes, locked/unlocked/stars)
/g/3/:subject/:section/:lesson   lesson player
/review                 "Робота над помилками" - replays wrong answers
/profiles               profile picker (after parent login)
/parent                 parent area: add/rename child, see progress
```
Grade picker lists grades from data, so 4 клас later is one config line.

## 4. Lesson engine (Duolingo mechanics)
Session = 8-12 exercises from a lesson. Top progress bar, Check button, bottom feedback sheet,
Continue. Wrong exercises are re-queued at the end of the same lesson until answered correctly
(no hearts, no game over - kids 8-9). End screen: XP earned, accuracy, 1-3 stars, mascot.

Exercise types v1 (all in `content/schema.ts`):
| type | UI | checking |
|---|---|---|
| `choice` | prompt (+ optional image/audio) and 2-4 option cards (text or image) | exact option id |
| `match` | 4-5 pairs, two columns, tap left then right; matched pairs fade out | all pairs |
| `type` | prompt, text input, optional on-screen letter hints | normalized: trim, collapse spaces, case-insensitive, apostrophe variants (’ ' ʼ) unified, `accept: string[]` alternatives; optional `typoTolerance` 1 for long words |
| `order` | word bank chips > build the sentence (Duolingo "tap the words") | token sequence, `accept` alternatives |
| `fill` | sentence with a gap, choose or type the missing word | as choice/type |
| `math` | legacy-style arithmetic with numeric keypad | numeric equality |

English: every English string can be spoken via Web Speech API (`speechSynthesis`, `en-GB`/`en-US`
voice) with a speaker button; audio is optional, never required to answer (device may have no voice).

Content item shape (sketch):
```ts
{ id: 'g3-en-animals-01', grade: 3, subject: 'english', section: 'animals', title: 'Тварини',
  lessons: [{ id: 'l1', title: 'Хто це?', exercises: [
    { type: 'choice', prompt: 'Як англійською «кіт»?', options: ['cat','dog','fox'], answer: 'cat', speak: true },
    { type: 'match', pairs: [['cat','кіт'],['dog','собака'],['fox','лисиця'],['cow','корова']] },
    { type: 'type', prompt: 'Напиши англійською: собака', answer: 'dog' },
    { type: 'order', prompt: 'Переклади: Це мій кіт.', tokens: ['This','is','my','cat','dog','a'], answer: ['This','is','my','cat'] } ] }] }
```
Exercises inside a lesson are shuffled; options shuffled per render.

## 5. Data model (D1)
```
users(id, google_sub UNIQUE, email, name, avatar_url, created_at)
sessions(id_hash PK, user_id, expires_at, created_at)          -- token sha-256, 30-day sliding
profiles(id, user_id, name, avatar, grade, created_at)          -- child profiles, max 6 per user
lesson_progress(profile_id, lesson_key, best_stars, best_accuracy, completions, last_at, PK(profile_id, lesson_key))
attempts(id, profile_id, lesson_key, exercise_id, correct, answer, at)   -- feeds mistakes review
daily_stats(profile_id, day, xp, lessons, PK(profile_id, day))           -- streak + today counter
```
Child privacy: children have only a first name/nickname and an avatar choice. No child email, no
photos, no free-text sharing. Parent email is the only personal data; no third-party analytics.

Guest mode: without login the app works fully, progress kept in localStorage under a local profile.
On first login the guest progress is offered for import into a chosen child profile.

## 6. API
```
GET  /api/auth/google            -> redirect to Google (state + PKCE cookies)
GET  /api/auth/google/callback   -> upsert user, create session, redirect /profiles
POST /api/auth/logout
GET  /api/me                     -> user + profiles
POST /api/profiles               {name, avatar, grade}
PATCH/DELETE /api/profiles/:id
POST /api/progress/lesson        {profileId, lessonKey, stars, accuracy, xp, attempts[]}
GET  /api/progress/:profileId    -> lesson_progress + streak + today
GET  /api/review/:profileId      -> recent wrong exercise ids
```
Every profile route checks `profile.user_id = session.user_id`. Rate limit auth + write routes.
Google secrets (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) are Worker secrets. **If absent, the login
button is hidden and the app runs in guest mode** - the base ships without waiting for them.

## 7. Theme and assets
Per `DESIGN.md`. All art generated by Codex from `docs/asset-prompts.md`: logo (mascot + wordmark
"Класно"), favicon/PWA icons, mascot poses (5), subject icons (3), grade cards (2 клас uses a Squid-style
card, 3 клас dino), jungle background (layered, tall mobile + wide desktop), lesson-complete scene,
section-node icons. The orchestrator reviews every image before it ships.

## 8. Initial content
Real topics come from Roman's screenshots. The base ships with one starter section per subject so the
flow is testable end to end, marked `draft: true`, replaced when real topics arrive:
- Математика 3 клас: таблиця множення на 2-5 (choice, type, match).
- Українська мова: голосні/приголосні, наголос (choice, match, fill).
- Англійська: Animals / Colours (choice, match, type, order, speech).

## 9. Later phases (not in the base)
- Dino runner mini-game: kid runs, dinosaur chases, tap to jump obstacles; correct answers push the
  dino back, mistakes let it close in. Unlocked after a lesson as a reward.
- Parent dashboard charts, weekly summary.
- Offline PWA caching of content.

## 10. Delivery, testing, rollback
1. Branch `klasno-base`; tag `pre-klasno` on current master.
2. Build + vitest green; `tsc --noEmit` clean.
3. Deploy Worker `klasno` to `klasno.workers.dev` first; smoke test.
4. Move custom domains `klasno.online` + `www` from Pages project to the Worker.
5. Playwright screenshots at 375/768/1024/1440 of: grade picker, subject picker, section map, each
   exercise type (correct + wrong state), lesson end, legacy /g2/ start screen. Vision review.
6. Rollback: re-attach domains to Pages project `rostyslav-math` (still serving e74aedf).
Done = all of the above with evidence; D1 migrations applied; CLAUDE.md updated.

## 11. Review fixes (astra, 2026-09-23, verdict "revise" - accepted with corrections)
- **Service worker**: existing users have `/sw.js` (cache `squid-math-v1`, scope `/`) caching the old
  index. Ship a new `/sw.js` that is a kill-switch: on install `skipWaiting`, on activate delete ALL
  caches, `clients.claim()`, then `registration.unregister()` and reload controlled clients. The new
  app does not register any service worker in the base release; legacy `/g2/` does not register one either.
- **Routing (wrangler.jsonc)**: `assets.directory = dist`, `assets.not_found_handling = "single-page-application"`,
  `assets.run_worker_first = ["/api/*"]`, `main = worker/index.ts`. `/g2/` resolves to `dist/g2/index.html`
  (legacy entry built to `g2/`). No zone `routes` - custom domains attached separately.
  (Reviewer's zone-route snippet rejected: not how Workers static assets route.)
- **Rate limiting**: Workers Rate Limiting binding (`ratelimits` in wrangler config) on `/api/auth/*`
  and write routes. (Reviewer's in-memory counter rejected: isolates do not share memory.)
- **Normalization**: also strip trailing `.,!?;:…`, unify quotes and dashes, NFC normalize. Do NOT fold
  ґ/г or і/i - spelling is what is being taught.
- **Indexes**: `sessions(user_id)`, `profiles(user_id)`, `attempts(profile_id, at)`.
- **Content validation**: `content/index.ts` loads every section through the zod schema in a vitest test
  and at build (fail the build on invalid content); ids unique across all content.

## 12. Roadmap after the base (Roman, 2026-09-23)
Release 2 - classes and competition:
- Many users; a whole school class can join: teacher creates a class, gets a join code/link; parents
  attach their child profile to the class with the code.
- Class tests: a timed math test all pupils of a class take; class leaderboard (score, time, attempts).
  Privacy: leaderboard visible only inside that class, shows nickname + avatar only, teacher can hide it.
Release 3 - roles and teacher content:
- Roles: parent, child, teacher (a user can be parent and teacher). Teacher sees class progress.
- Teacher adds material: uploads a screenshot/photo, pastes text, or describes the tasks in words;
  AI turns it into a section/test in the content schema; teacher reviews and edits before publishing.
  Needs: per-class content stored in D1 (not only repo files), R2 for uploads, an AI generation step
  with schema validation + the same pedagogy lint as repo content, moderation, cost limits.
Base-release implications (keep forward-compatible, no extra work now): content ids stay globally
unique; progress keyed by lesson_key so DB-stored sections can reuse it; users table can gain a
role column and classes/class_members tables by additive migration.

## 13. 3D mascot Дино (Roman, 2026-09-23) - next step right after the base deploy
Дино becomes an interactive 3D character (Three.js) that lives on the site: runs along the screen,
reacts to the child (idle/look-at-pointer, jump + cheer on a correct answer, gentle "oops" on a wrong
one, dance at lesson end, sleeps after inactivity, tap to make him wave/giggle).
- Stack: `three` + `@react-three/fiber` + `@react-three/drei`, loaded lazily (dynamic import) only on
  capable devices; the 2D PNG Дино stays as the fallback (low-end tablets, `prefers-reduced-motion`,
  WebGL unavailable, battery saver). Budget: 3D chunk <= 250 KB gzip, model <= 1.5 MB (Draco/meshopt),
  60 fps target on a mid tablet, render loop paused when off-screen or tab hidden.
- Model: a rigged, animated glTF (idle, walk/run, jump, cheer, sad, sleep, wave). Source options, in
  order: CC0 animated low-poly dinosaur (e.g. Quaternius) re-coloured to Дино's palette with the hat and
  pencil attached as separate meshes; or a procedurally built stylised Дино from primitives if no CC0
  model fits. License must be CC0/CC-BY and recorded in `public/theme/dino/3d/LICENSE.md`.
- Events: the lesson engine emits `correct | wrong | lessonEnd | idle` to a small mascot bus; the 2D and
  3D mascots both subscribe, so the engine never depends on 3D.
