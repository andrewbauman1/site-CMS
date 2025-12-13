-- Create NextAuth tables manually
-- Run this once to initialize the database

-- Create enums (only if they don't exist)
DO $$ BEGIN
  CREATE TYPE "TokenType" AS ENUM ('OAUTH', 'PAT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DraftType" AS ENUM ('NOTE', 'POST', 'STORY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT,
  "email" TEXT,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  "githubLogin" TEXT,
  "githubToken" TEXT,
  "tokenType" "TokenType" NOT NULL DEFAULT 'OAUTH',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("identifier", "token")
);

CREATE TABLE IF NOT EXISTS "Draft" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" "DraftType" NOT NULL,
  "title" TEXT,
  "content" TEXT NOT NULL,
  "tags" TEXT,
  "language" TEXT,
  "location" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Settings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "theme" TEXT NOT NULL DEFAULT 'system',
  "githubOwner" TEXT,
  "githubRepo" TEXT,
  "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
  "defaultLayout" TEXT NOT NULL DEFAULT 'default',
  "autoSaveEnabled" BOOLEAN NOT NULL DEFAULT true,
  "noteTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "postTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "storyTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "hiddenStoryFeeds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Migrate existing tables (add missing columns)
DO $$ BEGIN
  -- Add missing columns to User table if they don't exist
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "githubLogin" TEXT;
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "githubToken" TEXT;
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenType" "TokenType" DEFAULT 'OAUTH';
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

  -- Update tokenType to NOT NULL with default after adding it
  ALTER TABLE "User" ALTER COLUMN "tokenType" SET NOT NULL;
  ALTER TABLE "User" ALTER COLUMN "tokenType" SET DEFAULT 'OAUTH';
  ALTER TABLE "User" ALTER COLUMN "createdAt" SET NOT NULL;
  ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;

  -- Add missing columns to Draft table if they don't exist
  ALTER TABLE "Draft" ADD COLUMN IF NOT EXISTS "tags" TEXT;
  ALTER TABLE "Draft" ADD COLUMN IF NOT EXISTS "language" TEXT;
  ALTER TABLE "Draft" ADD COLUMN IF NOT EXISTS "location" TEXT;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_githubLogin_key" ON "User"("githubLogin");
CREATE INDEX IF NOT EXISTS "Draft_userId_updatedAt_idx" ON "Draft"("userId", "updatedAt");

-- Add foreign key constraints (ignore if they already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Account_userId_fkey') THEN
    ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Session_userId_fkey') THEN
    ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Draft_userId_fkey') THEN
    ALTER TABLE "Draft" ADD CONSTRAINT "Draft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Settings_userId_fkey') THEN
    ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
