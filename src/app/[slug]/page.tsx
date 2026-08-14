import { MenuClient } from "@/components/menu-client";
import {
  type MenuRestaurant,
  findFirstDishImage,
  findMenuByRestaurantId,
  findRestaurantBySlug,
} from "@/lib/menu-query";
import { readMenuSnapshot } from "@/lib/menu-snapshot-store";
import { getPublicSettingsFromRaw } from "@/lib/restaurant";
import { SUSPENDED_NOTICE, isRestaurantServable } from "@/lib/subscription";
import type { CategoryWithDishes } from "@/types";
import type { Metadata } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = {
  params: Promise<{ slug: string }>;
};

// Restaurants with a hand-made social banner at /images/og/<slug>.jpg. Add a slug
// here after committing its banner (generated via scripts/make-og-banner.mjs).
const OG_BANNER_SLUGS = new Set(["lumiere"]);

type LoadedMenu = {
  restaurant: MenuRestaurant | null;
  categories: CategoryWithDishes[];
  /** True when the database failed and this came out of the R2 snapshot. */
  degraded: boolean;
};

/**
 * The menu, from the database when it answers and from the last good snapshot
 * when it does not.
 *
 * Reads used to be individually try/caught, which never threw but could return a
 * restaurant with no dishes — a blank menu on a guest's phone. During the 13
 * August 2026 Neon outage that was every scan for five and a half hours. The
 * database is still tried first and always wins; the snapshot only covers the
 * window where there is otherwise nothing to show.
 *
 * This path only ever READS a snapshot. Writing them is the monitor Worker's
 * job — doing it here, even inside waitUntil, cost the app isolate enough memory
 * to get it killed. See src/lib/menu-snapshot.ts.
 */
async function loadMenu(slug: string): Promise<LoadedMenu> {
  // Held outside the try so a restaurant that loaded before the dishes failed is
  // not thrown away — its name and theme are still the right ones to paint with.
  let restaurant: MenuRestaurant | null = null;

  // Was an HTTP self-fetch to /api/categories — a Worker calling itself just to
  // read its own database, which the docs warn is unreliable and which doubled
  // the exposure to the Prisma client bug. Read directly instead.
  try {
    restaurant = await findRestaurantBySlug(slug);

    if (!restaurant) {
      // A genuinely unknown slug, not a failure. Nothing to fall back to.
      return { restaurant: null, categories: [], degraded: false };
    }

    if (!isRestaurantServable(restaurant)) {
      return { restaurant, categories: [], degraded: false };
    }

    const categories = await findMenuByRestaurantId(restaurant.id);

    return { restaurant, categories, degraded: false };
  } catch {
    const snapshot = await readMenuSnapshot(slug);

    if (!snapshot) {
      // MenuClient refetches on the client when this comes back empty.
      return { restaurant, categories: [], degraded: false };
    }

    // Live data beats the snapshot wherever we have it: if the restaurant row
    // was read successfully, only the dishes come from the snapshot.
    const effective = restaurant ?? snapshot.restaurant;

    // The snapshot carries the subscription fields it was saved with, so a
    // tenant switched off since then is still not served a menu.
    if (!isRestaurantServable(effective)) {
      return { restaurant: effective, categories: [], degraded: true };
    }

    return { restaurant: effective, categories: snapshot.categories, degraded: true };
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;

  // Read straight from Prisma — the API self-fetch is unreliable on the Worker and
  // used to return null here, so the tab/preview title fell back to the raw slug
  // ("lumiere" instead of "Lumière").
  const restaurant = await findRestaurantBySlug(slug).catch(() => null);

  if (!restaurant) {
    return { title: slug };
  }

  const settings = getPublicSettingsFromRaw(restaurant.settings);
  const description =
    (typeof settings?.brandSubtitle === "string" && settings.brandSubtitle.trim()) ||
    "Elegant bar & lounge QR menu. Craft cocktails, fine dishes, timeless atmosphere.";

  // Give social crawlers a real preview image. Preference order:
  //   1. a hand-made 1200x630 banner committed at /images/og/<slug>.jpg
  //   2. the restaurant logo
  //   3. the first dish photo
  // Without an og:image LinkedIn refuses to save the link to "Featured".
  let imagePath: string | null = OG_BANNER_SLUGS.has(slug) ? `/images/og/${slug}.jpg` : null;
  imagePath ??= restaurant.logoUrl ?? null;
  if (!imagePath) {
    imagePath = await findFirstDishImage(restaurant.id).catch(() => null);
  }

  // Build the public origin from the incoming request. NEXT_PUBLIC_BASE_URL is
  // inlined at build time (undefined then, since it's only a runtime Worker var),
  // so relying on it here yields http://localhost:3000 in production. These pages
  // are force-dynamic, so the request headers are the reliable source of truth.
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host
    ? `${proto}://${host}`
    : process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const toAbsolute = (path: string) => (path.startsWith("http") ? path : `${origin}${path}`);

  const imageUrl = imagePath ? toAbsolute(imagePath) : null;
  const images = imageUrl ? [{ url: imageUrl, alt: restaurant.name }] : undefined;

  return {
    metadataBase: new URL(origin),
    title: restaurant.name,
    description,
    openGraph: {
      title: restaurant.name,
      description,
      url: `${origin}/${slug}`,
      siteName: restaurant.name,
      type: "website",
      images,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: restaurant.name,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function RestaurantPage({ params }: Params) {
  const { slug } = await params;

  // The restaurant (name + theme) comes straight from the database: a Worker
  // fetching its own URL is unreliable, so the self-fetch used to return null and
  // the page fell back to the dark default theme, flashing before the client
  // corrected it.
  // A cold-start failure here used to throw and render a 500 for the guest.
  // MenuClient already refetches everything on the client when server data is
  // missing, so degrade to that instead of failing the page.
  const { restaurant, categories, degraded } = await loadMenu(slug);

  if (degraded) {
    // Observability is on for this Worker, so this is the trail that says the
    // guests were served from R2 rather than from a working database.
    console.warn(`Served ${slug} from the menu snapshot: the database read failed.`);
  }

  // A lapsed or switched-off tenant serves a notice instead of the menu. The
  // dishes are never fetched, so nothing leaks into the page payload either.
  const suspended = restaurant !== null && !isRestaurantServable(restaurant);
  // Credentials live in the same settings blob and would otherwise be serialized
  // into the client props (visible in the page's RSC payload) — strip them here.
  const settings = getPublicSettingsFromRaw(restaurant?.settings);

  // Paint the page background from the restaurant theme server-side, so the very
  // first frame is the right colour instead of flashing the global dark default.
  const bgFrom = (settings?.backgroundFrom as string) || "#0a0a0a";
  const bgTo = (settings?.backgroundTo as string) || "#0d0d0d";
  const pageBackground = `linear-gradient(180deg, ${bgFrom} 0%, ${bgTo} 100%)`;

  if (suspended) {
    const surface = (settings?.surfaceColor as string) || "#ffffff";
    const border = (settings?.borderColor as string) || "#e5e7eb";
    const text = (settings?.textColor as string) || "#1f2937";
    const muted = (settings?.mutedTextColor as string) || "#6b7280";

    return (
      <div
        className="flex min-h-screen items-center justify-center px-6"
        style={{ background: pageBackground }}
      >
        <style dangerouslySetInnerHTML={{ __html: `body{background:${pageBackground}}` }} />
        <div
          className="w-full max-w-md rounded-2xl border p-8 text-center"
          style={{ background: surface, borderColor: border }}
        >
          <p className="font-serif text-2xl" style={{ color: text }}>
            {restaurant?.name}
          </p>
          {(["az", "ru", "en"] as const).map((language) => (
            <div key={language} className="mt-6 first:mt-8">
              <p className="text-base font-semibold" style={{ color: text }}>
                {SUSPENDED_NOTICE[language].title}
              </p>
              <p className="mt-1 text-sm" style={{ color: muted }}>
                {SUSPENDED_NOTICE[language].body}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: pageBackground }}>
      <style dangerouslySetInnerHTML={{ __html: `body{background:${pageBackground}}` }} />
      <MenuClient
        categories={categories}
        restaurantSlug={slug}
        restaurantId={restaurant?.id}
        settings={settings as Parameters<typeof MenuClient>[0]["settings"]}
        restaurantName={restaurant?.name}
        logoUrl={restaurant?.logoUrl}
      />
    </div>
  );
}
