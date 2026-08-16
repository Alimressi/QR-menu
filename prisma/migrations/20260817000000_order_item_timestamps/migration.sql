-- When each line of an order appeared, and when it last changed.
--
-- A guest who orders soup, then twenty minutes later adds dessert to the same
-- open order, produced a single row in the panel that looked exactly like a
-- four-item order placed at once. The kitchen could not tell what was new.
--
-- Existing rows are backfilled from their order's createdAt, so history reads as
-- "everything arrived with the original order" — true for anything placed before
-- this column existed, and it keeps old orders from being flagged as topped up.
ALTER TABLE "OrderItem" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "OrderItem" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "OrderItem" i
SET "createdAt" = o."createdAt",
    "updatedAt" = o."createdAt"
FROM "Order" o
WHERE o."id" = i."orderId";
