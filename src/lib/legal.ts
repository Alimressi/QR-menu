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
  siteUrl: "https://qr-menu.imran-ask-2006.workers.dev",

  /** Must match the identity verified with Lemon Squeezy, or the store review stalls. */
  operatorLegalName: "Asgarov Alimran",

  operatorAddress: "Badamdar, Baku, Azerbaijan",

  /** The country whose law governs the agreement and where you operate from. */
  operatorCountry: "Azerbaijan",

  /**
   * TODO: consider a dedicated address on your own domain instead of a personal
   * inbox — this one is published on both legal pages.
   */
  contactEmail: "imran.ask.2006@gmail.com",

  /** Bump whenever either document changes materially. */
  lastUpdated: "12 August 2026",

  /** Merchant of record. They take the payment; you never touch card details. */
  paymentProcessor: "Lemon Squeezy",

  /** Days of free trial offered before the first charge. Keep in step with TRIAL_DAYS. */
  trialDays: 14,

  /** Days after a cancellation before customer data is deleted. */
  dataRetentionDays: 30,
} as const;
