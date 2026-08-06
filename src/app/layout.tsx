import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  // latin-ext carries the Azerbaijani letters (Ə, ə, ğ, ş…); without it they fall
  // back to a system font and look mismatched (e.g. the "Ə" in "Əlavə et").
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
