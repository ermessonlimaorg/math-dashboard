-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "appUserId" TEXT,
ADD COLUMN     "studentName" TEXT;

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "appUserId" TEXT,
ADD COLUMN     "studentName" TEXT;
