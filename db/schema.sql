-- ============================================
--    USERS
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'newcomer' CHECK (role IN ('newcomer', 'guest', 'member', 'admin', 'owner', 'expelled')),
  friend_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name TEXT,
  phone_number TEXT,
  provider_id TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id)
);

CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_friend_id_unique ON users(friend_id) WHERE friend_id IS NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_friend_not_self'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_friend_not_self CHECK (friend_id IS NULL OR friend_id <> id);
  END IF;
END $$;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
--    SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;


-- ============================================
--    CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;


-- ============================================
--    TASKS
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  CONSTRAINT check_days_valid CHECK (
    days IS NULL OR 
    (array_length(days, 1) > 0 AND 
     days <@ ARRAY[1,2,3,4,5,6,7])
  )
);

CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_days ON tasks(days);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;


-- ============================================
--    WEEKS
-- ============================================

CREATE TABLE IF NOT EXISTS weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL UNIQUE,
  CONSTRAINT check_week_starts_saturday CHECK (EXTRACT(ISODOW FROM start_date) = 6)
);

CREATE INDEX IF NOT EXISTS idx_weeks_start_date ON weeks(start_date);

ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;


-- ============================================
--    WEEK_TASKS
-- ============================================

CREATE TABLE IF NOT EXISTS week_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  task_name TEXT NOT NULL,
  task_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT unique_week_task UNIQUE(week_id, task_id),
  CONSTRAINT check_days_valid CHECK (
    task_days IS NULL OR 
    (array_length(task_days, 1) > 0 AND 
     task_days <@ ARRAY[1,2,3,4,5,6,7])
  )
);

CREATE INDEX IF NOT EXISTS idx_week_tasks_week_id ON week_tasks(week_id);
CREATE INDEX IF NOT EXISTS idx_week_tasks_task_id ON week_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_week_tasks_sort_order ON week_tasks(week_id, sort_order);

ALTER TABLE week_tasks ENABLE ROW LEVEL SECURITY;


-- ============================================
--    USER_TASKS
-- ============================================

CREATE TABLE IF NOT EXISTS user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  week_task_id UUID REFERENCES week_tasks(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_week_task_id ON user_tasks(week_task_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_completed_at ON user_tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_completed ON user_tasks(user_id, completed_at);

ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;


-- ============================================
--    MEETING_ATTENDANCE
-- ============================================

CREATE TABLE IF NOT EXISTS meeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_date DATE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'appeal')),
  CONSTRAINT meeting_attendance_person_required CHECK (
    user_id IS NOT NULL OR (guest_name IS NOT NULL AND length(trim(guest_name)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_meeting_attendance_date ON meeting_attendance(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_user_id ON meeting_attendance(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_attendance_unique_user_per_day
  ON meeting_attendance(meeting_date, user_id)
  WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_attendance_unique_guest_per_day
  ON meeting_attendance(meeting_date, lower(trim(guest_name)))
  WHERE guest_name IS NOT NULL;

ALTER TABLE meeting_attendance ENABLE ROW LEVEL SECURITY;
