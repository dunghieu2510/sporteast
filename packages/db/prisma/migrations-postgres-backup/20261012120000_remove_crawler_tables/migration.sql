-- DropForeignKey
ALTER TABLE "MatchSource" DROP CONSTRAINT "MatchSource_matchId_fkey";

-- DropTable
DROP TABLE "CrawlLog";

-- DropTable
DROP TABLE "MatchSource";

