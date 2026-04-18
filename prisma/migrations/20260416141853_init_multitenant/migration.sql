/*
  Warnings:

  - Added the required column `restaurantId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restaurantId` to the `Dish` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restaurantId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restaurantId` to the `WaiterCall` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Restaurant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nameEn" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameAz" TEXT NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    CONSTRAINT "Category_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("id", "nameAz", "nameEn", "nameRu") SELECT "id", "nameAz", "nameEn", "nameRu" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE INDEX "Category_restaurantId_idx" ON "Category"("restaurantId");
CREATE TABLE "new_Dish" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nameEn" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameAz" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionRu" TEXT NOT NULL,
    "descriptionAz" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePositionX" REAL NOT NULL DEFAULT 50,
    "imagePositionY" REAL NOT NULL DEFAULT 50,
    "categoryId" INTEGER NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dish_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dish_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Dish" ("categoryId", "createdAt", "descriptionAz", "descriptionEn", "descriptionRu", "id", "imagePositionX", "imagePositionY", "imageUrl", "nameAz", "nameEn", "nameRu", "price", "updatedAt") SELECT "categoryId", "createdAt", "descriptionAz", "descriptionEn", "descriptionRu", "id", "imagePositionX", "imagePositionY", "imageUrl", "nameAz", "nameEn", "nameRu", "price", "updatedAt" FROM "Dish";
DROP TABLE "Dish";
ALTER TABLE "new_Dish" RENAME TO "Dish";
CREATE INDEX "Dish_restaurantId_idx" ON "Dish"("restaurantId");
CREATE INDEX "Dish_categoryId_idx" ON "Dish"("categoryId");
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tableNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "total" REAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "checkoutSessionId" TEXT,
    "paymentIntentId" TEXT,
    CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("checkoutSessionId", "createdAt", "id", "paymentIntentId", "status", "tableNumber", "total", "updatedAt") SELECT "checkoutSessionId", "createdAt", "id", "paymentIntentId", "status", "tableNumber", "total", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_restaurantId_idx" ON "Order"("restaurantId");
CREATE TABLE "new_WaiterCall" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tableNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "restaurantId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "WaiterCall_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WaiterCall" ("createdAt", "id", "resolvedAt", "status", "tableNumber") SELECT "createdAt", "id", "resolvedAt", "status", "tableNumber" FROM "WaiterCall";
DROP TABLE "WaiterCall";
ALTER TABLE "new_WaiterCall" RENAME TO "WaiterCall";
CREATE INDEX "WaiterCall_restaurantId_idx" ON "WaiterCall"("restaurantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_slug_key" ON "Restaurant"("slug");
