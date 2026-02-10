import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_SECRET_KEY = process.env.SUPABASE_SERVICE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SERVICE_SECRET_KEY)
  throw new Error(
    "MISSING_ENV_VARS: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SERVICE_SECRET_KEY must be set",
  );

// Client for frontend/public operations (respects RLS)
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Admin client for backend operations (bypasses RLS)
// Only use this in API routes, never expose to the client
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Database types
export interface User {
  id: string;
  email: string | null;
  username: string;
  avatar_url: string | null;
  provider_id: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}
