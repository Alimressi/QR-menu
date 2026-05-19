-- CreateTable
CREATE TABLE "public"."Restaurant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "settings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" SERIAL NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameAz" TEXT NOT NULL,
    "restaurantId" INTEGER NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Dish" (
    "id" SERIAL NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameAz" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionRu" TEXT NOT NULL,
    "descriptionAz" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePositionX" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "imagePositionY" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "categoryId" INTEGER NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DishOption" (
    "id" SERIAL NOT NULL,
    "dishId" INTEGER NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameAz" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DishOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" SERIAL NOT NULL,
    "tableNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "total" DOUBLE PRECISION NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "checkoutSessionId" TEXT,
    "paymentIntentId" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "dishId" INTEGER NOT NULL,
    "optionId" INTEGER,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameAz" TEXT NOT NULL,
    "optionNameEn" TEXT,
    "optionNameRu" TEXT,
    "optionNameAz" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WaiterCall" (
    "id" SERIAL NOT NULL,
    "tableNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "restaurantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "WaiterCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_slug_key" ON "public"."Restaurant"("slug");

-- CreateIndex
CREATE INDEX "Category_restaurantId_idx" ON "public"."Category"("restaurantId");

-- CreateIndex
CREATE INDEX "Dish_restaurantId_idx" ON "public"."Dish"("restaurantId");

-- CreateIndex
CREATE INDEX "Dish_categoryId_idx" ON "public"."Dish"("categoryId");

-- CreateIndex
CREATE INDEX "Order_restaurantId_idx" ON "public"."Order"("restaurantId");

-- CreateIndex
CREATE INDEX "WaiterCall_restaurantId_idx" ON "public"."WaiterCall"("restaurantId");

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dish" ADD CONSTRAINT "Dish_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dish" ADD CONSTRAINT "Dish_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DishOption" ADD CONSTRAINT "DishOption_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "public"."Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "public"."Dish"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "public"."DishOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WaiterCall" ADD CONSTRAINT "WaiterCall_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
