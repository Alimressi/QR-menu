import { LegalPage, LegalSection } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  // The root layout appends " | QR Menu", so don't repeat the name here.
  title: "Terms of Service",
  description: `The agreement between ${LEGAL.serviceName} and the venues it serves.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={
        <>
          <p>
            These terms are the agreement between {LEGAL.operatorLegalName}{" "}
            (&ldquo;we&rdquo;, &ldquo;us&rdquo;), working in {LEGAL.serviceArea},{" "}
            {LEGAL.operatorCountry}, and the venue we build a menu for
            (&ldquo;you&rdquo;). By using the service, you accept them.
          </p>
          <p>
            {LEGAL.serviceName} is a hosted digital menu. We publish your menu at a web address your
            guests reach by scanning a QR code at the table.
          </p>
          <p>
            The service is offered to venues in {LEGAL.serviceArea}, agreed in person and invoiced
            directly. There is no online sign-up and nothing to buy on this website.
          </p>
        </>
      }
    >
      <LegalSection title="1. What we provide">
        <p>
          A hosted menu page for your venue, an admin area for your staff, printable QR codes for
          your tables, and — where you enable them — table ordering and waiter-call features.
        </p>
        <p>
          Unless you have agreed otherwise with us in writing, we build and update your menu on your
          behalf as part of the monthly fee. Turnaround for routine changes is normally one business
          day.
        </p>
      </LegalSection>

      <LegalSection title="2. Your account">
        <p>
          We issue login credentials for your venue. You are responsible for keeping them
          confidential and for everything done through your account. Tell us promptly at{" "}
          {LEGAL.contactEmail} if you believe they have been compromised, and we will reset them.
        </p>
      </LegalSection>

      <LegalSection title="3. Fees">
        <p>
          A one-off setup fee and a monthly fee, both quoted to you in writing before any work
          starts. Prices are exclusive of any taxes that may apply.
        </p>
        <p>
          The monthly fee continues until either of us ends the agreement. Nothing renews
          automatically and no payment is ever taken without you making it: each month is invoiced
          and paid separately.
        </p>
      </LegalSection>

      <LegalSection title="4. Payment">
        <p>
          You pay us directly, by the method we agree — bank transfer or cash. There is no checkout
          on this website and no card is ever entered anywhere in this service. We do not receive,
          process or store card details of any kind.
        </p>
      </LegalSection>

      <LegalSection title="5. Refunds">
        <p>
          If the service does not work as described and we cannot fix it within a reasonable time,
          contact us and we will refund the month in question.
        </p>
        <p>
          The setup fee covers work already performed — entering your menu, translating it, styling
          the page and producing your QR codes — and is refundable only where that work has not yet
          been done.
        </p>
      </LegalSection>

      <LegalSection title="6. Late or unpaid invoices">
        <p>
          If an invoice goes unpaid we will contact you. If it stays unpaid, we may suspend your
          menu: guests then see a short notice instead of your dishes.
        </p>
        <p>
          Suspension does not delete anything. Your menu, photos, styling and account remain intact
          and are restored as soon as payment is received.
        </p>
      </LegalSection>

      <LegalSection title="7. Your content">
        <p>
          Your menu text, prices, photos, logo and brand remain yours. You grant us only the
          permission needed to host, display, translate and back up that content in order to run the
          service.
        </p>
        <p>
          You confirm you have the right to use everything you supply — in particular photographs.
          Where we source stock photography on your behalf, we use images licensed for commercial
          use.
        </p>
      </LegalSection>

      <LegalSection title="8. Acceptable use">
        <p>
          Do not use the service to publish anything unlawful, misleading or infringing, to attempt
          to gain access to another venue&rsquo;s data, or to interfere with the operation of the
          service. We may suspend an account that does.
        </p>
      </LegalSection>

      <LegalSection title="9. Availability">
        <p>
          We aim to keep the service continuously available and we monitor it, but we do not
          guarantee uninterrupted operation. Access may be interrupted by maintenance, by faults, or
          by failures at the infrastructure providers we rely on.
        </p>
        <p>
          You do not pay for days on which your menu was unavailable. Where a fault puts it out of
          service for a day or more, we credit those days against your next invoice. You do not
          need to ask: we monitor availability ourselves and apply the credit.
        </p>
      </LegalSection>

      <LegalSection title="10. Liability">
        <p>
          We are liable for direct losses caused by our failure to provide the service with
          reasonable care, up to the total amount you paid us in the twelve months before the claim.
        </p>
        <p>
          We are not liable for lost profits, lost custom or other indirect losses. Nothing in these
          terms excludes liability that cannot lawfully be excluded.
        </p>
      </LegalSection>

      <LegalSection title="11. Ending the agreement">
        <p>
          You may stop at any time, with the current month being the last you pay for. We may end
          the agreement with 30 days&rsquo; notice, or immediately if you materially breach these
          terms.
        </p>
        <p>
          On request at any time before or within {LEGAL.dataRetentionDays} days of the end of the
          agreement, we will send you an export of your menu data. After that period we delete it.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to these terms">
        <p>
          We may update these terms. If a change materially affects you we will give at least 30
          days&rsquo; notice by email before it takes effect, and you may end the agreement if you
          do not accept it. Price changes always follow that notice period.
        </p>
      </LegalSection>

      <LegalSection title="13. Governing law">
        <p>
          These terms are governed by the law of {LEGAL.operatorCountry}, and any dispute belongs to
          the courts of {LEGAL.serviceArea}.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact">
        <p>
          {LEGAL.operatorLegalName}, {LEGAL.operatorAddress}. Email {LEGAL.contactEmail}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
