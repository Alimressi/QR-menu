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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
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
