import { getSession } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

// Batch translation for the menu importer.
//
// A 60-dish menu needs names and descriptions in three languages — around 240
// strings. One AI call per string would blow the Worker's subrequest limit, so
// the browser sends them in chunks and each chunk is one call.
//
// This never fails the import: if the model is unavailable, slow, or returns
// something unexpected, the originals come back unchanged and the dish simply
// carries the same text in all three languages — which is what the menu already
// does for single-language restaurants.

// Tried in order. The first is much better at Azerbaijani; the second is the
// cheaper fallback when the daily Workers AI allowance is spent or the larger
// model is busy. Verified against `wrangler ai models` — an unavailable name
// would fail silently here and simply leave the menu untranslated.
const MODELS = ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct-fp8"];
const MAX_ITEMS = 25;

const LANGUAGE_NAMES: Record<string, string> = {
  az: "Azerbaijani",
  ru: "Russian",
  en: "English",
};

type AiRunner = {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
};

function extractText(response: unknown): string {
  if (typeof response === "string") {
    return response;
  }

  const asRecord = response as { response?: unknown; result?: { response?: unknown } };

  if (typeof asRecord?.response === "string") {
    return asRecord.response;
  }

  if (typeof asRecord?.result?.response === "string") {
    return asRecord.result.response;
  }

  return "";
}

/** Pull the JSON array out of a model reply that may be wrapped in prose or fences. */
function parseStringArray(raw: string, expectedLength: number): string[] | null {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));

    if (!Array.isArray(parsed) || parsed.length !== expectedLength) {
      return null;
    }

    if (!parsed.every((item) => typeof item === "string")) {
      return null;
    }

    return parsed as string[];
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { items?: unknown; from?: unknown; to?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const items = Array.isArray(body?.items)
    ? (body.items as unknown[]).map((item) => (typeof item === "string" ? item : ""))
    : [];
  const from = String(body?.from ?? "");
  const to = String(body?.to ?? "");

  if (items.length === 0) {
    return NextResponse.json({ translations: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  if (items.length > MAX_ITEMS) {
    return NextResponse.json({ error: `Send at most ${MAX_ITEMS} items per call.` }, { status: 400 });
  }

  if (!LANGUAGE_NAMES[from] || !LANGUAGE_NAMES[to]) {
    return NextResponse.json({ error: "Unknown language." }, { status: 400 });
  }

  // Nothing to do — hand the input straight back rather than paying for a call.
  const unchanged = () =>
    NextResponse.json({ translations: items, translated: false }, {
      headers: { "Cache-Control": "no-store" },
    });

  if (from === to || items.every((item) => !item.trim())) {
    return unchanged();
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const ai = (env as unknown as { AI?: AiRunner }).AI;

    if (!ai) {
      return unchanged();
    }

    const input = {
      messages: [
        {
          role: "system",
          content:
            "You translate restaurant menu text. Translate each item from " +
            `${LANGUAGE_NAMES[from]} to ${LANGUAGE_NAMES[to]}. ` +
            "Keep dish names as short names, never add explanations or notes. " +
            "Keep numbers, weights and units exactly as they are. " +
            "Leave proper nouns and brand names untranslated. " +
            "Reply with ONLY a JSON array of strings, the same length and order as the input.",
        },
        { role: "user", content: JSON.stringify(items) },
      ],
      max_tokens: 2048,
      temperature: 0.1,
    };

    let translations: string[] | null = null;

    for (const model of MODELS) {
      try {
        translations = parseStringArray(extractText(await ai.run(model, input)), items.length);
      } catch {
        translations = null;
      }

      if (translations) {
        break;
      }
    }

    if (!translations) {
      return unchanged();
    }

    // An empty input stays empty; a model that returned nothing for a real string
    // falls back to the original rather than blanking a dish name.
    const merged = translations.map((translated, index) => {
      const original = items[index];
      if (!original.trim()) {
        return original;
      }
      return translated.trim() || original;
    });

    return NextResponse.json(
      { translations: merged, translated: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return unchanged();
  }
}
