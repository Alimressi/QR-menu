// Single source of truth for the legal pages.
//
// ─────────────────────────────────────────────────────────────────────────────
// FILL THESE IN BEFORE ACTIVATING THE LEMON SQUEEZY STORE.
//
// Lemon Squeezy checks that the operator named in your Terms matches the
// identity you verified with them. A mismatch is a common reason stores get
// held up in review. Nothing here is invented — the placeholders are marked so
// you notice them rather than shipping someone else's boilerplate.
// ─────────────────────────────────────────────────────────────────────────────

export const LEGAL = {
  /** The service name as customers see it on invoices and receipts. */
  serviceName: "QR Menu",

  /** Public address of the service. Update when the custom domain is live. */
  siteUrl: "https://qr-menu.az",

  /** Must match the identity verified with Lemon Squeezy, or the store review stalls. */
  operatorLegalName: "Asgarov Alimran",

  operatorAddress: "Badamdar, Baku, Azerbaijan",

  /** The country whose law governs the agreement and where you operate from. */
  operatorCountry: "Azerbaijan",

  /**
   * Published on both legal pages, and the address an acquiring bank will look
   * for when it reviews the site before approving online payments.
   *
   * TODO: a mailbox on qr-menu.az itself. A free inbox is fine for a first
   * client and wrong for a page a bank is checking — the domain is the part
   * that says the operator and the site are the same party.
   */
  contactEmail: "alimran.askerov05@gmail.com",

  /** Bump whenever either document changes materially. */
  lastUpdated: "12 August 2026",

  /** Merchant of record. They take the payment; you never touch card details. */
  paymentProcessor: "Lemon Squeezy",

  /** Days of free trial offered before the first charge. Keep in step with TRIAL_DAYS. */
  trialDays: 14,

  /** Days after a cancellation before customer data is deleted. */
  dataRetentionDays: 30,
} as const;
