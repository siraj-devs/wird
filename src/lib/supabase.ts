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
