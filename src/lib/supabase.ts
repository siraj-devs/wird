import env from "@/env";
import { createClient } from "@supabase/supabase-js";

// Client for frontend/public operations (respects RLS)
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

// Admin client for backend operations (bypasses RLS)
// Only use this in API routes, never expose to the client
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Auth database — users, connections, sessions (db/new.schema.sql)
export const supabaseAuth = createClient(
  env.AUTH_SUPABASE_URL,
  env.AUTH_SUPABASE_SERVICE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
