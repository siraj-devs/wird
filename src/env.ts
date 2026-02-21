import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const env = createEnv({
  server: {
    APP_URL: z.url(),

    SUPABASE_SERVICE_SECRET_KEY: z.string().min(1),

    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_CLIENT_SECRET: z.string().min(1),
    DISCORD_REDIRECT_URI: z.url(),
    DISCORD_GUILD_ID: z.string().min(1),
    DISCORD_BOT_TOKEN: z.string().min(1),

    JWT_SECRET: z.string().min(1),

    NODE_ENV: z.enum(["development", "test", "production"]),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
});

export default env;
