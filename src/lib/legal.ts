// Single source of truth for the legal pages.
//
// The service is sold in Baku, to venues the operator meets, and invoiced
// directly. There is no online checkout, no card processing and no automatic
// renewal — so nothing here names a payment processor, and the pages must not
// describe one. If that ever changes, the pages change with it.

export const LEGAL = {
  /** The service name as customers see it on invoices and receipts. */
  serviceName: "QR Menu",

  /** Public address of the service. */
  siteUrl: "https://qr-menu.az",

  operatorLegalName: "Asgarov Alimran",

  operatorAddress: "Badamdar, Baku, Azerbaijan",

  /** The country whose law governs the agreement and where the operator works. */
  operatorCountry: "Azerbaijan",

  /** Where the service is offered. Named on the terms page so it is not implied. */
  serviceArea: "Baku",

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
  lastUpdated: "12 September 2026",

  /** Days after an account ends before customer data is deleted. */
  dataRetentionDays: 30,
} as const;
