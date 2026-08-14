import { MenuClient } from "@/components/menu-client";
import { LEGAL } from "@/lib/legal";
import { findFirstRestaurant, findMenuByRestaurantId } from "@/lib/menu-query";
import { getRestaurantSettings } from "@/lib/restaurant";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const defaultRestaurant = await findFirstRestaurant();

  if (!defaultRestaurant) {
    return (
      <div className="min-h-screen p-6 text-gold-100">
        <p>No restaurants found. Create one in super admin panel.</p>
      </div>
    );
  }

  const categories = await findMenuByRestaurantId(defaultRestaurant.id);

  const settings = await getRestaurantSettings(defaultRestaurant.slug);

  // First-frame background from the restaurant theme (avoids the dark default flash).
  const bgFrom = settings?.backgroundFrom || "#0a0a0a";
  const bgTo = settings?.backgroundTo || "#0d0d0d";
  const pageBackground = `linear-gradient(180deg, ${bgFrom} 0%, ${bgTo} 100%)`;

  return (
    <div className="min-h-screen pb-10" style={{ background: pageBackground }}>
      <style dangerouslySetInnerHTML={{ __html: `body{background:${pageBackground}}` }} />
      <MenuClient
        categories={categories}
        restaurantId={defaultRestaurant.id}
        restaurantSlug={defaultRestaurant.slug}
        settings={settings}
        logoUrl={defaultRestaurant.logoUrl}
        restaurantName={defaultRestaurant.name}
      />

      {/*
        The only route that links to the policies, and deliberately so.
        "/" is the address given to Lemon Squeezy, so it is where a reviewer
        lands — and pages nothing links to are pages a reviewer does not find.
        A guest scanning a table QR arrives at /<slug> instead and still sees a
        clean menu with no legal furniture on it.
      */}
      <footer className="mx-auto mt-10 max-w-2xl px-5 text-center text-xs opacity-60">
        <Link href="/terms" className="underline underline-offset-4">
          Terms of Service
        </Link>
        <span aria-hidden> · </span>
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        <p className="mt-2">
          {LEGAL.operatorLegalName} · {LEGAL.contactEmail}
        </p>
      </footer>
    </div>
  );
}
