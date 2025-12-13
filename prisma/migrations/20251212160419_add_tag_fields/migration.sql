-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "noteTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "postTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "storyTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
