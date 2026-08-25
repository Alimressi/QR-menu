// Build labelled contact sheets of a restaurant's dish photos for visual review.
//
// Thirty to a sheet, each captioned with its id and category. A photo set is
// judged as a set — whether the light matches, whether one dish is lighter than
// its neighbours — and that is a question a page of thumbnails answers and 92
// separate files do not. The thumbnails sit on the same near-black the menu
// uses, so a photo that carries its own dark background disappears into it
// exactly as it will on the card.
//
// Usage: node scripts/build-review-sheets.mjs [slug]
import sharp from "sharp";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

process.env.DATABASE_URL = (await fs.readFile(".env", "utf8")).match(/^DATABASE_URL=(.+)$/m)[1].trim();
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

const SLUG = process.argv[2] ?? "ninelives";
const OUT = path.join(process.cwd(), "_review");
await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });

const r = await prisma.restaurant.findUnique({ where: { slug: SLUG }, select: { id: true } });
if (!r) {
  console.error(`Restaurant "${SLUG}" not found.`);
  process.exit(1);
}
const cats = await prisma.category.findMany({ where: { restaurantId: r.id }, select: { id: true, nameEn: true } });
const catName = Object.fromEntries(cats.map((c) => [c.id, c.nameEn]));
const dishes = await prisma.dish.findMany({
  where: { restaurantId: r.id },
  select: { id: true, nameEn: true, nameAz: true, categoryId: true, imageUrl: true },
});
// order by category (grouped) then id
dishes.sort((a, b) => (catName[a.categoryId] || "").localeCompare(catName[b.categoryId] || "") || a.id - b.id);

const COLS = 5, CELL_W = 320, IMG_H = 200, LABEL_H = 54, CELL_H = IMG_H + LABEL_H, PER = 30;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

let sheet = 0;
for (let start = 0; start < dishes.length; start += PER) {
  const chunk = dishes.slice(start, start + PER);
  const rows = Math.ceil(chunk.length / COLS);
  const W = COLS * CELL_W, H = rows * CELL_H;
  const composites = [];
  let labels = "";

  for (let i = 0; i < chunk.length; i++) {
    const d = chunk[i];
    const col = i % COLS, row = Math.floor(i / COLS);
    const x = col * CELL_W, y = row * CELL_H;
    const file = path.join(process.cwd(), "public", d.imageUrl);
    try {
      if (!d.imageUrl) throw new Error("no photo");
      const thumb = await sharp(file).resize(CELL_W - 8, IMG_H - 8, { fit: "cover" }).toBuffer();
      composites.push({ input: thumb, left: x + 4, top: y + 4 });
    } catch {
      labels += `<rect x="${x + 4}" y="${y + 4}" width="${CELL_W - 8}" height="${IMG_H - 8}" fill="#400"/>`;
    }
    const cat = esc((catName[d.categoryId] || "").slice(0, 22));
    const name = esc((d.nameEn || d.nameAz).slice(0, 30));
    labels += `<text x="${x + 8}" y="${y + IMG_H + 20}" fill="#e8c877" font-family="sans-serif" font-size="15" font-weight="bold">#${d.id} ${name}</text>`;
    labels += `<text x="${x + 8}" y="${y + IMG_H + 42}" fill="#9aa" font-family="sans-serif" font-size="13">${cat}</text>`;
  }

  const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${labels}</svg>`);
  composites.push({ input: svg, left: 0, top: 0 });
  const outPath = path.join(OUT, `sheet-${String(++sheet).padStart(2, "0")}.png`);
  await sharp({ create: { width: W, height: H, channels: 3, background: "#141414" } })
    .composite(composites).png().toFile(outPath);
  console.log("wrote", outPath, `(${chunk.length} dishes)`);
}

console.log(`\n${sheet} sheets in _review/`);
await prisma.$disconnect();
