# Big V's Best Routes™ — Supabase Live Setup Guide

**Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™**

> **Advisory:** This guide covers technical setup only. Activating Live Mode does not guarantee route safety, legal compliance, or road restriction accuracy. The driver/operator remains responsible for all final route decisions. Human review and override are always required.

---

## RLS Status

> **RLS must remain ENABLED on all tables. Do not disable RLS to make the frontend work.**

RLS (Row-Level Security) is enabled on all 7 BV tables as part of the Run 10–12 schema. All queries are automatically scoped to `auth.uid() = user_id`.

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Choose a name (e.g. `bigvs-best-routes`), set a database password, and select a region close to your users.
4. Wait for provisioning (1–2 minutes).

---

## Step 2 — Find Your Credentials

In your Supabase project dashboard:

1. Go to **Project Settings → API**.
2. Copy:
   - **Project URL** (e.g. `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
3. **Never copy the `service_role` key** — it must never be used in the frontend.

---

## Step 3 — Run the SQL Setup

**SQL execution order is mandatory.** Run the files in this order in the Supabase **SQL Editor**:

| Order | File | Purpose |
|---|---|---|
| 1 | `supabase/big-vs-best-routes-run10.sql` | Core schema — tables, indexes, RLS enable |
| 2 | `supabase/big-vs-best-routes-run11-live-mode.sql` | Live Mode columns, realtime publication |
| 3 | `supabase/big-vs-best-routes-run12-live-hardening.sql` | Hardening patch — idempotent, safe to re-run |

> All three files are safe to re-run. They use `IF NOT EXISTS`, `CREATE OR REPLACE`, and `DROP IF EXISTS + CREATE` patterns throughout.

### Required Tables

After running the SQL, confirm these 7 tables exist:

| Table | RLS | Realtime |
|---|---|---|
| `bv_vehicles` | ✅ ENABLED | ✅ publication |
| `bv_routes` | ✅ ENABLED | ✅ publication |
| `bv_route_assignments` | ✅ ENABLED | ✅ publication |
| `bv_trip_sessions` | ✅ ENABLED | ✅ publication |
| `bv_driver_reports` | ✅ ENABLED | ✅ publication |
| `bv_compliance_checks` | ✅ ENABLED | ✅ publication |
| `bv_sync_logs` | ✅ ENABLED | — |

### Verify RLS is Enabled

Run this verification query in the SQL Editor:

```sql
SELECT tablename, rowsecurity
  FROM pg_tables
 WHERE schemaname = 'public'
   AND tablename LIKE 'bv_%'
 ORDER BY tablename;
```

All 7 rows must show `rowsecurity = true`.

### Verify No Anon Write Policies

```sql
SELECT tablename, policyname
  FROM pg_policies
 WHERE tablename LIKE 'bv_%'
   AND roles @> ARRAY['anon']::name[]
   AND cmd IN ('INSERT', 'UPDATE', 'DELETE');
-- Expected: 0 rows
```

### Verify Policies

```sql
SELECT tablename, policyname, cmd
  FROM pg_policies
 WHERE tablename LIKE 'bv_%'
 ORDER BY tablename, cmd;
-- Expected: 30+ rows
```

---

## Step 4 — Configure the App

### Option A — Settings Panel (recommended for manual use)

1. Open the app.
2. Go to **Settings → Backend Configuration**.
3. Enter your **Supabase Project URL** and **Anon Key**.
4. Click **Test Connection** — wait for the green "Connection test passed" banner.
5. Click **Save Configuration**.
6. Go to **Settings → Demo / Live Mode** and switch to **Live Mode**.

### Option B — Environment Variables (recommended for Vercel/CI)

Add to your `.env` (copy from `.env.example`):

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The app automatically reads these at build time. No Settings configuration needed on each device — useful for the Driver PWA deployed to a separate device.

---

## Step 5 — Authenticate

Live Mode requires a Supabase Auth account.

1. In your Supabase project, go to **Authentication → Users**.
2. Click **Add User** → **Create new user** and enter an email/password.
3. In the app, open the **Live Mode panel** on the Dashboard or Driver PWA.
4. Enter the email and password you just created.
5. The panel should show **"Signed in"** with your email address.

> Live writes are blocked if not authenticated. This is intentional — RLS requires `auth.uid()`.

---

## Step 6 — Enable Realtime

Realtime is enabled by the SQL publication setup. To confirm it is active:

1. Make sure the app is in Live Mode and signed in.
2. The **Live Mode panel** on the Dashboard should show:
   - **"Live realtime active — N channels"** when subscriptions succeed.
   - **"Live schema ready, realtime not active"** if the publication exists but subscription hasn't started.
   - **"Demo Mode active — realtime disabled"** if still in Demo Mode.
3. If realtime is not starting, check:
   - Supabase project is on a paid plan (realtime requires Pro or above for production use).
   - `supabase_realtime` publication includes your tables (run the verification query in Step 3).

### Manual realtime verification

```sql
SELECT t.tablename
  FROM pg_publication_tables t
  JOIN pg_publication p ON p.pubname = t.pubname
 WHERE p.pubname = 'supabase_realtime'
   AND t.tablename LIKE 'bv_%'
 ORDER BY t.tablename;
-- Expected: bv_route_assignments, bv_trip_sessions, bv_driver_reports,
--           bv_compliance_checks, bv_vehicles, bv_routes
```

---

## Step 7 — Test Authenticated Write

1. In Live Mode (signed in), create a test vehicle from the **Fleet** page.
2. Go to Supabase **Table Editor → bv_vehicles**.
3. Confirm a record appears with `user_id` matching your auth UUID and `source_mode = 'live'`.

---

## Step 8 — Test Dashboard ↔ Driver PWA Sync

1. Sign in on the Dashboard.
2. Create a route assignment in **Operations → Route Assignments → New Assignment**.
3. Open the Driver PWA (`/#/driver-app`) and sign in with the **same Supabase Auth credentials**.
4. The assignment should appear in the Driver PWA jobs list.
5. Accept the assignment — the Dashboard should see the status update (via realtime or reload).
6. Submit a driver report from the Driver PWA — confirm it appears in the Dashboard.

---

## Step 9 — Verify Demo / Live Data Separation

- Demo Mode: local SSOT only — no records sent to Supabase.
- Live Mode: `bv_*` tables only — `source_mode = 'live'` filter active on all SELECTs.
- Switching modes does not delete data in either direction.
- No automatic demo-to-live migration happens.

Verify in Supabase Table Editor: demo records should never appear (they are never written to Supabase).

---

## Safe Rollback Notes

If issues arise after running the SQL:

1. **Do not drop tables** — data loss is not recoverable.
2. **Do not disable RLS** — this creates security exposure.
3. **Do not reset the database** unless intentionally starting fresh.
4. To fix a bad policy: `DROP POLICY IF EXISTS "policy_name" ON table_name;` then re-run the SQL patch.
5. To re-run the SQL patch safely: all files use `IF NOT EXISTS` and `DROP IF EXISTS + CREATE` patterns — re-running is safe.

---

## Known Limitations

- Realtime requires a Supabase Pro plan for production use at scale.
- The Driver PWA and Dashboard must use the **same Supabase Auth account** (single-user design per Runs 1–13).
- Offline live actions (GPS recording, report drafts) are saved locally only and require reconnection to sync.
- Token expiry (typically 1 hour) requires re-authentication. The app handles session refresh automatically via Supabase SDK.

---

*Big V's Best Routes™ — Supabase Live Setup Guide*
*This guide is for technical setup only. It does not constitute legal or compliance certification.*
