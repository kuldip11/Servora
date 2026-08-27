# Servora — Free Deployment Guide

Five services, all free, no card required anywhere:

| #   | Piece                                      | Service     | What it does            |
| --- | ------------------------------------------ | ----------- | ----------------------- |
| 1   | Postgres                                   | **Neon**    | Database                |
| 2   | Redis                                      | **Upstash** | Cache / sessions        |
| 3   | API (`apps/api`)                           | **Render**  | Backend server (Docker) |
| 4   | `apps/web`                                 | **Vercel**  | Main admin frontend     |
| 5   | `apps/kitchen-display` + `apps/waiter-app` | **Vercel**  | Two more frontends      |

Do them in this exact order — each step needs values from the one before it.

Push this repo (with the fixes already applied) to a **GitHub repo** first — Render and Vercel both deploy by connecting to GitHub. If it's not on GitHub yet: create a new repo on github.com, then from the project root:

```
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

---

## STEP 1 — Postgres on Neon

1. Go to **console.neon.tech** → click **Sign up** → sign in with GitHub (fastest, no password to manage).
2. You'll land on "Create your first project." Fill in:
   - **Project name**: `servora`
   - **Postgres version**: leave default
   - **Region**: pick the one closest to you (e.g. `AWS Asia Pacific (Mumbai)` if available, otherwise the nearest option)
3. Click **Create project**. It creates the project and a default database called `neondb`.
4. On the project dashboard, find the **Connection String** box (usually front and center, or under **Dashboard → Connection Details**).
5. Make sure the dropdown next to it says **Pooled connection** (important — this is the one your app should use).
6. Click the **copy icon** next to the connection string. It looks like:
   ```
   postgresql://neondb_owner:AbC123xyz@ep-cool-name-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
7. **Save this somewhere** (Notes app, text file) — this is your `DATABASE_URL`. You'll paste it into Render in Step 3.

That's it for Neon. Nothing to run yet — Render will run the migrations after it's deployed.

---

## STEP 2 — Redis on Upstash

1. Go to **console.upstash.com** → **Sign up** → sign in with GitHub.
2. Click **Create Database**.
3. Fill in:
   - **Name**: `servora-redis`
   - **Type**: Regional (not Global — Global costs more/has different limits)
   - **Region**: pick one close to where Render will run your API — Render's free tier only offers **Oregon (US West)**, so pick the closest Upstash region to that, e.g. `us-west-1`
   - **Eviction**: leave default (off)
4. Click **Create**.
5. On the database page, scroll to **REST API** section — ignore that, you need the **TCP** one instead. Look for a section called **"Connect"** or a dropdown for **ioredis** / **Node-Redis** — copy the URL that starts with `rediss://` (note the double `s` — this means TLS-encrypted). It looks like:
   ```
   rediss://default:AbCdEf123456@us1-example-name-12345.upstash.io:6379
   ```
   If you don't see a ready-made URL, it's under the **"Details"** tab as separate fields (`Endpoint`, `Port`, `Password`) — combine them yourself as:
   ```
   rediss://default:<Password>@<Endpoint>:<Port>
   ```
6. **Save this** — this is your `REDIS_URL` for Step 3.

---

## STEP 3 — API backend on Render

### 3a. Create the service

1. Go to **dashboard.render.com** → **Sign up** → sign in with GitHub → **authorize Render** to access your repos (it'll ask for either "All repositories" or you can pick just this one — picking just this one repo is fine and more limited-permission).
2. Click **New +** (top right) → **Web Service**.
3. Find your repo in the list (e.g. `<your-username>/Servora`) → click **Connect**.
4. On the configuration screen, fill in:
   - **Name**: `servora-api`
   - **Region**: `Oregon (US West)` (this is the free-tier region)
   - **Branch**: `main`
   - **Root Directory**: leave **blank** (must stay at repo root — the Dockerfile needs to see `packages/` too)
   - **Runtime**: select **Docker**
   - **Dockerfile Path**: `apps/api/Dockerfile`
   - **Docker Build Context Directory**: `.` (repo root)
   - **Instance Type**: **Free**
5. Scroll down to **Environment Variables**. Click **Add Environment Variable** for each of these:

| Key                        | Value                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                 | `production`                                                                                       |
| `PORT`                     | `3000`                                                                                             |
| `DATABASE_URL`             | _(the Neon pooled connection string from Step 1)_                                                  |
| `REDIS_URL`                | _(the Upstash `rediss://...` string from Step 2)_                                                  |
| `JWT_SECRET`               | _(any long random string — see below)_                                                             |
| `JWT_EXPIRES_IN`           | `15m`                                                                                              |
| `REFRESH_TOKEN_SECRET`     | _(a different long random string)_                                                                 |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d`                                                                                               |
| `CORS_ORIGIN`              | leave this blank for now — you'll come back and fill it in Step 5, after you have your Vercel URLs |

To generate the two random secrets, run this on your own machine (or use any password generator, 40+ characters):

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it twice — once for `JWT_SECRET`, once for `REFRESH_TOKEN_SECRET`. Never reuse the same value for both.

6. Click **Deploy Web Service** at the bottom.
7. Render will start building. This takes a few minutes (Docker build). Watch the **Logs** tab. You want to see it end with something like `Servora API running on port 3000` or your health check passing.
8. Once live, Render shows your API's public URL at the top, like:
   ```
   https://servora-api.onrender.com
   ```
   **Save this URL** — you'll need it for Step 4.

### 3b. Run the database migration once

The API code will run and connect fine, but the database tables won't exist yet until migrations run. Render's **free** tier doesn't give you a shell, so the simplest way is to run the migration from your own computer, pointed at the live Neon database:

1. On your own machine, inside the `apps/api` folder, create a temporary `.env` file (don't commit it):
   ```
   DATABASE_URL=<paste the same Neon connection string>
   ```
2. Run:
   ```
   cd apps/api
   bun install
   bun run db:migrate
   ```
   (If you don't have Bun locally, install it first: `curl -fsSL https://bun.sh/install | bash`)
3. You should see `✅ Migrations complete!` in the output.
4. Delete the temporary `.env` file when done (don't leave real secrets sitting on disk).

If you'd rather not install Bun locally, alternative: add a **free Render Cron Job** (New + → Cron Job, same repo, same Docker settings, but with command `bun run db:migrate`, schedule it far in the future or run it manually once via "Trigger Run"), then delete the cron job after it succeeds once.

---

## STEP 4 — Frontends on Vercel

You'll repeat this three times — once per app (`web`, `kitchen-display`, `waiter-app`). The steps are identical except for the **Root Directory** and **project name**.

### 4a. One-time Vercel setup

1. Go to **vercel.com** → **Sign up** → **Continue with GitHub** → authorize Vercel (again, you can scope it to just this one repo).

### 4b. Deploy `apps/web`

1. From the Vercel dashboard, click **Add New...** → **Project**.
2. Find your repo → click **Import**.
3. On the configure screen:
   - **Project Name**: `servora-web`
   - **Framework Preset**: Vercel should auto-detect **Vite** — if not, select it manually
   - Click **Edit** next to **Root Directory** → select `apps/web` → **Continue**
   - **Build Command**: `bun run build` (or leave as auto-detected `vite build` — either works; if Vercel shows an error about Bun, override this field manually with `bun run build`)
   - **Output Directory**: `dist`
   - **Install Command**: `bun install` (override this manually if it's not auto-filled — it needs to run from a workspace root, but since you set Root Directory, Vercel handles the monorepo context automatically via its build system; if the install fails, see the troubleshooting note at the bottom)
4. Expand **Environment Variables** and add:

| Key            | Value                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL` | `https://servora-api.onrender.com` _(your Render URL from Step 3, no trailing slash)_                         |
| `VITE_WS_URL`  | `wss://servora-api.onrender.com/ws/events` _(same host, `wss://` not `https://`, note the `/ws/events` path)_ |

5. Click **Deploy**.
6. Wait for the build (1–3 min). When done, Vercel shows your live URL, like:
   ```
   https://servora-web.vercel.app
   ```
   **Save this URL.**

### 4c. Deploy `apps/kitchen-display`

Repeat 4b exactly, but:

- **Project Name**: `servora-kitchen-display`
- **Root Directory**: `apps/kitchen-display`
- Same two env vars, same values (`VITE_API_URL`, `VITE_WS_URL` — same Render URL)
- Save the resulting URL, e.g. `https://servora-kitchen-display.vercel.app`

### 4d. Deploy `apps/waiter-app`

Repeat again:

- **Project Name**: `servora-waiter-app`
- **Root Directory**: `apps/waiter-app`
- Same env vars
- Save the resulting URL, e.g. `https://servora-waiter-app.vercel.app`

You now have 3 live frontend URLs and 1 live backend URL.

---

## STEP 5 — Connect them: set CORS on Render

Go back to **Render** → your `servora-api` service → **Environment** tab (left sidebar) → find `CORS_ORIGIN` → click to edit → set it to all three Vercel URLs, **comma-separated, no spaces**:

```
https://servora-web.vercel.app,https://servora-kitchen-display.vercel.app,https://servora-waiter-app.vercel.app
```

Click **Save Changes**. Render will automatically redeploy the API with the new value (takes ~1 min, no rebuild needed since it's just an env var).

---

## STEP 6 — Verify it all works

1. Open `https://servora-api.onrender.com/health` in a browser — you should get a JSON response (not an error page). **First request after idle will take 30–60 seconds** — Render's free tier sleeps the service after 15 minutes of no traffic. This is normal, not a bug.
2. Open `https://servora-web.vercel.app` — the app should load and be able to log in / talk to the API without CORS errors. Open browser DevTools (F12) → Console/Network tab if something looks broken — a CORS error there means Step 5 wasn't saved correctly.
3. Repeat for the kitchen-display and waiter-app URLs.

---

## Docker files — what changed, and do you need to add anything?

**Nothing new needs to be created.** `apps/api/Dockerfile` and `apps/web/Dockerfile` already exist and are what Render/Vercel use. I made one small fix to both, already applied in this copy of the repo:

- Bumped the base image from `oven/bun:1.1-alpine` to `oven/bun:1.3.14-alpine`, so the Docker build uses the same Bun version your CI (`ci.yml`) tests against, instead of a stale `1.1` pin. Without this, you could pass CI locally but hit a subtly different Bun runtime in production.

`apps/kitchen-display` and `apps/waiter-app` don't have (and don't need) their own Dockerfiles — Vercel builds and serves static Vite output directly, no container required for those two.

---

## Full list of environment variables (reference table)

**Render (`servora-api`):**

| Key                        | Value                                             | Where it comes from  |
| -------------------------- | ------------------------------------------------- | -------------------- |
| `NODE_ENV`                 | `production`                                      | fixed                |
| `PORT`                     | `3000`                                            | fixed                |
| `DATABASE_URL`             | Neon pooled connection string                     | Step 1               |
| `REDIS_URL`                | Upstash `rediss://...` string                     | Step 2               |
| `JWT_SECRET`               | random 32+ byte hex string                        | you generate         |
| `JWT_EXPIRES_IN`           | `15m`                                             | fixed                |
| `REFRESH_TOKEN_SECRET`     | random 32+ byte hex string (different from above) | you generate         |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d`                                              | fixed                |
| `CORS_ORIGIN`              | comma-separated list of your 3 Vercel URLs        | Step 5, after Step 4 |

**Vercel (`servora-web`, `servora-kitchen-display`, `servora-waiter-app` — same two vars, same values, on all three):**

| Key            | Value                                      |
| -------------- | ------------------------------------------ |
| `VITE_API_URL` | `https://servora-api.onrender.com`         |
| `VITE_WS_URL`  | `wss://servora-api.onrender.com/ws/events` |

---

## Known limitations of this free setup

- **Render cold starts**: API sleeps after 15 min idle, ~30–60s wake-up on next request. Fine for a demo/personal project; not for something you need instantly responsive 24/7 without paying.
- **Neon**: free project scales compute to zero when idle too, but wakes up fast (usually under 1s) — not a practical issue.
- **Upstash free tier**: 500,000 commands/month, 256MB storage. Fine unless you get real production traffic.
- If you outgrow any of this, the cheapest next step is usually Render's $7/mo Starter instance (no sleep) — everything else can often stay free even at moderate usage.

---

## Phase 6 production-ready path

The earlier sections document a low-cost/manual hosting path. For a reproducible release, Phase 6 adds a stricter production workflow:

```bash
cp .env.production.example .env.production
# replace every placeholder with secret-manager / production values
set -a
. ./.env.production
set +a

bun run validate:production-env
docker compose --env-file .env.production -f docker-compose.production.yml build
docker compose --env-file .env.production -f docker-compose.production.yml up -d
```

Before promotion, run the GitHub **Release verification** workflow or the equivalent commands documented in `docs/PHASE_6_8_RELEASE_CERTIFICATION.md`. Database backups should be taken before migration/deployment changes, and restore should be tested in a non-production recovery environment.
