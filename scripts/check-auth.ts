import { NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  verifySessionToken,
  resolveTenantScope,
  requireTenantScope,
} from "@/lib/auth";

let failures = 0;

function check(name: string, condition: boolean) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}`);
  }
}

function req(cookieValue?: string) {
  return new NextRequest("http://localhost/api/dishes", {
    headers: cookieValue ? { cookie: `${SESSION_COOKIE_NAME}=${cookieValue}` } : {},
  });
}

const adminA = createSessionToken("RESTAURANT_ADMIN", 1)!;
const superToken = createSessionToken("SUPER_ADMIN")!;

console.log("token integrity");
check("valid restaurant-admin token verifies", verifySessionToken(adminA)?.restaurantId === 1);
check("valid super-admin token verifies", verifySessionToken(superToken)?.role === "SUPER_ADMIN");
check("empty token rejected", verifySessionToken("") === null);
check("old constant cookie rejected", verifySessionToken("restaurant-admin-session") === null);
check("old super-admin constant rejected", verifySessionToken("super-admin-session") === null);

// Re-sign nothing: flip the restaurantId in the payload, keep the signature.
const [version, payload, signature] = adminA.split(".");
const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
decoded.rid = 2;
const tamperedPayload = Buffer.from(JSON.stringify(decoded), "utf8").toString("base64url");
check(
  "payload tampering rejected",
  verifySessionToken(`${version}.${tamperedPayload}.${signature}`) === null,
);
check("stripped signature rejected", verifySessionToken(`${version}.${payload}.`) === null);

const expired = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
expired.exp = Date.now() - 1000;
const expiredPayload = Buffer.from(JSON.stringify(expired), "utf8").toString("base64url");
check(
  "expired token rejected (even if re-signed by an attacker without the key)",
  verifySessionToken(`${version}.${expiredPayload}.${signature}`) === null,
);

console.log("\ntenant isolation");
const anon = resolveTenantScope(req(), 1);
check("no cookie -> 401", !anon.ok && anon.status === 401);

const forged = resolveTenantScope(req("restaurant-admin-session"), 1);
check("forged legacy cookie -> 401", !forged.ok && forged.status === 401);

const ownTenant = resolveTenantScope(req(adminA), 1);
check("restaurant admin on own id -> allowed, pinned to 1", ownTenant.ok && ownTenant.restaurantId === 1);

const crossTenant = resolveTenantScope(req(adminA), 2);
check("restaurant admin on foreign id -> 403", !crossTenant.ok && crossTenant.status === 403);

const omitted = requireTenantScope(req(adminA));
check(
  "restaurant admin omitting id -> falls back to own tenant, never null",
  omitted.ok && omitted.restaurantId === 1,
);

const superAny = requireTenantScope(req(superToken), 7);
check("super admin may target any restaurant", superAny.ok && superAny.restaurantId === 7);

const superNoId = requireTenantScope(req(superToken));
check("super admin without an id -> 400, not an unscoped write", !superNoId.ok && superNoId.status === 400);

const superList = resolveTenantScope(req(superToken));
check("super admin may list unscoped (read paths)", superList.ok && superList.restaurantId === null);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
