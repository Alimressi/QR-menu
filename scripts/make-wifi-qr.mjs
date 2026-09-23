// A printable Wi-Fi QR code: point a camera at it and the phone joins the
// network without anyone reading a password off a wall.
//
// The password is never an argument. It is read from stdin, because an argument
// lands in ~/.zsh_history and stays there — a guest password is meant to be
// semi-public, but a shell history is not where anyone decides to publish it.
//
// Usage:
//   node scripts/make-wifi-qr.mjs --ssid "GamePoint"
//     (then type the password; it is not echoed)
//
//   --security WPA | WEP | nopass   default WPA, which also covers WPA2/WPA3
//   --hidden                        the network does not broadcast its name
//   --label "GamePoint"             printed under the code; defaults to the SSID
//   --out ~/Desktop/wifi-qr

import { promises as fs } from "fs";
import os from "os";
import path from "path";
import QRCode from "qrcode";
import readline from "readline";
import sharp from "sharp";

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const ssid = arg("ssid");
const security = (arg("security", "WPA") ?? "WPA").toUpperCase();
const hidden = process.argv.includes("--hidden");
const label = arg("label") ?? ssid;
const outArg = arg("out");

if (!ssid) {
  console.error('Usage: node scripts/make-wifi-qr.mjs --ssid "Network name" [--security WPA|WEP|nopass] [--hidden]');
  process.exit(1);
}

if (!["WPA", "WEP", "NOPASS"].includes(security)) {
  console.error(`Unknown security "${security}". Use WPA, WEP or nopass.`);
  process.exit(1);
}

/**
 * Escape a field for the WIFI: payload.
 *
 * Backslash, semicolon, comma, colon and double quote all mean something inside
 * the payload, so a password containing one silently produces a code that joins
 * the wrong network or fails. This is the single most common way a hand-made
 * Wi-Fi code comes out broken.
 */
function escapeField(value) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

async function readPassword() {
  if (security === "NOPASS") {
    return "";
  }

  if (!process.stdin.isTTY) {
    // Piped in: take the first line as given.
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });

  // Mute the echo so the password does not sit on screen behind whoever walks past.
  const muted = (chunk, encoding, callback) => {
    if (!rl.__muted) process.stdout.write(chunk, encoding);
    callback();
  };
  const original = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, encoding, callback) => muted(chunk, encoding, callback ?? (() => {}));

  process.stdout.write = original;
  rl.__muted = false;

  return await new Promise((resolve) => {
    process.stdout.write(`Password for "${ssid}": `);
    rl.__muted = true;
    const onData = (buffer) => {
      const char = buffer.toString("utf8");
      if (char === "\n" || char === "\r" || char === "") process.stdin.removeListener("data", onData);
    };
    process.stdin.on("data", onData);

    rl.question("", (answer) => {
      rl.__muted = false;
      process.stdout.write("\n");
      rl.close();
      resolve(answer);
    });
  });
}

const password = await readPassword();

if (security !== "NOPASS" && password.length === 0) {
  console.error("No password given. Use --security nopass for an open network.");
  process.exit(1);
}

// The order of the fields is not free: phones are strict about this layout, and
// the trailing double semicolon is part of it.
const payload =
  security === "NOPASS"
    ? `WIFI:T:nopass;S:${escapeField(ssid)};${hidden ? "H:true;" : ""};`
    : `WIFI:T:${security};S:${escapeField(ssid)};P:${escapeField(password)};${hidden ? "H:true;" : ""};`;

const outDir = (outArg ?? path.join(os.homedir(), "Desktop", "wifi-qr")).replace(/^~/, os.homedir());
await fs.mkdir(outDir, { recursive: true });

const QR_SIZE = 900;
const PADDING = 60;
const LABEL_HEIGHT = 190;
const WIDTH = QR_SIZE + PADDING * 2;
const HEIGHT = QR_SIZE + PADDING * 2 + LABEL_HEIGHT;

// High error correction: this goes on a wall in a dim room and will be
// scratched, smudged and photographed at an angle.
const qr = await QRCode.toBuffer(payload, {
  errorCorrectionLevel: "H",
  margin: 1,
  width: QR_SIZE,
  color: { dark: "#000000", light: "#FFFFFF" },
});

const escapeXml = (value) =>
  value.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

const canvas = Buffer.from(
  `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
     <rect width="100%" height="100%" fill="#FFFFFF"/>
     <text x="${WIDTH / 2}" y="${QR_SIZE + PADDING * 2 + 80}" text-anchor="middle"
           font-family="Helvetica, Arial, sans-serif" font-size="86" font-weight="700"
           fill="#000000">${escapeXml(label)}</text>
     <text x="${WIDTH / 2}" y="${QR_SIZE + PADDING * 2 + 150}" text-anchor="middle"
           font-family="Helvetica, Arial, sans-serif" font-size="40"
           fill="#555555">Wi-Fi</text>
   </svg>`,
);

const file = path.join(outDir, `wifi-${ssid.replace(/[^a-zA-Z0-9-_]+/g, "-").toLowerCase()}.png`);

await sharp(canvas).composite([{ input: qr, top: PADDING, left: PADDING }]).png().toFile(file);

// The payload is printed with the password masked: enough to check the network
// name and the field layout, not enough to read over a shoulder.
const shown = payload.replace(/P:(?:[^;\\]|\\.)*;/, "P:••••••;");

console.log(`\n  ${file}`);
console.log(`  ${shown}`);
console.log("\n  Scan it yourself before printing — paper cannot be redeployed.");
