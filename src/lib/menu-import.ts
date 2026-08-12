// Turn a menu pasted as plain text into categories and dishes.
//
// Onboarding a restaurant used to mean writing a bespoke script per client
// (scripts/import-ninelives-full-menu.ts is 1545 lines). That is the single
// biggest cost per client, so this parses whatever the restaurant sends —
// copied out of a PDF, a Word file, or a phone photo run through OCR.
//
// The parser is deliberately dumb and predictable rather than clever: it is
// always followed by an editable preview, so a wrong guess costs one click to
// fix, while an unpredictable parser would cost trust in the whole import.

export type ParsedDish = {
  name: string;
  description: string;
  price: number;
};

export type ParsedCategory = {
  name: string;
  dishes: ParsedDish[];
};

export type ParseResult = {
  categories: ParsedCategory[];
  /** Lines that looked like neither a dish nor a heading, reported to the user. */
  skipped: string[];
};

const DEFAULT_CATEGORY = "Menu";

// A trailing price: "14", "14.00", "14,50", "₼14", "$14.00", "14 AZN", "12.00 ₼".
// Dot leaders ("Caesar Salad ....... 14.00") are stripped before this runs.
const PRICE_AT_END =
  /(?:^|[\s.·—–-])(?:[$€₼]\s*)?(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:₼|manat|man\.?|azn|usd|\$|eur|€|₽|руб\.?)?\s*$/i;

// Name and description on one line, separated by an em dash, en dash, hyphen,
// middle dot, colon or a tab — the separators menus actually use.
const NAME_DESCRIPTION_SPLIT = /\s+[—–·]\s+|\t+|\s+-\s+|\s*:\s+/;

function stripDotLeaders(line: string) {
  // "Caesar Salad .......... 14.00" -> "Caesar Salad 14.00"
  return line.replace(/[.·_]{3,}/g, " ");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/** Strip trailing separators a price left behind: "Caesar Salad —" -> "Caesar Salad". */
function trimTrailingSeparators(value: string) {
  return value.replace(/[\s.·—–:-]+$/g, "").trim();
}

function parsePrice(raw: string): number {
  return Number(raw.replace(",", "."));
}

/**
 * A heading is a line with no price. Extra guards keep a stray sentence from
 * silently becoming a category and swallowing the dishes that follow it.
 */
function looksLikeHeading(line: string) {
  if (line.length > 60) {
    return false;
  }

  // "SALADS:" and "SALADS" are both headings; a line ending in a full stop is
  // prose, not a heading.
  if (line.endsWith(".") || line.endsWith("!") || line.endsWith("?")) {
    return false;
  }

  return true;
}

export function parseMenuText(input: string): ParseResult {
  const categories: ParsedCategory[] = [];
  const skipped: string[] = [];

  let current: ParsedCategory | null = null;

  for (const rawLine of input.split(/\r?\n/)) {
    const line = normalizeWhitespace(stripDotLeaders(rawLine));

    if (!line) {
      continue;
    }

    const priceMatch = line.match(PRICE_AT_END);

    if (!priceMatch) {
      if (looksLikeHeading(line)) {
        current = { name: trimTrailingSeparators(line) || DEFAULT_CATEGORY, dishes: [] };
        categories.push(current);
      } else {
        skipped.push(line);
      }
      continue;
    }

    const price = parsePrice(priceMatch[1]);
    const withoutPrice = trimTrailingSeparators(line.slice(0, priceMatch.index ?? 0));

    // A bare number on its own line is not a dish.
    if (!withoutPrice || !Number.isFinite(price)) {
      skipped.push(line);
      continue;
    }

    const [namePart, ...descriptionParts] = withoutPrice.split(NAME_DESCRIPTION_SPLIT);
    const name = trimTrailingSeparators(namePart);

    if (!name) {
      skipped.push(line);
      continue;
    }

    if (!current) {
      // Dishes before any heading still need somewhere to go.
      current = { name: DEFAULT_CATEGORY, dishes: [] };
      categories.push(current);
    }

    current.dishes.push({
      name,
      description: normalizeWhitespace(descriptionParts.join(" ")),
      price,
    });
  }

  return {
    // A heading with nothing under it is noise (a page title, "MENU", a phone
    // number) rather than a real category.
    categories: categories.filter((category) => category.dishes.length > 0),
    skipped,
  };
}

/** Totals for the confirmation step, so nothing is created blind. */
export function summarizeParse(result: ParseResult) {
  const dishCount = result.categories.reduce((sum, c) => sum + c.dishes.length, 0);
  const prices = result.categories.flatMap((c) => c.dishes.map((d) => d.price));

  return {
    categoryCount: result.categories.length,
    dishCount,
    skippedCount: result.skipped.length,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
  };
}
