# Deploying: Frontend on Vercel, Backend on Render

This project is a monorepo (`frontend/` + `backend/`), so both platforms need
to be told which subfolder to use.

## 1. Backend → Render

1. **New Web Service** → connect this repo.
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build` (runs `prisma generate` +
     `prisma migrate deploy`)
   - Start Command: `npm start`
   - Health Check Path: `/health`
   - (Or: New → Blueprint, and point Render at `render.yaml` in the repo root
     to provision the web service + a free Postgres DB together.)

2. **Add a Postgres database** (Render → New → PostgreSQL, or via the
   blueprint) and copy its **Internal Connection String** into `DATABASE_URL`
   on the web service.

3. **Environment variables** on the Render service:
   ```
   NODE_ENV=production
   DATABASE_URL=<from Render Postgres>
   JWT_ACCESS_SECRET=<32+ random chars>
   JWT_REFRESH_SECRET=<different 32+ random chars>
   CLIENT_URL=https://your-app.vercel.app
   ```
   `CLIENT_URL` accepts a comma-separated list, so you can include Vercel
   preview URLs too: `CLIENT_URL=https://your-app.vercel.app,https://your-app-git-main-you.vercel.app`

4. **Run your first migration before/alongside first deploy.** This repo
   currently has `prisma/schema.prisma` but no `prisma/migrations/` folder
   yet, so `prisma migrate deploy` has nothing to apply. Once, from your
   machine (with `DATABASE_URL` pointed at the Render DB, or any Postgres):
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```
   Commit the generated `prisma/migrations/` folder — after that, every
   future Render deploy's `migrate deploy` step will apply new migrations
   automatically.

5. Note the deployed URL, e.g. `https://university-system-backend.onrender.com`.

## 2. Frontend → Vercel

1. **New Project** → import this repo.
   - Root Directory: `frontend`
   - Framework: Next.js (auto-detected)
2. **Environment variable**:
   ```
   NEXT_PUBLIC_API_URL=https://university-system-backend.onrender.com/api/v1
   ```
3. Deploy. Update the backend's `CLIENT_URL` to match your final Vercel
   domain (and redeploy the backend) once you know it.

## What was fixed for cross-domain deployment

Frontend (Vercel) and backend (Render) live on different domains, which is a
cross-site setup even though it's still "your app talking to your API":

- **CORS** only accepted a single hardcoded origin — now reads a
  comma-separated `CLIENT_URL` list, so prod + preview URLs both work.
- **Refresh-token cookie** was `SameSite=Lax`, which browsers *drop* on
  cross-site requests. It's now `SameSite=None; Secure` in production (still
  `Lax` for local dev over http). `logout`'s `clearCookie` was updated to
  match, since browsers ignore a clear call whose attributes don't match the
  original cookie.
- **`trust proxy`** wasn't set — behind Render's reverse proxy this made
  `secure` cookie detection and `express-rate-limit`'s IP detection unreliable.
- **Prisma client generation** wasn't wired into the install/build step —
  added `postinstall`/`build` scripts so Render always has a fresh client and
  applies pending migrations on deploy.

## Still worth doing before real production use (already noted in README)

- Move file uploads off local disk (`backend/uploads/`) to S3/Cloudinary —
  Render's disk is ephemeral and uploaded files won't survive a redeploy.
- Point `EMAIL_*` at a real SMTP provider.
- If you ever run more than one backend instance, set
  `SCHEDULER_ENABLED=false` on all but one.
