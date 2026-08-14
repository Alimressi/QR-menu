/**
 * Everything, in one command: `npm run check`.
 *
 * The point is that there is no excuse left. Three production incidents in one
 * day came from shipping a change that a two-minute check would have caught, and
 * a suite nobody remembers to run is the same as no suite.
 *
 * Ordered cheapest first, so a typo fails in seconds rather than after every
 * database fixture has been created and torn down. Keeps going after a failure
 * and reports the whole picture at the end — finding out about one broken thing
 * at a time is how a five-minute fix becomes an hour.
 */
import { spawnSync } from "node:child_process";

const steps = [
  { name: "typecheck", command: "npx", args: ["tsc", "--noEmit"] },
  { name: "lint", command: "npx", args: ["eslint", "src", "monitor/src", "scripts"] },
  { name: "subscription", args: ["scripts/check-subscription.ts"] },
  { name: "auth", args: ["scripts/check-auth.ts"] },
  { name: "qr tokens", args: ["scripts/check-qr-token.ts"] },
  { name: "media", args: ["scripts/check-media.ts"] },
  { name: "menu import", args: ["scripts/check-menu-import.ts"] },
  { name: "menu queries", args: ["scripts/check-menu-query.ts"] },
  { name: "snapshot", args: ["scripts/check-snapshot.ts"] },
  { name: "orders", args: ["scripts/check-orders-query.ts"] },
];

const results = [];

for (const step of steps) {
  const command = step.command ?? "node";
  const args = step.command
    ? step.args
    : ["--env-file=.env", "node_modules/tsx/dist/cli.mjs", ...step.args];

  process.stdout.write(`\n[1m─── ${step.name} ───[0m\n`);

  const started = Date.now();
  const run = spawnSync(command, args, { stdio: "inherit", shell: false });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  results.push({ name: step.name, ok: run.status === 0, seconds });
}

const failed = results.filter((result) => !result.ok);

process.stdout.write("\n[1m─── summary ───[0m\n");
for (const result of results) {
  process.stdout.write(`  ${result.ok ? "[32mpass[0m" : "[31mFAIL[0m"}  ${result.name} (${result.seconds}s)\n`);
}

if (failed.length > 0) {
  process.stdout.write(`\n[31m${failed.length} of ${results.length} failed: ${failed.map((f) => f.name).join(", ")}[0m\n`);
  process.exit(1);
}

process.stdout.write(`\n[32mAll ${results.length} checks passed.[0m\n`);
