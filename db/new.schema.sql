-- ============================================
-- AUTH DATABASE SCHEMA
-- Apply this to the dedicated auth Supabase project.
-- ============================================

-- ============================================
--    USERS
-- ============================================
-- Created only after the user submits onboarding (name, phone, email).

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'guest'
    CHECK (role IN ('newcomer', 'guest', 'member', 'admin', 'owner', 'expelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
--    CONNECTIONS
-- ============================================
-- Created at OAuth login. user_id is set after onboarding.

CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar TEXT,
  type TEXT NOT NULL CHECK (type IN ('discord', 'telegram')),
  authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_type ON connections(type);

DROP INDEX IF EXISTS idx_connections_user_type;
CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_user_type
  ON connections(user_id, type)
  WHERE user_id IS NOT NULL;

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;


-- ============================================
--    SESSIONS
-- ============================================
-- Tied to a connection; user_id filled after onboarding.

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id TEXT NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_connection_id ON sessions(connection_id);
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
--    PRIVILEGES (service_role for server SDK)
-- ============================================

GRANT ALL ON TABLE users TO service_role;
GRANT ALL ON TABLE connections TO service_role;
GRANT ALL ON TABLE sessions TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
