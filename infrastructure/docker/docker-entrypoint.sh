#!/bin/sh
# Production entrypoint: ensure the SQLite schema exists on the mounted volume,
# then start the Next.js production server.
set -e

echo "[entrypoint] Prisma: syncing schema to ${DATABASE_URL} ..."
npx prisma db push --skip-generate

echo "[entrypoint] Starting Next.js (next start) ..."
exec npm run start
