-- Categories used to come out in whatever order they were created, because the
-- menu read them ORDER BY "id". That is fine until someone wants the sets at the
-- bottom, and then there is no integer left between two neighbours to put them.
--
-- sortOrder is backfilled from the id so every existing menu keeps exactly the
-- order it has today; only a category someone deliberately moves changes place.
ALTER TABLE "Category" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
UPDATE "Category" SET "sortOrder" = "id";
