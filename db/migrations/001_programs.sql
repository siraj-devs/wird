-- Run this migration in Supabase SQL Editor if schema.sql was already applied.

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_name ON programs(name);
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS program_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_program_member UNIQUE(program_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_program_members_program_id ON program_members(program_id);
CREATE INDEX IF NOT EXISTS idx_program_members_user_id ON program_members(user_id);
ALTER TABLE program_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS program_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number > 0),
  CONSTRAINT unique_program_week UNIQUE(program_id, week_id),
  CONSTRAINT unique_program_week_number UNIQUE(program_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_program_weeks_program_id ON program_weeks(program_id);
CREATE INDEX IF NOT EXISTS idx_program_weeks_week_id ON program_weeks(week_id);
ALTER TABLE program_weeks ENABLE ROW LEVEL SECURITY;

ALTER TABLE week_tasks
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_week_tasks_program_id ON week_tasks(program_id);

ALTER TABLE week_tasks DROP CONSTRAINT IF EXISTS unique_week_task;

CREATE UNIQUE INDEX IF NOT EXISTS unique_week_task_global
  ON week_tasks(week_id, task_id)
  WHERE program_id IS NULL AND task_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_week_task_program
  ON week_tasks(week_id, task_id, program_id)
  WHERE program_id IS NOT NULL AND task_id IS NOT NULL;
