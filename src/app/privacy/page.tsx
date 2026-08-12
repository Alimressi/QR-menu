import { LegalPage, LegalSection } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `What data ${LEGAL.serviceName} collects from restaurants and their guests, and what it does not.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <>
          <p>
            This policy explains what {LEGAL.serviceName}, operated by {LEGAL.operatorLegalName} in{" "}
            {LEGAL.operatorCountry}, does with personal data. It covers both the restaurants that
            subscribe and the guests who open a menu.
          </p>
          <p>
            The short version: a guest can read a menu, and order from it, without giving us a name,
            an email address or an account. We run no advertising or analytics trackers of any kind.
          </p>
        </>
      }
    >
      <LegalSection title="Guests scanning a menu">
        <p>We do not ask a guest for any personal detail, and there is nothing to sign up for.</p>
        <p>When a guest places an order or calls a waiter, we store:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>the table number printed on the QR code they scanned</li>
          <li>the dishes ordered, quantities and the total</li>
          <li>the time of the order and its status</li>
        </ul>
        <p>
          That information exists so the restaurant can bring the right food to the right table. It
          is not linked to any identity, and we make no attempt to recognise a returning guest.
        </p>
        <p>
          One item is stored in the guest&rsquo;s browser: a key named{" "}
          <code className="rounded bg-neutral-100 px-1">qr-table-session</code>, holding the table
          they scanned so their basket survives a page reload. It is not a tracking cookie, it is
          not readable by anyone else, and clearing browser data removes it.
        </p>
        <p className="font-medium text-neutral-900">
          We do not use advertising cookies, analytics, tracking pixels, session recording or
          third-party scripts of any kind on the menu pages.
        </p>
      </LegalSection>

      <LegalSection title="Restaurants that subscribe">
        <p>To provide the service we hold:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>your venue name, address, phone number and social links, where you supply them</li>
          <li>a contact email address</li>
          <li>an admin login, with the password stored only as an irreversible hash</li>
          <li>your menu content: dishes, prices, descriptions, photos and styling</li>
          <li>your subscription status and, if you had one, when your trial ends</li>
        </ul>
        <p>
          Payment details are handled entirely by {LEGAL.paymentProcessor}. We receive confirmation
          that a payment succeeded or failed. We never see or store card numbers.
        </p>
      </LegalSection>

      <LegalSection title="Why we hold it">
        <p>
          To publish your menu, to let your staff sign in, to take payment for the subscription, and
          to contact you about your account or a service problem. We do not use your data, or your
          guests&rsquo; orders, for anything else, and we do not sell or share it for advertising.
        </p>
      </LegalSection>

      <LegalSection title="Who processes it for us">
        <p>We rely on a small number of providers, each acting only on our instructions:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Cloudflare</strong> — hosting, content delivery, and storage of dish photos
          </li>
          <li>
            <strong>Neon</strong> — the database holding menus and orders
          </li>
          <li>
            <strong>{LEGAL.paymentProcessor}</strong> — subscription payments, as merchant of record
          </li>
          <li>
            <strong>Cloudflare Workers AI</strong> — translating menu text between languages when a
            menu is imported. Menu text is sent for translation; guest data never is.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          Menu content is kept for as long as your subscription is active. If it ends, we keep your
          data for {LEGAL.dataRetentionDays} days so you can ask for an export or resume, then
          delete it.
        </p>
        <p>
          Orders and waiter calls are operational records, kept for as long as the restaurant needs
          them and deleted with the account.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          Traffic is encrypted in transit. Admin passwords are stored as hashes and cannot be read
          back, including by us. Each venue&rsquo;s data is separated so one restaurant&rsquo;s
          account cannot reach another&rsquo;s. Sessions are cryptographically signed and expire.
        </p>
        <p>
          No system is immune to failure. If a breach affects your data we will tell you promptly
          and describe what happened.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          You may ask us for a copy of the data we hold about you, ask us to correct it, or ask us
          to delete it. Write to {LEGAL.contactEmail} and we will respond within 30 days.
        </p>
        <p>
          Depending on where you live you may have further rights — for example under the GDPR in
          Europe, or under state privacy laws in the United States including the right to know what
          is collected and to have it deleted. We apply the protections described here to everyone,
          wherever they are.
        </p>
        <p>
          Because we hold no identifying information about guests, we normally cannot connect a
          request to a specific guest&rsquo;s order.
        </p>
      </LegalSection>

      <LegalSection title="International transfers">
        <p>
          We operate from {LEGAL.operatorCountry}, and our providers run globally distributed
          infrastructure, so data may be processed outside your country. We use providers that offer
          appropriate safeguards for such transfers.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          The service is sold to businesses and is not directed at children. We do not knowingly
          collect personal data from anyone under 16.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this policy. The date at the top shows when it last changed, and we will
          notify subscribers by email of any material change.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          {LEGAL.operatorLegalName}, {LEGAL.operatorAddress}. Email {LEGAL.contactEmail}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
