# Deploy CodeReview AI for free (Vercel + Neon)

Free hosting with a free HTTPS URL and no domain required:
**Vercel** hosts the Next.js app; **Neon** provides a free serverless PostgreSQL
database. No server to manage, no cost.

## 1. Create a free Postgres database (Neon)

1. Sign up at **https://neon.tech** (free) and create a project.
2. Open **Connection Details** — you'll see two connection strings:
   - a **Pooled** one (host contains `-pooler`) → this is your `DATABASE_URL`
   - a **Direct** one → this is your `DIRECT_URL`
   Copy both.

## 2. Create the database tables (one time)

From your local machine in the repo, push the schema to Neon:

```bash
# macOS / Linux
DIRECT_URL="<neon-direct-url>" DATABASE_URL="<neon-pooled-url>" npx prisma db push
```

```powershell
# Windows PowerShell
$env:DIRECT_URL="<neon-direct-url>"; $env:DATABASE_URL="<neon-pooled-url>"; npx prisma db push
```

This creates all the tables in your Neon database.

## 3. Import the project into Vercel

1. Sign up at **https://vercel.com** with your GitHub account (free).
2. **Add New → Project → Import** `VinithShetty/AI_Code_review_Assistant`.
3. Framework preset **Next.js** is auto-detected — leave build settings default.
4. Add **Environment Variables**:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Neon **pooled** URL |
   | `DIRECT_URL` | Neon **direct** URL |
   | `NEXTAUTH_SECRET` | output of `openssl rand -base64 32` |
   | `GITHUB_CLIENT_ID` | from your GitHub OAuth App |
   | `GITHUB_CLIENT_SECRET` | from your GitHub OAuth App |

   (Leave `NEXTAUTH_URL` for step 4 — you need the deployed URL first.)

5. Click **Deploy**. Vercel builds and gives you a URL like
   `https://ai-code-review-assistant.vercel.app`.

## 4. Wire up the URL + GitHub OAuth

1. In your **GitHub OAuth App** (https://github.com/settings/developers), set the
   **Authorization callback URL** to:
   ```
   https://<your-vercel-url>/api/auth/callback/github
   ```
2. In Vercel → **Settings → Environment Variables**, add:
   ```
   NEXTAUTH_URL = https://<your-vercel-url>
   ```
3. **Redeploy** (Deployments → ⋯ → Redeploy) so the new variable takes effect.

## 5. Done 🎉

Open your Vercel URL → **Continue with GitHub** → connect a repo → run a review.

## Notes

- **Free tier:** Vercel Hobby is free for personal projects; Neon's free tier is
  plenty here.
- **Auto-deploy:** every push to `main` redeploys automatically. If you change the
  Prisma schema, re-run the `prisma db push` from step 2.
- **AI reviews** are capped at ~60s per request (Vercel Hobby limit) — fine for
  normal PRs; a very large diff may fall back gracefully.
- **Local dev** now needs a Postgres `DATABASE_URL` too (point it at Neon, or run a
  local Postgres) — the app no longer uses SQLite.
