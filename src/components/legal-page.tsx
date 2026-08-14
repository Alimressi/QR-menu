import { LEGAL } from "@/lib/legal";
import Link from "next/link";
import type { ReactNode } from "react";

// Shared shell for the Terms and Privacy pages.
//
// Deliberately neutral: neither the per-restaurant menu palette nor the red neon
// admin theme. These pages are read by payment providers during review and by
// restaurant owners deciding whether to trust the service, so plain and legible
// beats branded.

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-neutral-700">{children}</div>
    </section>
  );
}

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white px-5 py-12 text-neutral-800">
      <article className="mx-auto w-full max-w-2xl">
        <Link href="/" className="text-sm text-neutral-500 underline underline-offset-4">
          {LEGAL.serviceName}
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-900">{title}</h1>

        <p className="mt-2 text-sm text-neutral-500">Last updated: {LEGAL.lastUpdated}</p>

        <div className="mt-6 space-y-3 text-[15px] leading-relaxed text-neutral-700">{intro}</div>

        {children}

        <footer className="mt-12 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
          <p>
            {LEGAL.operatorLegalName}
            {LEGAL.operatorAddress ? ` · ${LEGAL.operatorAddress}` : ""}
          </p>
          <p className="mt-1">
            Questions:{" "}
            <a className="underline underline-offset-4" href={`mailto:${LEGAL.contactEmail}`}>
              {LEGAL.contactEmail}
            </a>
          </p>
          <p className="mt-4">
            <Link className="underline underline-offset-4" href="/terms">
              Terms of Service
            </Link>
            {" · "}
            <Link className="underline underline-offset-4" href="/privacy">
              Privacy Policy
            </Link>
          </p>
        </footer>
      </article>
    </main>
  );
}
