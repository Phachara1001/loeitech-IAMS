-- CreateTable
CREATE TABLE "borrow_transactions" (
    "id" SERIAL NOT NULL,
    "borrowCode" TEXT NOT NULL,
    "assetId" INTEGER NOT NULL,
    "borrowerName" TEXT NOT NULL,
    "borrowerDept" TEXT NOT NULL,
    "borrowDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "returnedTo" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrow_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_requests" (
    "id" SERIAL NOT NULL,
    "repairCode" TEXT NOT NULL,
    "assetId" INTEGER NOT NULL,
    "reporterName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "repairCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "finishDate" TIMESTAMP(3),
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "borrow_transactions_borrowCode_key" ON "borrow_transactions"("borrowCode");

-- CreateIndex
CREATE UNIQUE INDEX "repair_requests_repairCode_key" ON "repair_requests"("repairCode");

-- AddForeignKey
ALTER TABLE "borrow_transactions" ADD CONSTRAINT "borrow_transactions_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_requests" ADD CONSTRAINT "repair_requests_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
