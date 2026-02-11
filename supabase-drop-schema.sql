-- Drop all tables, triggers, functions, and policies
-- WARNING: This will permanently delete all data!

-- Drop tables in order (considering foreign key constraints)
-- CASCADE will automatically drop all dependent objects (policies, triggers, indexes, etc.)
DROP TABLE IF EXISTS user_tasks CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS access_requests CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
