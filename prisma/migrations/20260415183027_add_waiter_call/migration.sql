-- CreateTable
CREATE TABLE "WaiterCall" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tableNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);
