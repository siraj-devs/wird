# Secure Authentication App

## Prerequisites

- Bun installed
- Supabase account
- Discord Developer Application

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your `URL`, `publishable` key and `secret` key
4. Go to SQL Editor and run the `db/schema.sql` file

### 2. Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 section
4. Add redirect URL: `http://localhost:3000/api/auth/callback/discord`
5. Copy your Client ID and Client Secret

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
