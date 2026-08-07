/*
  Warnings:

  - You are about to drop the `borrow_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `repair_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "borrow_transactions" DROP CONSTRAINT "borrow_transactions_assetId_fkey";

-- DropForeignKey
ALTER TABLE "repair_requests" DROP CONSTRAINT "repair_requests_assetId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "position" TEXT;

-- DropTable
DROP TABLE "borrow_transactions";

-- DropTable
DROP TABLE "repair_requests";
