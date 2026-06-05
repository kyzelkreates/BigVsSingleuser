# Big V's Best Routes™ — Vercel Deployment Guide
**Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™**

---

## Step 1 — Add the GitHub Actions workflow

Your GitHub token needs the `workflow` scope to push `.github/workflows/` files via API.
The easiest way is to add the file directly in GitHub's web UI:

1. Go to your repo: **https://github.com/kyzelkreates/bv1user**
2. Click **Add file → Create new file**
3. Type the path: `.github/workflows/deploy.yml`
4. Paste the content below → **Commit changes**

```yaml
# ============================================================
# Big V's Best Routes™ — GitHub Actions: Build & Deploy → Vercel
# Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
# ============================================================

name: Build & Deploy → Vercel

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    name: Vite Build + Vercel Deploy
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout source
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Vite build
        run: npm run build
        env:
          VITE_ENABLE_DEMO_MODE:     ${{ secrets.VITE_ENABLE_DEMO_MODE || 'true' }}
          VITE_SUPABASE_URL:         ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY:    ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_MAP_PROVIDER:         ${{ secrets.VITE_MAP_PROVIDER || 'osm' }}
          VITE_GRAPHHOPPER_API_KEY:  ${{ secrets.VITE_GRAPHHOPPER_API_KEY }}
          VITE_MAPBOX_TOKEN:         ${{ secrets.VITE_MAPBOX_TOKEN }}
          VITE_OPENROUTER_API_KEY:   ${{ secrets.VITE_OPENROUTER_API_KEY }}
          VITE_DEEPSEEK_API_KEY:     ${{ secrets.VITE_DEEPSEEK_API_KEY }}
          VITE_MISTRAL_API_KEY:      ${{ secrets.VITE_MISTRAL_API_KEY }}
          NODE_OPTIONS: '--max-old-space-size=4096'

      - name: Verify dist output
        run: |
          test -f dist/index.html && echo "✅ dist/index.html exists" || (echo "❌ Missing dist/index.html" && exit 1)

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Pull Vercel project settings
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID:     ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Deploy to Vercel (production)
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID:     ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Step 2 — Connect Vercel to the repo

### Option A — Vercel Dashboard (recommended, easiest)

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import **kyzelkreates/bv1user** from GitHub
3. Vercel auto-detects Vite — confirm these settings:
   - **Framework:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm ci`
4. Click **Deploy**

Vercel will deploy on every push to `main` automatically via its own GitHub integration — **no workflow file needed** for basic deploys.

### Option B — GitHub Actions → Vercel CLI (manual control)

If you want the GitHub Actions pipeline to control deploys:

1. Install Vercel CLI locally: `npm i -g vercel`
2. Run `vercel link` inside the project folder
3. Note `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from `.vercel/project.json`
4. Get a Vercel token: Vercel Dashboard → Settings → Tokens → Create
5. Add these GitHub Secrets (repo Settings → Secrets → Actions):

| Secret name | Value |
|---|---|
| `VERCEL_TOKEN` | Your Vercel token |
| `VERCEL_ORG_ID` | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` |

6. Add the workflow file (Step 1 above)

---

## Step 3 — Environment variables on Vercel

In Vercel Dashboard → Project → Settings → Environment Variables, add:

| Variable | Value | Required |
|---|---|---|
| `VITE_ENABLE_DEMO_MODE` | `true` | Yes (default) |
| `VITE_SUPABASE_URL` | Your Supabase project URL | Optional |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon/public** key only | Optional |
| `VITE_MAP_PROVIDER` | `osm` | Optional |
| `VITE_GRAPHHOPPER_API_KEY` | GraphHopper API key | Optional |
| `VITE_MAPBOX_TOKEN` | Mapbox token | Optional |

**Never add:** `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `JWT_SECRET`, or any backend-only secret to Vercel frontend env vars.

---

## Step 4 — Update your GitHub token (for CLI pushes)

To push `.github/workflows/` files via token in the future:

1. GitHub → Settings → Developer settings → Personal access tokens
2. Edit your token → add **`workflow`** scope
3. Then push normally: `git push origin main`

---

## Build status

| Check | Status |
|---|---|
| `npm run build` locally | ✅ Passes (8.5s) |
| `dist/index.html` | ✅ Generated |
| `dist/sw.js` | ✅ PWA service worker generated |
| `vercel.json` | ✅ Configured |
| `package.json` engines | ✅ `node>=20` |

---

*Big V's Best Routes™ · Powered by 4P3X Intelligent AI™ · Created by Kyzel Kreates™*
