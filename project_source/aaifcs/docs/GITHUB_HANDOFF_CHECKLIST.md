# Big V's Best Routes™ — GitHub Handoff Checklist

**Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™**

Use this checklist before pushing to GitHub and before handing the project to any collaborator or deployment pipeline.

---

## ⛔ Before You Push — Security Checks

- [ ] `.env` is listed in `.gitignore` — verify with `cat .gitignore | grep .env`
- [ ] `.env` file does NOT exist in the repo root (only `.env.example`)
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` appears anywhere in committed files
- [ ] No `DATABASE_URL=`, `JWT_SECRET=`, `PRIVATE_KEY=` in committed files
- [ ] No `OPENAI_API_KEY=`, `GROQ_API_KEY=`, `STRIPE_SECRET_KEY=` in committed files
- [ ] No hardcoded API keys or passwords in source files

Run this scan before pushing:
```bash
grep -rn "SERVICE_ROLE_KEY\|JWT_SECRET\s*=\|PRIVATE_KEY\s*=\|STRIPE_SECRET\s*=" \
  --include="*.js" --include="*.jsx" --include="*.env" \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git .
# Expected: 0 results (mentions in comments/docs are ok)
```

---

## Files to Commit ✅

### Core source (flat build — all in root)
- [ ] All `*.jsx` files (pages, layouts, modules, components)
- [ ] All `*.js` files (services, hooks, config, utils, engines)
- [ ] `main.jsx`
- [ ] `index.html`
- [ ] `styles_globals.css`
- [ ] `app_App.jsx`, `app_Router.jsx`

### Config
- [ ] `package.json`
- [ ] `package-lock.json` ← **required for `npm ci` on Vercel**
- [ ] `vite.config.js`
- [ ] `tailwind.config.js`
- [ ] `postcss.config.js`
- [ ] `vercel.json`
- [ ] `.env.example` ← safe template only, no real values
- [ ] `.gitignore`

### Public assets
- [ ] `public/sw-job-sync.js`
- [ ] `public/icons/icon-192x192.png`
- [ ] `public/icons/icon-512x512.png`

### Supabase SQL
- [ ] `supabase/big-vs-best-routes-run10.sql`
- [ ] `supabase/big-vs-best-routes-run11-live-mode.sql`
- [ ] `supabase/big-vs-best-routes-run12-live-hardening.sql`

### Documentation
- [ ] `README.md`
- [ ] `docs/SUPABASE_LIVE_SETUP_GUIDE.md`
- [ ] `docs/VERCEL_DEPLOYMENT_GUIDE.md`
- [ ] `docs/GITHUB_HANDOFF_CHECKLIST.md`
- [ ] `docs/RUN_12_LIVE_MODE_VALIDATION_REPORT.md`
- [ ] `docs/RUN_13_FINAL_PRODUCTION_READINESS_REPORT.md`
- [ ] `docs/technical-handover-big-vs-best-routes.md`
- [ ] `docs/investor-demo-pack-big-vs-best-routes.md`

---

## Files NOT to Commit ❌

| File/Folder | Reason |
|---|---|
| `.env` | Contains real credentials — already in `.gitignore` |
| `node_modules/` | Dependencies — already in `.gitignore` |
| `dist/` | Build output — already in `.gitignore` |
| `*.local` | Local override files — already in `.gitignore` |
| `.DS_Store`, `Thumbs.db` | OS metadata — already in `.gitignore` |
| Any file named `*.key`, `*.pem`, `*.secret` | Secrets |

---

## Supabase SQL Location

All SQL patches are in `supabase/`:

```
supabase/
  big-vs-best-routes-run10.sql           ← Run 10 core schema
  big-vs-best-routes-run11-live-mode.sql ← Run 11 live mode columns
  big-vs-best-routes-run12-live-hardening.sql ← Run 12 hardening (latest)
```

**Run order:** Run 10 → Run 11 → Run 12

See `docs/SUPABASE_LIVE_SETUP_GUIDE.md` for full instructions.

---

## Validation Report Location

```
docs/
  RUN_12_LIVE_MODE_VALIDATION_REPORT.md   ← Run 12 all 50 gates
  RUN_13_FINAL_PRODUCTION_READINESS_REPORT.md ← Run 13 all 60 gates
```

---

## PWA Files to Verify Before Push

- [ ] `public/icons/icon-192x192.png` exists and is a valid PNG
- [ ] `public/icons/icon-512x512.png` exists and is a valid PNG
- [ ] `public/sw-job-sync.js` exists
- [ ] `vite.config.js` PWA manifest has correct `name`, `short_name`, `start_url`
- [ ] `index.html` has `apple-mobile-web-app-title` = `Big V Routes`

---

## Live Mode Config Docs to Verify

- [ ] `docs/SUPABASE_LIVE_SETUP_GUIDE.md` exists
- [ ] `docs/VERCEL_DEPLOYMENT_GUIDE.md` exists
- [ ] `.env.example` contains `VITE_SUPABASE_URL=` and `VITE_SUPABASE_ANON_KEY=`
- [ ] `.env.example` does NOT contain any real values

---

## Demo Mode Protection Note

> Demo Mode must not be touched in any push or PR. Demo data is stored in localStorage only and never touches Supabase. Any change that causes Demo Mode to depend on Supabase, require auth, or show different data is a regression and must be reverted.

Before pushing, verify Demo Mode still works:
1. Open the app with no `.env` set (or with `VITE_SUPABASE_URL` blank).
2. App should load normally in Demo Mode.
3. All demo records should appear on the Dashboard and in the Driver PWA.
4. No Supabase connection errors should appear.

---

## Push Checklist

```bash
# 1. Build passes
npm run build

# 2. Security scan clean
grep -rn "SERVICE_ROLE_KEY\|JWT_SECRET\s*=" --include="*.js" --include="*.jsx" --exclude-dir=node_modules .

# 3. Stage all files
git add .

# 4. Review what's staged (check for .env accidentally staged)
git status

# 5. Commit
git commit -m "feat(Run13): Final production readiness + deployment validation"

# 6. Push
git push origin main
```

---

## Rollback Guidance

If a push breaks the app:

1. **Identify the breaking commit:**
   ```bash
   git log --oneline -10
   ```
2. **Revert to last working commit:**
   ```bash
   git revert HEAD   # creates a revert commit (safe)
   # OR
   git reset --hard <last-good-sha>  # destructive — only use locally
   ```
3. **Never revert Runs 1–12** unless specifically fixing a regression in that run's files.
4. **Never reset Supabase** — contact Supabase support if database state is broken.
5. **Preserve the validation report** — even if it documents a failure.

---

*Big V's Best Routes™ — GitHub Handoff Checklist*
*Kyzel Kreates™ | 4P3X Verse*
