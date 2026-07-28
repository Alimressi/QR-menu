// Generates a 1200x630 social-share (Open Graph) banner for a restaurant.
// Usage: node scripts/make-og-banner.mjs
//
// Design: warm marble background (Lumière theme) with a serif title block on the
// left and a dish photo bleeding in from the right behind a soft fade.
// Output: public/images/og/<slug>.jpg
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const W = 1200;
const H = 630;

// ---- content + theme (Lumière) -------------------------------------------------
const cfg = {
  slug: "lumiere",
  title: "Lumière",
  kicker: "QR MENU",
  subtitle: "Seasonal European kitchen · all-day dining",
  footer: "qr-menu.imran-ask-2006.workers.dev/lumiere",
  photo: "public/images/dishes/dish-306.jpg",
  bgFrom: "#ffffff",
  bgTo: "#f3efe7",
  text: "#26231d",
  muted: "#8a8579",
  accent: "#b3a173", // warm gold for the divider rule
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const serif = "Georgia, 'Times New Roman', 'Cormorant Garamond', serif";
const sans = "'Helvetica Neue', Arial, sans-serif";

// Right-hand photo panel, cropped to cover.
const panelW = 480;
const photo = await sharp(join(root, cfg.photo))
  .resize(panelW, H, { fit: "cover", position: "attention" })
  .toBuffer();

// Base background gradient (fills the whole canvas; shows on the left column).
const bgSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${cfg.bgFrom}"/>
      <stop offset="1" stop-color="${cfg.bgTo}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
</svg>`;

// Overlay: seam fade over the photo's left edge + all the typography on top.
const photoLeft = W - panelW; // 720
const overlaySvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="seam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${cfg.bgTo}" stop-opacity="1"/>
      <stop offset="1" stop-color="${cfg.bgTo}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- soft fade blending the photo into the cream -->
  <rect x="${photoLeft}" y="0" width="230" height="${H}" fill="url(#seam)"/>
  <!-- 1px inner frame for a printed-menu feel -->
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none"
        stroke="${cfg.accent}" stroke-opacity="0.45" stroke-width="1.5"/>

  <text x="96" y="212" font-family="${sans}" font-size="24" letter-spacing="6"
        fill="${cfg.muted}" font-weight="600">${esc(cfg.kicker)}</text>

  <text x="92" y="340" font-family="${serif}" font-size="122" fill="${cfg.text}"
        font-style="italic" font-weight="600">${esc(cfg.title)}</text>

  <rect x="96" y="374" width="88" height="3" fill="${cfg.accent}"/>

  <text x="96" y="430" font-family="${serif}" font-size="30" fill="${cfg.muted}">
    ${esc(cfg.subtitle)}</text>

  <text x="96" y="566" font-family="${sans}" font-size="20" letter-spacing="1.5"
        fill="${cfg.muted}">${esc(cfg.footer)}</text>
</svg>`;

const outDir = join(root, "public/images/og");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${cfg.slug}.jpg`);

await sharp(Buffer.from(bgSvg))
  .composite([
    { input: photo, left: photoLeft, top: 0 },
    { input: Buffer.from(overlaySvg), left: 0, top: 0 },
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(outPath);

console.log("wrote", outPath);
