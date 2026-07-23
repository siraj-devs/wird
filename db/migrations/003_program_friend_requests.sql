-- Friend requests: members send requests; receiver accepts.
-- Run on the NEW Supabase project (programs + users DB).

ALTER TABLE program_friends
  ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE program_friends
  ADD COLUMN IF NOT EXISTS status TEXT;

ALTER TABLE program_friends
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Backfill existing friendships as accepted (requester = user_a as fallback)
UPDATE program_friends
SET
  status = COALESCE(status, 'accepted'),
  requester_id = COALESCE(requester_id, user_a_id),
  responded_at = COALESCE(responded_at, created_at)
WHERE status IS NULL OR requester_id IS NULL;

ALTER TABLE program_friends
  ALTER COLUMN requester_id SET NOT NULL;

ALTER TABLE program_friends
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE program_friends
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE program_friends
  DROP CONSTRAINT IF EXISTS check_program_friend_status;

ALTER TABLE program_friends
  ADD CONSTRAINT check_program_friend_status
  CHECK (status IN ('pending', 'accepted'));

ALTER TABLE program_friends
  DROP CONSTRAINT IF EXISTS check_program_friend_requester;

ALTER TABLE program_friends
  ADD CONSTRAINT check_program_friend_requester
  CHECK (requester_id = user_a_id OR requester_id = user_b_id);

CREATE INDEX IF NOT EXISTS idx_program_friends_status
  ON program_friends(program_id, status);

CREATE INDEX IF NOT EXISTS idx_program_friends_requester
  ON program_friends(program_id, requester_id);
