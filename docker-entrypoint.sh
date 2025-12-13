#!/bin/sh
set -e

echo "Running Prisma migrations as root..."
cd /app
npx prisma db push --accept-data-loss

echo "Switching to nextjs user and starting server..."
exec su-exec nextjs node server.js
