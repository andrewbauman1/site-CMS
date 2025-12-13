/*
  Warnings:

  - You are about to drop the `StoryFeed` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StoryFeed" DROP CONSTRAINT "StoryFeed_userId_fkey";

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "hiddenStoryFeeds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "StoryFeed";
