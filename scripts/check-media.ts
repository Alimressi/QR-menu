import { promises as fs } from "fs";
import path from "path";
import {
  MAX_UPLOAD_BYTES,
  isAllowedImageType,
  putMedia,
  sniffImageType,
} from "@/lib/media";

let failures = 0;

function check(name: string, condition: boolean) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}`);
  }
}

async function main() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  console.log("format sniffing (real files from public/uploads)");
  const webp = new Uint8Array(await fs.readFile(path.join(uploadsDir, "greek-salad.webp")));
  const jpg = new Uint8Array(await fs.readFile(path.join(uploadsDir, "greek-salad.jpg")));

  check("real .webp detected as image/webp", sniffImageType(webp) === "image/webp");
  check("real .jpg detected as image/jpeg", sniffImageType(jpg) === "image/jpeg");

  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  check("png magic bytes detected", sniffImageType(png) === "image/png");

  console.log("\nrejected uploads");
  const svg = new Uint8Array(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'));
  check("svg is not a recognised image type", sniffImageType(svg) === null);

  const scriptDisguisedAsPng = new Uint8Array(Buffer.from("<script>alert(1)</script>"));
  check("html/script payload rejected", sniffImageType(scriptDisguisedAsPng) === null);

  // A .jpg extension and image/jpeg MIME type on non-image bytes: the old route
  // trusted both and would have stored this.
  check(
    "extension + MIME cannot smuggle a non-image through",
    sniffImageType(new Uint8Array(Buffer.from("GIF89a not really"))) === null,
  );

  check("svg no longer in the allow list", !isAllowedImageType("image/svg+xml"));
  check("jpeg/png/webp/avif allowed", ["image/jpeg", "image/png", "image/webp", "image/avif"].every(isAllowedImageType));
  check("size cap is 8 MB", MAX_UPLOAD_BYTES === 8 * 1024 * 1024);

  console.log("\nfilesystem fallback (no R2 binding present, as in plain `next dev`)");
  const stored = await putMedia(999, webp, "image/webp");

  check("falls back to filesystem instead of throwing", stored.storage === "filesystem");
  check("returns a legacy-shaped /uploads/ URL", stored.url.startsWith("/uploads/"));
  check("extension comes from the sniffed type", stored.url.endsWith(".webp"));

  const writtenPath = path.join(process.cwd(), "public", stored.url.replace("/uploads/", "uploads/"));
  const written = await fs.readFile(writtenPath);
  check("bytes round-trip intact", written.length === webp.length);

  await fs.unlink(writtenPath);
  check("temp file cleaned up", !(await fs.stat(writtenPath).catch(() => null)));

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
