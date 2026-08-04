-- AlterTable
ALTER TABLE "users" ADD COLUMN     "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "resetPasswordCode" TEXT,
ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3);
