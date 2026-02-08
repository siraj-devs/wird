# Secure Authentication App

## Prerequisites
- Bun installed
- Supabase account
- Discord Developer Application
- Telegram Bot

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your `URL` and `anon public` key
4. Go to SQL Editor and run the `supabase-schema.sql` file

### 2. Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 section
4. Add redirect URL: `http://localhost:3000/api/auth/callback/discord`
5. Copy your Client ID and Client Secret

### 3. Telegram Bot Setup

1. Open Telegram and message [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow instructions
3. Copy the bot token
4. Send `/setdomain` and set your domain

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Generate secure secrets:
```bash
bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Install and Run

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

Visit `http://localhost:3000`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Discord OAuth2](https://discord.com/developers/docs/topics/oauth2)
- [Telegram Login Widget](https://core.telegram.org/widgets/login)
