-- ============================================
-- PROGRAMS (v2) — NEW DB
-- Apply on the new Supabase project (with users).
-- ============================================

-- ============================================
--    PROGRAMS
-- ============================================

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_name ON programs(name);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;


-- ============================================
--    PROGRAM_CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS program_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_program_category_name UNIQUE (program_id, name)
);

CREATE INDEX IF NOT EXISTS idx_program_categories_program_id
  ON program_categories(program_id);

CREATE INDEX IF NOT EXISTS idx_program_categories_sort
  ON program_categories(program_id, sort_order);

ALTER TABLE program_categories ENABLE ROW LEVEL SECURITY;


-- ============================================
--    PROGRAM_TASKS
-- ============================================
-- schedule_type:
--   recurring → days[] (1=Sat … 7=Fri, app week)
--   dated     → start_date + end_date inclusive

CREATE TABLE IF NOT EXISTS program_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  category_id UUID REFERENCES program_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('recurring', 'dated')),
  -- recurring: days[] where 1=Sat … 7=Fri (app week)
  days INTEGER[],
  start_date DATE,
  end_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_program_task_name UNIQUE (program_id, name),
  CONSTRAINT check_program_task_days_valid CHECK (
    days IS NULL OR (
      array_length(days, 1) > 0
      AND days <@ ARRAY[1, 2, 3, 4, 5, 6, 7]
    )
  ),
  CONSTRAINT check_program_task_schedule CHECK (
    (
      schedule_type = 'recurring'
      AND days IS NOT NULL
      AND start_date IS NULL
      AND end_date IS NULL
    )
    OR
    (
      schedule_type = 'dated'
      AND days IS NULL
      AND start_date IS NOT NULL
      AND end_date IS NOT NULL
      AND end_date >= start_date
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_program_tasks_program_id
  ON program_tasks(program_id);

CREATE INDEX IF NOT EXISTS idx_program_tasks_category_id
  ON program_tasks(category_id);

CREATE INDEX IF NOT EXISTS idx_program_tasks_schedule_type
  ON program_tasks(program_id, schedule_type);

CREATE INDEX IF NOT EXISTS idx_program_tasks_sort
  ON program_tasks(program_id, sort_order);

ALTER TABLE program_tasks ENABLE ROW LEVEL SECURITY;


-- ============================================
--    PROGRAM_MEMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS program_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_program_member UNIQUE (program_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_program_members_program_id
  ON program_members(program_id);

CREATE INDEX IF NOT EXISTS idx_program_members_user_id
  ON program_members(user_id);

ALTER TABLE program_members ENABLE ROW LEVEL SECURITY;


-- ============================================
--    PROGRAM_FRIENDS
-- ============================================
-- Ordered pair (user_a_id < user_b_id).
-- Members send requests (status=pending); receiver accepts → accepted.
-- Only accepted pairs can see each other's progress.

CREATE TABLE IF NOT EXISTS program_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT check_program_friend_not_self CHECK (user_a_id <> user_b_id),
  CONSTRAINT check_program_friend_ordered CHECK (user_a_id < user_b_id),
  CONSTRAINT check_program_friend_requester CHECK (
    requester_id = user_a_id OR requester_id = user_b_id
  ),
  CONSTRAINT unique_program_friendship UNIQUE (program_id, user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_program_friends_program_id
  ON program_friends(program_id);

CREATE INDEX IF NOT EXISTS idx_program_friends_user_a
  ON program_friends(program_id, user_a_id);

CREATE INDEX IF NOT EXISTS idx_program_friends_user_b
  ON program_friends(program_id, user_b_id);

CREATE INDEX IF NOT EXISTS idx_program_friends_status
  ON program_friends(program_id, status);

CREATE INDEX IF NOT EXISTS idx_program_friends_requester
  ON program_friends(program_id, requester_id);

ALTER TABLE program_friends ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION enforce_program_friend_membership()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM program_members
    WHERE program_id = NEW.program_id AND user_id = NEW.user_a_id
  ) THEN
    RAISE EXCEPTION 'user_a_id is not a member of this program';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM program_members
    WHERE program_id = NEW.program_id AND user_id = NEW.user_b_id
  ) THEN
    RAISE EXCEPTION 'user_b_id is not a member of this program';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_program_friend_membership ON program_friends;
CREATE TRIGGER trg_program_friend_membership
  BEFORE INSERT OR UPDATE ON program_friends
  FOR EACH ROW
  EXECUTE FUNCTION enforce_program_friend_membership();


-- ============================================
--    PROGRAM_TASK_COMPLETIONS
-- ============================================
-- Daily check-offs for program tasks (progress).

CREATE TABLE IF NOT EXISTS program_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_task_id UUID NOT NULL REFERENCES program_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_on DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_program_task_completion
    UNIQUE (program_task_id, user_id, completed_on)
);

CREATE INDEX IF NOT EXISTS idx_program_task_completions_task
  ON program_task_completions(program_task_id);

CREATE INDEX IF NOT EXISTS idx_program_task_completions_user_day
  ON program_task_completions(user_id, completed_on);

ALTER TABLE program_task_completions ENABLE ROW LEVEL SECURITY;


-- ============================================
--    PRIVILEGES
-- ============================================

GRANT ALL ON TABLE programs TO service_role;
GRANT ALL ON TABLE program_categories TO service_role;
GRANT ALL ON TABLE program_tasks TO service_role;
GRANT ALL ON TABLE program_members TO service_role;
GRANT ALL ON TABLE program_friends TO service_role;
GRANT ALL ON TABLE program_task_completions TO service_role;
