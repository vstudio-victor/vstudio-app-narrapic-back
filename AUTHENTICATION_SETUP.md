# Authentication Setup Guide

This guide will help you set up the authentication system for NarraPic API.

## Step 1: Run the Database Migration

You need to create the `users` table in your Supabase database.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project at https://supabase.com/dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/create_users_table.sql`
5. Paste it into the SQL editor
6. Click **Run** to execute the migration

### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

## Step 2: Verify the Setup

After running the migration, verify that:

1. The `users` table exists in your database
2. Row Level Security (RLS) is enabled
3. The trigger `on_auth_user_created` is active

You can check this in the Supabase Dashboard:
- **Database** → **Tables** → Look for `users` table
- **Database** → **Triggers** → Look for `on_auth_user_created`

## Step 3: Test the Authentication

### Sign Up a New User

```bash
POST http://localhost:3000/signUp
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "bearer",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "test@example.com",
    ...
  }
}
```

### Login

```bash
POST http://localhost:3000/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "securePassword123"
}
```

### Get Current User Profile

```bash
GET http://localhost:3000/user
Authorization: Bearer <access_token>
```

### Update User Profile

```bash
PATCH http://localhost:3000/user
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "newemail@example.com"
}
```

### Logout

```bash
POST http://localhost:3000/logout
Authorization: Bearer <access_token>
```

### Refresh Token

```bash
POST http://localhost:3000/refresh-token
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## How It Works

### Database Architecture

1. **auth.users** (Supabase managed)
   - Stores authentication credentials
   - Managed by Supabase Auth
   - Handles passwords, sessions, tokens

2. **public.users** (Your application table)
   - Stores user profile data
   - Automatically created via database trigger
   - You have full control over the schema

### Automatic User Creation

When a user signs up via Supabase Auth:
1. Supabase creates a record in `auth.users`
2. The database trigger `on_auth_user_created` fires
3. A corresponding record is automatically created in `public.users`
4. The `id` in both tables is the same (linked via foreign key)

### Row Level Security (RLS)

The `users` table has RLS policies that ensure:
- Users can only view their own data
- Users can only update their own data
- Users can only insert their own data (during signup)

### Automatic Timestamps

The database trigger `set_updated_at` automatically updates the `updated_at` field whenever a user record is modified.

## Frontend Integration

Your Angular frontend should:

1. **Store tokens securely**
   ```typescript
   // After login or signup
   localStorage.setItem('access_token', response.access_token);
   localStorage.setItem('refresh_token', response.refresh_token);
   ```

2. **Add token to API requests**
   ```typescript
   // HTTP Interceptor
   const token = localStorage.getItem('access_token');
   const headers = {
     'Authorization': `Bearer ${token}`
   };
   ```

3. **Handle token refresh**
   ```typescript
   // When access token expires (401 response)
   const refreshToken = localStorage.getItem('refresh_token');
   // Call POST /refresh-token with refresh_token
   // Update stored access_token with new one
   ```

4. **Clear tokens on logout**
   ```typescript
   localStorage.removeItem('access_token');
   localStorage.removeItem('refresh_token');
   ```

## Protecting Other Endpoints

To protect other endpoints in your API, add the `@UseGuards(AuthGuard)` decorator:

```typescript
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Get('captions')
@UseGuards(AuthGuard)
@ApiBearerAuth()
async getCaptions(@CurrentUser() user: any) {
  // user.id is automatically available
  return this.captionsService.getCaptionsByUserId(user.id);
}
```

## Troubleshooting

### Issue: "User not found" when calling GET /user

**Solution:** Make sure you ran the database migration and the trigger is working. Check the `users` table in Supabase to verify the user record was created.

### Issue: RLS policy errors

**Solution:** Verify that you're using the user's JWT token in the Authorization header. The RLS policies use `auth.uid()` which comes from the token.

### Issue: "Invalid token" errors

**Solution:**
- Check that you're sending the token in the format: `Bearer <token>`
- Verify the token hasn't expired (default is 1 hour)
- Use the refresh token endpoint to get a new access token

## Security Notes

- Never store passwords in plain text
- Always use HTTPS in production
- Tokens should be stored securely (HttpOnly cookies preferred over localStorage)
- Implement rate limiting on authentication endpoints
- Use environment variables for Supabase credentials
- Never commit `.env` files to version control
