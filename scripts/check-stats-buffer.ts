/**
 * The contract between the counter's two halves.
 *
 * The app writes an event as an R2 key and the monitor, a separate worker built
 * separately, reads it back. Nothing at runtime connects them except the shape
 * of that string — no shared call, no schema, no error if they disagree. A drift
 * here does not crash anything: events are written, nothing parses them, the
 * drain deletes them as unreadable, and the numbers quietly stay at zero.
 *
 * All pure functions, so there is no excuse not to run this before a deploy.
 *
 * Run: npm run check:stats
 */
import {
  STATS_PENDING_PREFIX,
  aggregateStatKeys,
  parseStatEventKey,
  statEventKey,
} from "@/lib/stats-buffer";

let failures = 0;

function check(name: string, passed: boolean, detail?: unknown) {
  if (passed) {
    console.log(`  ok    ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}${detail === undefined ? "" : `  (got ${JSON.stringify(detail)})`}`);
  }
}

console.log("a key survives the round trip");
const open = { day: "2026-09-19", restaurantId: 94, dishId: null };
const tap = { day: "2026-09-19", restaurantId: 94, dishId: 920 };

const openKey = statEventKey(open, "abc");
const tapKey = statEventKey(tap, "def");

check("menu open", JSON.stringify(parseStatEventKey(openKey)) === JSON.stringify(open), parseStatEventKey(openKey));
check("dish tap", JSON.stringify(parseStatEventKey(tapKey)) === JSON.stringify(tap), parseStatEventKey(tapKey));
check("both sit under the drain's prefix", openKey.startsWith(STATS_PENDING_PREFIX) && tapKey.startsWith(STATS_PENDING_PREFIX));

console.log("\na dish can never be mistaken for an open");
check("no dish id spells the marker", parseStatEventKey(statEventKey({ ...tap, dishId: 1 }, "x"))?.dishId === 1);
check("the marker is not a number", parseStatEventKey(openKey)?.dishId === null);

console.log("\nthe unique suffix keeps simultaneous events apart");
check("same event, different keys", statEventKey(tap, "one") !== statEventKey(tap, "two"));
check("...and both still parse to the same event", JSON.stringify(parseStatEventKey(statEventKey(tap, "one"))) === JSON.stringify(parseStatEventKey(statEventKey(tap, "two"))));

console.log("\nnonsense is reported, never guessed at");
for (const bad of [
  "",
  "stats/pending/",
  "snapshots/menu/lumiere.json",
  `${STATS_PENDING_PREFIX}2026-09-19/94/open`,
  `${STATS_PENDING_PREFIX}not-a-date/94/open/x`,
  `${STATS_PENDING_PREFIX}2026-09-19/0/open/x`,
  `${STATS_PENDING_PREFIX}2026-09-19/94/-3/x`,
  `${STATS_PENDING_PREFIX}2026-09-19/94/banana/x`,
]) {
  check(`rejected: ${JSON.stringify(bad)}`, parseStatEventKey(bad) === null, parseStatEventKey(bad));
}

console.log("\nfolding a pile into rows");
const pile = [
  statEventKey(open, "1"),
  statEventKey(open, "2"),
  statEventKey(open, "3"),
  statEventKey(tap, "4"),
  statEventKey({ ...tap, dishId: 921 }, "5"),
  statEventKey({ ...open, day: "2026-09-18" }, "6"),
  "stats/pending/rubbish",
];

const { totals, unreadable } = aggregateStatKeys(pile);

check("four distinct rows", totals.length === 4, totals.length);
check("three opens folded into one row", totals.find((t) => t.dishId === null && t.day === "2026-09-19")?.count === 3);
check("yesterday stays its own row", totals.find((t) => t.day === "2026-09-18")?.count === 1);
check("two dishes stay apart", totals.filter((t) => t.dishId !== null).length === 2);
check("every key is accounted for", totals.reduce((n, t) => n + t.keys.length, 0) + unreadable.length === pile.length);
check("the rubbish is reported, not swallowed", unreadable.length === 1, unreadable);

// ON CONFLICT refuses to touch the same row twice in one statement, so the
// drain's single-statement upsert is only safe while this holds.
console.log("\nno bucket appears twice — the upsert depends on it");
const seen = new Set(totals.map((t) => `${t.day}|${t.restaurantId}|${t.dishId}`));
check("buckets are unique", seen.size === totals.length, { seen: seen.size, totals: totals.length });

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
