-- AlterTable
ALTER TABLE "Question"
ADD COLUMN     "aiDifficulty" "Difficulty",
ADD COLUMN     "aiScore" INTEGER,
ADD COLUMN     "aiTopic" TEXT,
ADD COLUMN     "lastAiEvaluatedAt" TIMESTAMP(3),
ALTER COLUMN   "topic" DROP NOT NULL,
ALTER COLUMN   "difficulty" DROP NOT NULL;

-- Indexes for AI fields
CREATE INDEX "Question_aiTopic_idx" ON "Question"("aiTopic");
CREATE INDEX "Question_aiDifficulty_idx" ON "Question"("aiDifficulty");
