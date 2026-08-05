-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "departmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "unit" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minThreshold" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" SERIAL NOT NULL,
    "seq" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "brand" TEXT,
    "serialNumber" TEXT,
    "specifications" TEXT,
    "acquiredDate" TIMESTAMP(3) NOT NULL,
    "acquisitionMethod" TEXT NOT NULL,
    "budgetType" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "referenceCode" TEXT,
    "remark" TEXT,
    "image" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "locationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transactions" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "transactionType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "receivedDate" TIMESTAMP(3),
    "acquisitionMethod" TEXT,
    "budgetType" TEXT,
    "operatorName" TEXT,
    "reference" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisitions" (
    "id" SERIAL NOT NULL,
    "reqCode" TEXT NOT NULL,
    "requesterId" INTEGER,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisition_items" (
    "id" SERIAL NOT NULL,
    "requisitionId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "requestedQty" INTEGER NOT NULL,
    "approvedQty" INTEGER,
    "stockTxId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requisition_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "items_sku_key" ON "items"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "assets_seq_key" ON "assets"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_key" ON "locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "requisitions_reqCode_key" ON "requisitions"("reqCode");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition_items" ADD CONSTRAINT "requisition_items_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition_items" ADD CONSTRAINT "requisition_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition_items" ADD CONSTRAINT "requisition_items_stockTxId_fkey" FOREIGN KEY ("stockTxId") REFERENCES "stock_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
