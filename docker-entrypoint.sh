#!/bin/sh
set -e

echo "Running Prisma migrations..."
cd /app
prisma db push --accept-data-loss

echo "Starting server..."
exec su-exec nextjs node server.js
