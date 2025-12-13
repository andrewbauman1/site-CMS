#!/bin/bash
# One-time database initialization script
# Run this from your local machine to initialize the database

echo "Initializing database tables..."
docker exec site_cms-web-1 sh -c "cd /app && npx prisma db push --accept-data-loss"

echo "Database initialized! Restart the web container:"
echo "docker compose restart web"
