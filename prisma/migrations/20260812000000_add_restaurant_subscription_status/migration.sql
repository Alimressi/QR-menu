-- Subscription state for each tenant.
--
-- Existing restaurants become 'active' so their menus keep serving exactly as
-- before; only newly created ones start on a trial. Both columns are additive:
-- no data is rewritten and no existing query changes meaning.
ALTER TABLE "Restaurant" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Restaurant" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
