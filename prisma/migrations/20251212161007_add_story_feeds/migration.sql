-- CreateTable
CREATE TABLE "StoryFeed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryFeed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoryFeed_userId_idx" ON "StoryFeed"("userId");

-- AddForeignKey
ALTER TABLE "StoryFeed" ADD CONSTRAINT "StoryFeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
