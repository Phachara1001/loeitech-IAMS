-- DropIndex
DROP INDEX "locations_name_key";

-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "newValue" JSONB,
ADD COLUMN     "oldValue" JSONB;
