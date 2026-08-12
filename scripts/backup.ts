import { neon } from "@neondatabase/serverless";
import { promises as fs } from "fs";
import path from "path";

// Full database export to a timestamped JSON file.
//
// Everything every restaurant has — menus, photos, themes, orders — lives in one
// Neon database. Losing it loses every client's menu and every hour spent
// building them, which ends the business rather than inconveniencing it. Neon's
// own point-in-time restore is the first line of defence; this is the second,
// because a backup you hold yourself is the only one you can be sure exists.
//
// Uses the same plain SQL path as the guest menu, not Prisma, so a backup never
// depends on the heavier query engine working.
//
// The file contains restaurant admin password hashes, so backups/ is gitignored.
// Keep the file somewhere private.

const TABLES = [
  "Restaurant",
  "Category",
  "Dish",
  "DishOption",
  "Order",
  "OrderItem",
  "WaiterCall",
] as const;

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = neon(connectionString);
  const dump: Record<string, unknown[]> = {};

  for (const table of TABLES) {
    // Table names are from the fixed list above, never from input.
    const rows = (await sql.query(`SELECT * FROM "${table}"`)) as unknown[];
    dump[table] = rows;
    console.log(`  ${table.padEnd(12)} ${String(rows.length).padStart(5)} rows`);
  }

  const directory = path.join(process.cwd(), "backups");
  await fs.mkdir(directory, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = path.join(directory, `qr-menu-${stamp}.json`);

  await fs.writeFile(
    file,
    JSON.stringify({ exportedAt: new Date().toISOString(), tables: dump }, null, 2),
  );

  const { size } = await fs.stat(file);
  console.log(`\nSaved ${(size / 1024).toFixed(0)} KB to ${path.relative(process.cwd(), file)}`);

  // A backup nobody has ever read is a guess. Read it back and check the counts.
  const reread = JSON.parse(await fs.readFile(file, "utf8")) as {
    tables: Record<string, unknown[]>;
  };

  let mismatch = false;
  for (const table of TABLES) {
    if (reread.tables[table]?.length !== dump[table].length) {
      console.error(`  MISMATCH in ${table}`);
      mismatch = true;
    }
  }

  console.log(mismatch ? "Backup FAILED verification." : "Verified: re-read and row counts match.");
  process.exit(mismatch ? 1 : 0);
}

main().catch((error) => {
  console.error("Backup failed:", error);
  process.exit(1);
});
