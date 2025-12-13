# Site Backend

Backend for **[drewsiph.dev](https://drewsiph.dev)**  
Repo: https://github.com/andrewbauman1/site

A small, purpose-built CMS for managing Jekyll content via GitHub. Provides a web interface to draft and publish notes, posts, stories, and media, with GitHub as the source of truth.


## Features

- Create and publish content (notes, posts, stories)
- Draft storage with PostgreSQL
- GitHub Actions–based publishing
- Cloudflare Images & Stream uploads
- GitHub OAuth authentication
- Docker-ready for self-hosting


## Prerequisites

- Node.js 20+ (for local development)
- Docker & Docker Compose (for deployment)
- PostgreSQL 16+ (or use Docker Compose)
- GitHub OAuth App
- Cloudflare Account (for media uploads)

## Quick Start

### 1. Clone and Install

```bash
cd /path/to/site-backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

- **Database**: Set `DATABASE_URL` to your PostgreSQL connection string
- **NextAuth**: Generate a secret with `openssl rand -base64 32`
- **GitHub**: Create an OAuth app at https://github.com/settings/developers
  - Set callback URL to `http://localhost:3000/api/auth/callback/github`
  - Add `repo` and `workflow` scopes
- **Cloudflare**: Get your account ID and API token from Cloudflare dashboard

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Docker Deployment

### Using Docker Compose (Recommended for Homeserver)

1. **Configure Environment**

```bash
cp .env.example .env
# Edit .env with your production values
```

2. **Build and Start Services**

```bash
docker-compose up -d
```

3. **Run Database Migrations**

```bash
docker-compose exec web npx prisma migrate deploy
```

4. **View Logs**

```bash
docker-compose logs -f web
```

The app will be available at http://localhost:3000

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- For Docker: ensure `db` service is healthy

### GitHub OAuth Not Working

- Verify Client ID and Secret in `.env`
- Check callback URL matches GitHub OAuth app settings

### Media Upload Fails

- Verify Cloudflare Account ID and API Token
- Check file size limits (default: 15MB)

## License

This project is for personal use only.
