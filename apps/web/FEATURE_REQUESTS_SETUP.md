# Feature Requests Setup Guide

This guide walks through setting up the GitHub OAuth feature request system for goBlink.

## 1. Install Dependencies

```bash
cd apps/web
pnpm add @supabase/ssr
```

## 2. Set Up GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in the form:
   ```
   Application name: goBlink Feature Requests
   Homepage URL: https://yourdomain.com (or http://localhost:3000 for dev)
   Authorization callback URL: https://yourdomain.com/api/auth/github/callback
   ```
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it

## 3. Add Environment Variables

Add these to `.env.local` (for local development):

```bash
# GitHub OAuth
GITHUB_OAUTH_CLIENT_ID=your_client_id_here
GITHUB_OAUTH_CLIENT_SECRET=your_client_secret_here

# GitHub Token (for creating issues - already configured)
GITHUB_TOKEN=your_github_pat

# Optional: specify a different repo (defaults to Urban-Blazer/goblink)
FEATURE_REQUEST_REPO=Urban-Blazer/goblink
```

For production (Vercel), add these same variables in the Vercel dashboard.

## 4. Run Database Migrations

The migrations are in `supabase/migrations/`:
- `feature_requests.sql` - Creates tables and RLS policies
- `feature_requests_functions.sql` - Creates vote increment/decrement functions

Run them:

```bash
# If using Supabase CLI
npx supabase db push

# Or copy the SQL and run in Supabase dashboard → SQL Editor
```

## 5. Test Locally

```bash
pnpm dev
```

Visit `http://localhost:3000/features` and test:
- ✅ View feature requests (no auth required)
- ✅ Sign in with GitHub
- ✅ Create a new feature request
- ✅ Upvote a request
- ✅ Comment on a request

## 6. Verify GitHub Integration

After creating a feature request, check:
- ✅ GitHub issue was created in your repo
- ✅ Issue has the correct title, description, and label
- ✅ Comments sync to GitHub

## Files Created

```
src/
├── lib/
│   ├── supabase-browser.ts          # Browser Supabase client
│   └── github-auth.ts                # Auth helper
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── github/
│   │   │   │   ├── route.ts          # OAuth redirect
│   │   │   │   └── callback/
│   │   │   │       └── route.ts      # OAuth callback handler
│   │   │   ├── user/
│   │   │   │   └── route.ts          # Get current user
│   │   │   └── logout/
│   │   │       └── route.ts          # Logout route
│   │   └── features/
│   │       ├── route.ts              # List/create features
│   │       └── [id]/
│   │           ├── vote/
│   │           │   └── route.ts      # Vote toggle
│   │           └── comments/
│   │               └── route.ts      # List/create comments
│   └── features/
│       ├── page.tsx                  # Features list page
│       └── [id]/
│           └── page.tsx              # Feature detail page

supabase/
└── migrations/
    ├── feature_requests.sql          # Tables and RLS
    └── feature_requests_functions.sql # SQL functions
```

## Troubleshooting

### "GitHub OAuth not configured" error
- Make sure `GITHUB_OAUTH_CLIENT_ID` and `GITHUB_OAUTH_CLIENT_SECRET` are set
- Restart the dev server after adding env vars

### GitHub issue not created
- Verify `GITHUB_TOKEN` has `repo` scope (create issues permission)
- Check the token is valid and not expired
- Check the console for API errors

### Vote not working
- Make sure the SQL functions were created (`increment_votes`, `decrement_votes`)
- Check RLS policies are enabled on tables

### "Module not found: @supabase/ssr"
- Run `pnpm add @supabase/ssr`

## Optional Enhancements

- **Admin panel**: Add route to change feature status (open → in_progress → completed)
- **Email notifications**: Notify request author when status changes
- **Search/filter**: Add filtering by status, sorting options
- **Rich text**: Use markdown editor for descriptions
- **Reactions**: Add emoji reactions like GitHub
- **Webhooks**: Auto-update status when GitHub issue is closed
