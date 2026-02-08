# API Documentation

## Authentication Flow

### Discord OAuth Flow

1. User clicks "Continue with Discord" on login page
2. Redirected to `/api/auth/discord`
3. Server generates a state token and redirects to Discord
4. User authorizes the app on Discord
5. Discord redirects to `/api/auth/callback/discord` with code
6. Server exchanges code for access token
7. Server fetches user info from Discord API
8. Server creates/updates user in database
9. Server generates JWT and sets cookie
10. User redirected to dashboard

### Telegram OAuth Flow

1. User clicks "Continue with Telegram" on login page
2. Redirected to `/api/auth/telegram`
3. Server generates auth ID and redirects to Telegram widget page
4. User authorizes with Telegram widget
5. Widget calls `/api/auth/callback/telegram` with auth data
6. Server verifies Telegram auth data cryptographically
7. Server creates/updates user in database
8. Server generates JWT and sets cookie
9. Client redirects to dashboard

## API Routes

### `GET /api/auth/discord`

Initiates Discord OAuth flow.

**Response:**
- Redirects to Discord authorization page

**Cookies Set:**
- `discord_oauth_state` - CSRF protection token (10 min expiry)

---

### `GET /api/auth/callback/discord`

Handles Discord OAuth callback.

**Query Parameters:**
- `code` (string) - Authorization code from Discord
- `state` (string) - CSRF state token

**Response:**
- Success: Redirects to `/dashboard`
- Error: Redirects to `/login?error=...`

**Cookies Set:**
- `auth_token` - JWT session token (7 days expiry)

**Cookies Deleted:**
- `discord_oauth_state`

---

### `GET /api/auth/telegram`

Initiates Telegram OAuth flow.

**Response:**
- Redirects to `/auth/telegram` widget page

**Cookies Set:**
- `telegram_auth_id` - Auth session ID (10 min expiry)

---

### `POST /api/auth/callback/telegram`

Handles Telegram OAuth callback.

**Request Body:**
```json
{
  "id": 123456789,
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "photo_url": "https://...",
  "auth_date": 1234567890,
  "hash": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "redirect": "/dashboard"
}
```

**Error Response:**
```json
{
  "error": "Invalid authentication data"
}
```

**Cookies Set:**
- `auth_token` - JWT session token (7 days expiry)

**Cookies Deleted:**
- `telegram_auth_id`

---

### `POST /api/auth/logout`

Logs out the current user.

**Response:**
```json
{
  "success": true
}
```

**Cookies Deleted:**
- `auth_token`

---

### `GET /api/auth/logout`

Alternative logout endpoint that redirects.

**Response:**
- Redirects to `/login`

**Cookies Deleted:**
- `auth_token`

---

### `GET /api/auth/user`

Gets the current authenticated user.

**Response:**
```json
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "avatar_url": "https://...",
  "provider": "discord",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Error Response:**
```json
{
  "error": "Not authenticated"
}
```

**Authentication Required:** Yes

---

## Authentication

All requests to protected routes require a valid JWT token stored in the `auth_token` cookie.

### JWT Payload Structure

```typescript
interface JWTPayload {
  userId: string;      // UUID from database
  username: string;    // User's display name
  provider: 'discord' | 'telegram';
  iat: number;         // Issued at
  exp: number;         // Expires at
}
```

### Cookie Configuration

```typescript
{
  httpOnly: true,                    // Prevents JavaScript access
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
  sameSite: 'lax',                   // CSRF protection
  maxAge: 60 * 60 * 24 * 7,         // 7 days
  path: '/',
}
```

## Middleware

The app uses Next.js middleware to protect routes.

**Protected Routes:**
- All routes except:
  - `/login`
  - `/auth/telegram`
  - `/api/auth/*`
  - Static files (`/_next/*`, `/favicon.ico`, etc.)

**Behavior:**
- If no token: Redirect to `/login`
- If invalid token: Delete cookie and redirect to `/login`
- If valid token: Allow access

## Database Schema

### users Table

```sql
id UUID PRIMARY KEY
username TEXT NOT NULL
email TEXT
avatar_url TEXT
provider TEXT NOT NULL ('discord' | 'telegram')
provider_id TEXT NOT NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
UNIQUE(provider, provider_id)
```

### sessions Table

```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
token TEXT NOT NULL UNIQUE
expires_at TIMESTAMPTZ
created_at TIMESTAMPTZ
```

## Security Considerations

### CSRF Protection

- **Discord:** State parameter verified in callback
- **Telegram:** Auth data cryptographically verified using bot token

### Token Security

- JWT signed with HS256 algorithm
- Secret key stored in environment variable
- Tokens expire after 7 days
- Stored in HTTP-only cookies (not accessible to JavaScript)

### Session Management

- Sessions stored in database
- Tokens can be revoked by deleting session record
- Expired sessions should be cleaned periodically

### Telegram Auth Verification

The Telegram auth data is verified using this algorithm:

1. Extract the hash from auth data
2. Create data check string from remaining fields (sorted alphabetically)
3. Create secret key: SHA256(bot_token)
4. Calculate HMAC-SHA256(data_check_string, secret_key)
5. Compare calculated hash with provided hash
6. Verify auth_date is recent (< 24 hours)

## Error Codes

### Login Page Query Parameters

- `?error=invalid_request` - Missing code or state
- `?error=invalid_state` - State token mismatch
- `?error=authentication_failed` - OAuth flow failed
- `?error=logout_failed` - Logout process failed

## Rate Limiting

Currently no rate limiting is implemented. Consider adding:
- Rate limits on auth endpoints
- IP-based throttling
- Failed login attempt tracking

## Future Improvements

- [ ] Add refresh tokens
- [ ] Implement session cleanup cron job
- [ ] Add rate limiting
- [ ] Add 2FA support
- [ ] Add email verification
- [ ] Add password reset flow
- [ ] Add account linking (link Discord + Telegram)
- [ ] Add OAuth scope management
- [ ] Add audit logging
- [ ] Add IP whitelisting options
