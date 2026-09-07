-- Statistics can only be written for today.
--
-- On 7 September the tables held five days of traffic that predated the counter
-- being deployed: 799 menu opens and 385 dish taps for days on which nothing was
-- being counted. The application cannot produce that — /api/stats writes the
-- current UTC date and nothing else — so it arrived over a direct connection.
--
-- The numbers were harmless. What they showed is not: a fabricated history is
-- indistinguishable from a real one a month later, and these are the numbers a
-- restaurant owner is shown to justify what they pay. So the rule moves into the
-- database, where it holds for every connection rather than only for the code
-- that is supposed to be the only writer.
--
-- Yesterday is allowed: a request that starts at 23:59:59 UTC can land after
-- midnight, and a counter that rejects it would lose a real visit to a clock.
CREATE OR REPLACE FUNCTION reject_backdated_stats() RETURNS trigger AS $$
BEGIN
  IF NEW."day"::date < (CURRENT_DATE - INTERVAL '1 day') THEN
    RAISE EXCEPTION 'Refusing to write statistics for %, which is in the past. Counts are only ever written for the current day.', NEW."day";
  END IF;

  IF NEW."day"::date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Refusing to write statistics for %, which is in the future.', NEW."day";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER menu_open_stat_no_backdating
  BEFORE INSERT OR UPDATE ON "MenuOpenStat"
  FOR EACH ROW EXECUTE FUNCTION reject_backdated_stats();

CREATE TRIGGER dish_view_stat_no_backdating
  BEFORE INSERT OR UPDATE ON "DishViewStat"
  FOR EACH ROW EXECUTE FUNCTION reject_backdated_stats();
