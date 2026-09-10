// Printable QR codes, one per room.
//
// The menu has always been able to tell rooms apart — a link carries
// ?table=<n>&ak=<signature>, the signature is an HMAC over
// "restaurant:<slug>|table:<n>", and every order placed through it records which
// room it came from. GamePoint was given one code for the whole venue, so that
// capability has been sitting unused: the panel shows every order as coming from
// the same place.
//
// The signature is what stops a guest editing the number in the address bar and
// ordering onto somebody else's tab, so these links cannot be typed by hand or
// guessed — they have to be generated with the secret, which is what this does.
//
// Usage:
//   node scripts/make-table-qr.mjs gamepoint 8
//   node scripts/make-table-qr.mjs gamepoint 8 --out ~/Desktop/gamepoint-qr

import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import QRCode from "qrcode";
import sharp from "sharp";

const slug = process.argv[2];
const count = Number(process.argv[3]);
const outArg = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : null;

if (!slug || !Number.isInteger(count) || count < 1) {
  console.error("Usage: node scripts/make-table-qr.mjs <slug> <rooms> [--out <dir>]");
  process.exit(1);
}

const env = await fs.readFile(".env", "utf8");
const read = (key) => env.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1].trim().replace(/^"|"$/g, "");

const sql = neon(read("DATABASE_URL"));

// Deliberately NOT read from .env. NEXT_PUBLIC_BASE_URL there is the dev value,
// http://localhost:3000, and the first run of this script duly produced eight
// codes pointing at a laptop. Paper cannot be redeployed: whatever is printed is
// the address for as long as the sticker is on the wall, so the live origin is
// the default and anything else has to be asked for by name.
const baseUrl = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "https://qr-menu.az";

if (!/^https:\/\//.test(baseUrl)) {
  console.error(`Refusing to print codes for "${baseUrl}" — a printed code must be a public https address.`);
  process.exit(1);
}

// Same fallback chain as src/lib/qr-token.ts. A code printed against the wrong
// secret is refused at the door and there is no way to tell from looking at it,
// so this must resolve exactly as the running app does.
const tableKeySecret = read("QR_TABLE_KEY_SECRET") ?? read("QR_TOKEN_SECRET");

if (!tableKeySecret) {
  console.error("QR_TABLE_KEY_SECRET (or QR_TOKEN_SECRET) is missing from .env — codes would not open.");
  process.exit(1);
}

function createTableAccessKey(tableNumber, restaurantScope) {
  return crypto
    .createHmac("sha256", tableKeySecret)
    .update(`restaurant:${restaurantScope}|table:${tableNumber}`)
    .digest("base64url");
}

const restaurant = (await sql`SELECT id, name, settings FROM "Restaurant" WHERE slug = ${slug}`)[0];

if (!restaurant) {
  console.error(`No restaurant "${slug}".`);
  process.exit(1);
}

// The admin panel builds its list from this number, so a venue with eight rooms
// and a settings value of five hands out five links and silently loses three.
const settings = typeof restaurant.settings === "string" ? JSON.parse(restaurant.settings) : (restaurant.settings ?? {});
const previousCount = settings.tableCount ?? "(unset)";

const outDir = outArg
  ? outArg.replace(/^~/, os.homedir())
  : path.join(os.homedir(), "Desktop", `${slug}-qr`);
await fs.mkdir(outDir, { recursive: true });

const QR_SIZE = 900;
const PADDING = 60;
const LABEL_HEIGHT = 190;
const WIDTH = QR_SIZE + PADDING * 2;
const HEIGHT = QR_SIZE + PADDING * 2 + LABEL_HEIGHT;

/**
 * Ask the live site whether a code would actually open.
 *
 * The signature depends on QR_TABLE_KEY_SECRET, and the copy in .env is not
 * necessarily the copy the Worker holds — here they differ, so the first run of
 * this script produced eight perfectly valid-looking codes that the server
 * refuses. A dead QR code is indistinguishable from a live one by eye, and the
 * difference only shows up once it is on a wall and a guest is standing in front
 * of it. So every code is offered to the door before it is drawn.
 */
async function opensOnTheLiveSite(table, accessKey) {
  const response = await fetch(`${baseUrl}/api/qr/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tableNumber: String(table), accessKey, restaurantSlug: slug }),
  });

  return response.ok;
}

const firstKey = createTableAccessKey("1", slug);

if (!(await opensOnTheLiveSite(1, firstKey))) {
  console.error(`\n${baseUrl} refuses codes signed with this machine's QR_TABLE_KEY_SECRET.`);
  console.error("Nothing was written — printing these would put dead codes on the wall.");
  console.error("Mint them where the real secret lives instead: the super admin panel renders");
  console.error("them for the selected restaurant, using the server's own key.");
  process.exit(1);
}

// Only once the codes are known to work. The admin panel builds its list from
// this number, so a venue with eight rooms and a settings value of five hands
// out five links and silently loses three — but a run that aborts should leave
// nothing behind either.
settings.tableCount = count;
await sql`UPDATE "Restaurant" SET settings = ${JSON.stringify(settings)} WHERE id = ${restaurant.id}`;

for (let table = 1; table <= count; table += 1) {
  const accessKey = createTableAccessKey(String(table), slug);
  const url = `${baseUrl}/${slug}?table=${encodeURIComponent(String(table))}&ak=${encodeURIComponent(accessKey)}`;

  if (!(await opensOnTheLiveSite(table, accessKey))) {
    console.error(`Room ${table} did not validate. Stopping rather than writing a half-usable set.`);
    process.exit(1);
  }

  // High error correction: these get taped to a wall in a dim room and are
  // going to be scratched, smudged and photographed at an angle.
  const qr = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: QR_SIZE,
    color: { dark: "#000000", light: "#FFFFFF" },
  });

  const label = Buffer.from(
    `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
       <rect width="100%" height="100%" fill="#FFFFFF"/>
       <text x="${WIDTH / 2}" y="${QR_SIZE + PADDING * 2 + 80}" text-anchor="middle"
             font-family="Helvetica, Arial, sans-serif" font-size="96" font-weight="700"
             fill="#000000">OTAQ ${table}</text>
       <text x="${WIDTH / 2}" y="${QR_SIZE + PADDING * 2 + 150}" text-anchor="middle"
             font-family="Helvetica, Arial, sans-serif" font-size="40"
             fill="#555555">${restaurant.name}</text>
     </svg>`,
  );

  const file = path.join(outDir, `otaq-${table}.png`);

  await sharp(label)
    .composite([{ input: qr, top: PADDING, left: PADDING }])
    .png()
    .toFile(file);

  console.log(`  otaq-${table}.png  ->  ${url}`);
}

console.log(`\n${restaurant.name}: ${count} codes in ${outDir}`);
console.log(`tableCount ${previousCount} -> ${count}`);
