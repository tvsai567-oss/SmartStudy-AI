-- ════════════════════════════════════════════════════════
--  SmartStudy AI — Supabase Schema Migration (Additive)
--  Migration: 001_initial_schema.sql
--  Safe to run multiple times (IF NOT EXISTS)
-- ════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ════════════════════════════════
-- TABLE: profiles
-- ════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name    TEXT,
  email        TEXT,
  class_level  INTEGER DEFAULT 8 CHECK (class_level BETWEEN 1 AND 12),
  school_name  TEXT,
  avatar_url   TEXT,
  preferences  JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════
-- TABLE: chats
-- ════════════════════════════════
CREATE TABLE IF NOT EXISTS chats (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL DEFAULT 'New Chat',
  subject      TEXT,
  is_pinned    BOOLEAN DEFAULT FALSE,
  is_archived  BOOLEAN DEFAULT FALSE,
  message_count INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════
-- TABLE: messages
-- ════════════════════════════════
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id          UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT NOT NULL,
  attachment_url   TEXT,
  attachment_type  TEXT,
  is_liked         BOOLEAN DEFAULT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════
-- TABLE: subjects (seed data)
-- ════════════════════════════════
CREATE TABLE IF NOT EXISTS subjects (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL UNIQUE,
  icon         TEXT NOT NULL,
  description  TEXT,
  color        TEXT DEFAULT '#6366f1',
  sort_order   INTEGER DEFAULT 0
);

-- Insert default subjects (safe - ON CONFLICT DO NOTHING)
INSERT INTO subjects (name, icon, description, color, sort_order) VALUES
  ('Mathematics',      '🧮', 'Numbers, algebra, geometry, and more',   '#6366f1', 1),
  ('Science',          '🔬', 'Physics, chemistry, biology, and nature', '#06b6d4', 2),
  ('English',          '📖', 'Grammar, literature, and writing',        '#8b5cf6', 3),
  ('Social Studies',   '🌎', 'History, geography, and civics',          '#10b981', 4),
  ('Computer Science', '💻', 'Coding, algorithms, and technology',      '#f59e0b', 5),
  ('General Knowledge','🌟', 'Interesting facts about the world',       '#ef4444', 6)
ON CONFLICT (name) DO NOTHING;

-- ════════════════════════════════
-- TABLE: learning_progress
-- ════════════════════════════════
CREATE TABLE IF NOT EXISTS learning_progress (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject             TEXT NOT NULL,
  questions_answered  INTEGER DEFAULT 0,
  correct_answers     INTEGER DEFAULT 0,
  topics_completed    INTEGER DEFAULT 0,
  last_activity       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, subject)
);

-- ════════════════════════════════
-- TABLE: quiz_results
-- ════════════════════════════════
CREATE TABLE IF NOT EXISTS quiz_results (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject         TEXT NOT NULL,
  topic           TEXT,
  score           INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  difficulty      TEXT DEFAULT 'medium',
  time_taken_sec  INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════
-- TABLE: attachments
-- ════════════════════════════════
CREATE TABLE IF NOT EXISTS attachments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chat_id     UUID REFERENCES chats(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_url    TEXT,
  file_type   TEXT NOT NULL,
  file_size   INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════
-- UPDATED_AT triggers
-- ════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS chats_updated_at ON chats;
CREATE TRIGGER chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats             ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results      ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments       ENABLE ROW LEVEL SECURITY;

-- Subjects are public (read-only)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_public_read" ON subjects FOR SELECT USING (true);

-- Profiles: users can only see/edit their own
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- Chats: users can only see/edit their own
CREATE POLICY "chats_own" ON chats
  FOR ALL USING (auth.uid() = user_id);

-- Messages: users can only see messages from their own chats
CREATE POLICY "messages_own" ON messages
  FOR ALL USING (auth.uid() = user_id);

-- Learning progress: own only
CREATE POLICY "progress_own" ON learning_progress
  FOR ALL USING (auth.uid() = user_id);

-- Quiz results: own only
CREATE POLICY "quiz_results_own" ON quiz_results
  FOR ALL USING (auth.uid() = user_id);

-- Attachments: own only
CREATE POLICY "attachments_own" ON attachments
  FOR ALL USING (auth.uid() = user_id);

-- ════════════════════════════════
-- Auto-create profile on signup
-- ════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ════════════════════════════════
-- Storage Buckets
-- ════════════════════════════════
-- Run these in the Supabase dashboard Storage section:
-- CREATE BUCKET: avatars (public)
-- CREATE BUCKET: homework (private)
-- CREATE BUCKET: documents (private)
