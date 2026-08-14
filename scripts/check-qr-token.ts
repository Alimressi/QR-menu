/**
 * The QR trust boundary.
 *
 * These two secrets are the only thing standing between "a guest scanned the
 * code on their table" and "anyone on the internet can order to any table of any
 * restaurant". Everything here is a pure function, so this runs in milliseconds
 * and has no excuse not to be run before every deploy.
 *
 * Run: npm run check:qr
 */
import crypto from "crypto";
import {
  createQrSessionToken,
  createTableAccessKey,
  decodeQrTokenPayload,
  verifyQrSessionToken,
  verifyTableAccessKey,
} from "@/lib/qr-token";

let failures = 0;

/**
 * A correctly signed token carrying an `exp`, which createQrSessionToken never
 * sets but the verifier honours. Signed here the same way the app signs, so the
 * check exercises expiry rather than a broken signature.
 */
function createExpiringToken(msFromNow: number) {
  const payload = { t: "12", r: 7, iat: Date.now() - 1000, exp: Date.now() + msFromNow };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const secret =
    process.env.QR_TOKEN_SECRET || process.env.ADMIN_SESSION_TOKEN || "dev-qr-token-secret-change-me";
  const signature = crypto.createHmac("sha256", secret).update(body).digest("base64url");

  return `v1.${body}.${signature}`;
}

const createExpiredToken = () => createExpiringToken(-1);

function check(name: string, condition: boolean) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}`);
  }
}

/** Rebuild a token with a different payload but the original signature. */
function forgePayload(token: string, payload: object) {
  const [version, , signature] = token.split(".");
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${version}.${encoded}.${signature}`;
}

console.log("session token round trip");
const token = createQrSessionToken("12", 7);
const verified = verifyQrSessionToken(token);

check("a freshly issued token verifies", verified !== null);
check("table number survives", verified?.tableNumber === "12");
check("restaurant id survives", verified?.restaurantId === 7);
check("issuedAt is a timestamp", typeof verified?.issuedAt === "number" && verified.issuedAt > 0);
check("token carries its version", token.startsWith("v1."));

console.log("\nforgery");
check(
  "moving the token to another table is rejected",
  verifyQrSessionToken(forgePayload(token, { t: "99", r: 7, iat: Date.now() })) === null,
);
check(
  "moving the token to another restaurant is rejected",
  verifyQrSessionToken(forgePayload(token, { t: "12", r: 999, iat: Date.now() })) === null,
);
check(
  "a token signed with someone else's key is rejected",
  verifyQrSessionToken(`${token.split(".").slice(0, 2).join(".")}.notarealsignature`) === null,
);
check("an empty signature is rejected", verifyQrSessionToken(`${token.split(".").slice(0, 2).join(".")}.`) === null);
check("a different version prefix is rejected", verifyQrSessionToken(token.replace(/^v1\./, "v2.")) === null);

console.log("\nmalformed input never throws");
check("empty string", verifyQrSessionToken("") === null);
check("no separators", verifyQrSessionToken("garbage") === null);
check("too few parts", verifyQrSessionToken("v1.only-two") === null);
check("too many parts", verifyQrSessionToken("v1.a.b.c") === null);
check("payload is not base64", verifyQrSessionToken("v1.!!!!.sig") === null);
check("payload is base64 but not JSON", verifyQrSessionToken(`v1.${Buffer.from("nope").toString("base64url")}.sig`) === null);

console.log("\npayload shape is enforced, not trusted");
check(
  "restaurant id sent as a string is rejected",
  verifyQrSessionToken(forgePayload(token, { t: "12", r: "7", iat: Date.now() })) === null,
);
check(
  "missing issuedAt is rejected",
  verifyQrSessionToken(forgePayload(token, { t: "12", r: 7 })) === null,
);
check("an already-expired token is rejected", verifyQrSessionToken(createExpiredToken()) === null);
check("a token expiring in the future is still valid", verifyQrSessionToken(createExpiringToken(60_000)) !== null);

console.log("\ntable access keys");
const keyA5 = createTableAccessKey("5", "lumiere");

check("the right key for the right table verifies", verifyTableAccessKey("5", "lumiere", keyA5));
check("the same table at another restaurant does not", !verifyTableAccessKey("5", "gamepoint", keyA5));
check("another table at the same restaurant does not", !verifyTableAccessKey("6", "lumiere", keyA5));
check("an empty key does not", !verifyTableAccessKey("5", "lumiere", ""));
check("a truncated key does not", !verifyTableAccessKey("5", "lumiere", keyA5.slice(0, -1)));
check("keys are deterministic", createTableAccessKey("5", "lumiere") === keyA5);
check(
  "table 5 and table 55 do not collide",
  createTableAccessKey("5", "lumiere") !== createTableAccessKey("55", "lumiere"),
);
check(
  "the delimiter cannot be shifted between fields",
  createTableAccessKey("5|table:6", "lumiere") !== createTableAccessKey("5", "lumiere|table:6"),
);

console.log("\ndecodeQrTokenPayload reads without verifying — never authorise with it");
const tampered = forgePayload(token, { t: "99", r: 999, iat: Date.now() });
check("it decodes a token the verifier rejects", decodeQrTokenPayload(tampered)?.restaurantId === 999);
check("...while the verifier still says no", verifyQrSessionToken(tampered) === null);
check("garbage still returns null", decodeQrTokenPayload("nonsense") === null);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
