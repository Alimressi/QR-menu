import { LEGAL } from "@/lib/legal";
import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

// Inter (with latin-ext) has a clean, evenly-weighted Azerbaijani schwa (Ə/ə) —
// Manrope's read as too heavy. Keeps the --font-manrope var name so the rest of
// the CSS is unchanged.
const manrope = Inter({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  // Lets relative og:image paths resolve to absolute URLs so social crawlers
  // (LinkedIn, WhatsApp, Telegram) can actually fetch the preview image.
  //
  // Taken from LEGAL.siteUrl rather than NEXT_PUBLIC_BASE_URL, which Next inlines
  // at build time from `.env` — that is `http://localhost:3000`, and it was
  // shipping to production, pointing every social preview at a machine only
  // Imran can reach. This export is static so it cannot read request headers the
  // way the menu pages do; a constant in the repo is the honest substitute, and
  // it is already on the list of places to change when the domain lands.
  metadataBase: new URL(LEGAL.siteUrl),
  title: {
    default: "QR Menu",
    template: "%s | QR Menu",
  },
  description: "Elegant bar & lounge QR menu. Craft cocktails, fine dishes, timeless atmosphere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
