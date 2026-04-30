# AutoTrack Supabase Setup

## 1. Run migration

Apply the SQL file in your Supabase SQL editor:

- `supabase/migrations/20260413_autotrack_schema.sql`

This creates the core AutoTrack tables, indexes, RLS policies, and the `service-attachments` storage bucket policies.

## 2. Configure auth providers

In Supabase Dashboard:

1. Enable Email provider.
2. Enable Google provider.
3. Add redirect URL:
   - `autotrack://auth/callback`

## 3. Configure app env

Copy `apps/mobile/.env.example` to `apps/mobile/.env` and set your project values.

## 4. Run the app

```bash
pnpm --filter mobile start
```

## 5. Initial validation checklist

1. Sign up/sign in with email.
2. Sign in with Google.
3. Add two vehicles and set one as primary.
4. Add fuel logs and verify MPG/rolling average chart.
5. Add a maintenance task and mark it completed.
6. Open Service History and verify merged timeline.
7. Disable network, add a log, reconnect, and confirm sync behavior.
