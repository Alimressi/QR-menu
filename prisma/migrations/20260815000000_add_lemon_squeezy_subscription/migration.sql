-- Links a tenant to its Lemon Squeezy subscription.
--
-- The checkout carries restaurant_id as custom data, so the FIRST webhook can
-- always find the tenant. These columns exist for every webhook after it: if
-- custom data is ever absent on a renewal or a payment failure, the subscription
-- id is still a reliable way back to the restaurant. Without that, a renewal
-- nobody could match would leave a paying restaurant sliding into past_due.
--
-- Both are additive and nullable: existing restaurants keep working untouched,
-- and a restaurant billed outside Lemon Squeezy simply leaves them empty.
ALTER TABLE "Restaurant" ADD COLUMN "lemonSqueezySubscriptionId" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN "lemonSqueezyCustomerId" TEXT;

-- Every webhook looks a restaurant up by subscription id; without this the
-- lookup is a sequential scan on a table that only ever grows.
CREATE UNIQUE INDEX "Restaurant_lemonSqueezySubscriptionId_key"
  ON "Restaurant"("lemonSqueezySubscriptionId");
