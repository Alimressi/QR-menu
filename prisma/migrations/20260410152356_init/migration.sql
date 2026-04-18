-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dish_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Dish" ("categoryId", "createdAt", "descriptionAz", "descriptionEn", "descriptionRu", "id", "imageUrl", "nameAz", "nameEn", "nameRu", "price", "updatedAt") SELECT "categoryId", "createdAt", "descriptionAz", "descriptionEn", "descriptionRu", "id", "imageUrl", "nameAz", "nameEn", "nameRu", "price", "updatedAt" FROM "Dish";
DROP TABLE "Dish";
ALTER TABLE "new_Dish" RENAME TO "Dish";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
