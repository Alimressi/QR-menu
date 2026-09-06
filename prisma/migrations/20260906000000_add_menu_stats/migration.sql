-- Menu opens and dish taps, counted per day rather than logged per visit.
-- The question is always "how many this week"; a daily bucket answers it with a
-- sum over seven rows instead of a scan over thousands, and the whole history
-- of every restaurant stays smaller than a single dish photograph.
CREATE TABLE "MenuOpenStat" (
    "restaurantId" INTEGER NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MenuOpenStat_pkey" PRIMARY KEY ("restaurantId","day")
);

CREATE TABLE "DishViewStat" (
    "restaurantId" INTEGER NOT NULL,
    "dishId" INTEGER NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DishViewStat_pkey" PRIMARY KEY ("restaurantId","dishId","day")
);

CREATE INDEX "MenuOpenStat_restaurantId_day_idx" ON "MenuOpenStat"("restaurantId", "day");
CREATE INDEX "DishViewStat_restaurantId_day_idx" ON "DishViewStat"("restaurantId", "day");

ALTER TABLE "MenuOpenStat" ADD CONSTRAINT "MenuOpenStat_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DishViewStat" ADD CONSTRAINT "DishViewStat_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DishViewStat" ADD CONSTRAINT "DishViewStat_dishId_fkey"
    FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;
