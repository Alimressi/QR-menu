// Generates the 1200x630 social banner for the portfolio landing page
// (QR-menu + restaurant websites). Typographic, marble theme, no photo.
// Output: docs/og/landing.jpg
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1200, H = 630;

const c = {
  bgFrom: "#ffffff", bgTo: "#f3efe7",
  text: "#26231d", muted: "#8a8579", accent: "#b3a173",
};
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const serif = "Georgia, 'Times New Roman', serif";
const sans = "'Helvetica Neue', Arial, sans-serif";

const chips = ["Lumière", "Bahçe", "Vətən"];
let chipsSvg = "";
let x = 96;
const chipY = 424, padX = 26, gap = 18, chipH = 52, charW = 15;
for (const label of chips) {
  const w = padX * 2 + label.length * charW;
  chipsSvg += `
    <rect x="${x}" y="${chipY}" width="${w}" height="${chipH}" rx="26"
          fill="none" stroke="${c.accent}" stroke-opacity="0.6"/>
    <text x="${x + w / 2}" y="${chipY + 34}" text-anchor="middle"
          font-family="${serif}" font-size="26" fill="${c.text}">${esc(label)}</text>`;
  x += w + gap;
}

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.bgFrom}"/>
      <stop offset="1" stop-color="${c.bgTo}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none"
        stroke="${c.accent}" stroke-opacity="0.45" stroke-width="1.5"/>

  <text x="92" y="238" font-family="${serif}" font-size="80"
        font-weight="700" fill="${c.text}">QR menus and websites</text>

  <rect x="96" y="278" width="88" height="3" fill="${c.accent}"/>

  <text x="96" y="342" font-family="${serif}" font-size="30" fill="${c.muted}">
    QR-menu platform · restaurant websites</text>

  ${chipsSvg}

  <text x="98" y="566" font-family="${sans}" font-size="20" letter-spacing="1.5"
        fill="${c.muted}">alimressi.github.io/QR-menu · TypeScript · React · Cloudflare</text>
</svg>`;

const outDir = join(root, "docs/og");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "landing.jpg");
await sharp(Buffer.from(svg)).jpeg({ quality: 90, mozjpeg: true }).toFile(outPath);
console.log("wrote", outPath);
