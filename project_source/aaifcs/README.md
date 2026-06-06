# Big V's Best Routes™

**Single-User Multi-Vehicle Safe & Legal Route Planner**
Powered by **4P3X Intelligent AI™** | Created by **Kyzel Kreates™**
Part of the **4P3X Verse**

---

## Quick Start

```bash
npm install
npm run dev       # local development
npm run build     # production build → /dist
npm run preview   # preview production build locally
```

## Demo Mode (default)

No backend required. All data is simulated using local storage.
Open the app and everything works out of the box.

## Live Mode (Supabase)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/big-vs-best-routes-run12-live-hardening.sql` in the Supabase SQL Editor
3. Copy `.env.example` → `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Go to **Settings → Backend** in the app, enter your Supabase URL and anon key, and click **Test Connection**
5. Turn off Demo Mode in **Settings → Demo / Live Mode**
6. Sign in via the **Live Mode panel** on the Dashboard

Full setup: see `docs/SUPABASE_LIVE_SETUP_GUIDE.md`

## Deployment (Vercel)

See `docs/VERCEL_DEPLOYMENT_GUIDE.md`

## Documentation

| Doc | Purpose |
|---|---|
| `docs/SUPABASE_LIVE_SETUP_GUIDE.md` | Supabase setup, RLS, realtime, auth |
| `docs/VERCEL_DEPLOYMENT_GUIDE.md` | Vercel deployment, env vars, checklist |
| `docs/GITHUB_HANDOFF_CHECKLIST.md` | GitHub commit/push checklist |
| `docs/RUN_12_LIVE_MODE_VALIDATION_REPORT.md` | Live Mode validation (Run 12) |
| `docs/RUN_13_FINAL_PRODUCTION_READINESS_REPORT.md` | Final production readiness (Run 13) |
| `docs/technical-handover-big-vs-best-routes.md` | Full technical handover |
| `supabase/big-vs-best-routes-run12-live-hardening.sql` | Latest SQL patch (Run 12) |

## Advisory

> Big V's Best Routes™ is advisory route-planning support only.
> The platform does not guarantee legal compliance, route safety, or restriction clearance.
> The driver/operator remains responsible for checking live road signs, restrictions,
> vehicle suitability, and professional judgement at all times.

---

*Big V's Best Routes™ · Powered by 4P3X Intelligent AI™ · Created by Kyzel Kreates™*
