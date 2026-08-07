/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `departments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[building,name]` on the table `locations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `departments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "building" TEXT,
ADD COLUMN     "type" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "locations_building_name_key" ON "locations"("building", "name");
