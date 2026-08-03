/*
  Warnings:

  - You are about to drop the column `assetCode` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseDate` on the `assets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[seq]` on the table `assets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `acquiredDate` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `acquisitionMethod` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `budgetType` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seq` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `assets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_itemId_fkey";

-- DropIndex
DROP INDEX "assets_assetCode_key";

-- AlterTable
ALTER TABLE "assets" DROP COLUMN "assetCode",
DROP COLUMN "itemId",
DROP COLUMN "price",
DROP COLUMN "purchaseDate",
ADD COLUMN     "acquiredDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "acquisitionMethod" TEXT NOT NULL,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "budgetType" TEXT NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "referenceCode" TEXT,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "seq" TEXT NOT NULL,
ADD COLUMN     "serialNumber" TEXT,
ADD COLUMN     "specifications" TEXT,
ADD COLUMN     "unitPrice" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'Active';

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "minThreshold" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "assets_seq_key" ON "assets"("seq");
