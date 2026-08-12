-- Stop list flag. Additive and defaulted, so every existing dish stays
-- available and no existing query changes meaning.
ALTER TABLE "Dish" ADD COLUMN "soldOut" BOOLEAN NOT NULL DEFAULT false;
