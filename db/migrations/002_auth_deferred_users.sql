-- Migrate existing auth DB to deferred user creation.
-- Run once in the auth Supabase SQL editor.

ALTER TABLE connections ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_user_id_fkey;
ALTER TABLE connections
  ADD CONSTRAINT connections_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

DROP INDEX IF EXISTS idx_connections_user_type;
CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_user_type
  ON connections(user_id, type)
  WHERE user_id IS NOT NULL;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS connection_id TEXT REFERENCES connections(id) ON DELETE CASCADE;

-- Backfill sessions.connection_id from the user's primary connection
UPDATE sessions s
SET connection_id = c.id
FROM connections c
WHERE s.connection_id IS NULL
  AND s.user_id IS NOT NULL
  AND c.user_id = s.user_id;

ALTER TABLE sessions ALTER COLUMN user_id DROP NOT NULL;

-- Remove orphan sessions that still have no connection
DELETE FROM sessions WHERE connection_id IS NULL;

ALTER TABLE sessions ALTER COLUMN connection_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_connection_id ON sessions(connection_id);
