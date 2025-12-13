#!/bin/sh
set -e

echo "Fixing prisma directory permissions..."
chown -R root:root /app/prisma

echo "Running Prisma migrations..."
cd /app
npx prisma db push --accept-data-loss

echo "Restoring permissions and starting server..."
chown -R nextjs:nodejs /app/prisma
exec su-exec nextjs node server.js
