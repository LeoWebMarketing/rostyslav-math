CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE sessions (
  id_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 20),
  avatar TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12),
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE lesson_progress (
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_key TEXT NOT NULL,
  best_stars INTEGER NOT NULL DEFAULT 0,
  best_accuracy REAL NOT NULL DEFAULT 0,
  completions INTEGER NOT NULL DEFAULT 0,
  last_at INTEGER,
  PRIMARY KEY (profile_id, lesson_key)
);
CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_key TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  correct INTEGER NOT NULL,
  answer TEXT,
  at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE daily_stats (
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  lessons INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (profile_id, day)
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_attempts_profile_id_at ON attempts(profile_id, at);
