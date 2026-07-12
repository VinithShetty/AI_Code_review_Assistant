# Deploying CodeReview AI (VPS + Docker Compose)

> **Want a free deploy with no domain?** See **[VERCEL.md](VERCEL.md)** (Vercel + Neon).
> This VPS guide is the paid, self-hosted alternative.
>
> **Database note:** the app now uses **PostgreSQL** (Prisma provider `postgresql`).
> To use this VPS path, run a Postgres database and point `DATABASE_URL` at it
> (add a `postgres` service to `docker-compose.prod.yml`, or use a managed
> Postgres) — the SQLite volume settings below are legacy.

This deploys the app as a single Next.js container behind **Caddy** (automatic HTTPS).

```
Internet ──▶ Caddy (:80/:443, auto-TLS) ──▶ web (Next.js :3000) ──▶ SQLite (volume)
```

## Prerequisites

- A Linux VPS (1 vCPU / 1–2 GB RAM is enough to start) with **Docker** and the
  **Docker Compose plugin** installed.
- Ports **80** and **443** open to the internet.
- A **domain name** you control.

## 1. Point DNS at the server

Create an **A record** for your domain (e.g. `codereview.example.com`) pointing at
the VPS's public IP. Wait for it to resolve before continuing (Caddy needs it to
issue the TLS certificate).

## 2. Create / update the GitHub OAuth App

At **GitHub → Settings → Developer settings → OAuth Apps**, create (or edit) the
app and set the **Authorization callback URL** to:

```
https://<your-domain>/api/auth/callback/github
```

Copy the **Client ID** and generate a **Client Secret** for the next step.

## 3. Get the code on the server

```bash
git clone https://github.com/VinithShetty/AI_Code_review_Assistant.git
cd AI_Code_review_Assistant
```

## 4. Configure the environment

```bash
cp .env.production.example .env.production
nano .env.production
```

Fill in at least:

| Variable | Value |
|----------|-------|
| `DOMAIN` | your domain, no protocol (e.g. `codereview.example.com`) |
| `NEXTAUTH_URL` | `https://<your-domain>` |
| `NEXTAUTH_SECRET` | output of `openssl rand -base64 32` |
| `GITHUB_CLIENT_ID` | from step 2 |
| `GITHUB_CLIENT_SECRET` | from step 2 |

Leave `DATABASE_URL` as-is (compose sets it to the volume path).

## 5. Build and start

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

On first boot the container runs `prisma db push` to create the SQLite schema on
the volume, then starts Next.js. Caddy provisions the TLS certificate automatically.

## 6. Verify

```bash
# health (from the server)
docker compose -f docker-compose.prod.yml exec web wget -qO- http://localhost:3000/api/health
# -> {"status":"ok","db":"connected", ...}
```

Then open **https://\<your-domain\>**, click **Continue with GitHub**, connect a
repository, and run a review.

## Operations

```bash
# logs
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f caddy

# restart
docker compose -f docker-compose.prod.yml restart web

# update to the latest code
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# back up the SQLite database (copy the file out of the volume)
docker compose -f docker-compose.prod.yml cp web:/app/db/prod.db ./backup-$(date +%F).db
```

## Notes & next steps

- **Database:** SQLite on a volume is fine for a single small instance. For scale
  or multiple app replicas, move to Postgres: change the Prisma datasource provider
  to `postgresql`, set `DATABASE_URL` to your Postgres connection string, add a
  `db` service (or use a managed DB), and swap the entrypoint's `prisma db push`
  for `prisma migrate deploy`.
- **Build type-checking:** `next.config.ts` sets `typescript.ignoreBuildErrors: true`,
  so the production build does not fail on the handful of pre-existing type errors
  in `examples/`, `mini-services/`, and a couple of API routes. They don't affect
  the app at runtime, but are worth cleaning up over time.
- **AI reviews** require the `z-ai-web-dev-sdk` model endpoint to be reachable from
  the server; if it isn't, reviews are stored with a graceful fallback rather than
  failing.
- **Secrets:** `.env.production` is gitignored — keep it only on the server.
