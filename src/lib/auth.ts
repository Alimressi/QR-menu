import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Single signed session cookie. Everything the server trusts about the caller
// (role + which restaurant they own) lives inside the signed payload, so it
// cannot be forged or edited from the browser.
export const SESSION_COOKIE_NAME = "qrm_admin_session";

// Pre-rewrite cookies. They carried a constant, publicly known value and are
// no longer accepted — only deleted, so stale browsers get logged out cleanly.
const LEGACY_COOKIE_NAMES = [
  "admin_session",
  "admin_role",
  "admin_restaurant_id",
  "super_admin_session",
  "restaurant_admin_session",
  "restaurant_admin_restaurant_id",
] as const;

const SESSION_VERSION = "v1";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;

const SUPER_ADMIN_LOGIN = process.env.SUPER_ADMIN_LOGIN || "superadmin";

export type UserRole = "SUPER_ADMIN" | "RESTAURANT_ADMIN";

export type AdminSession = {
  role: UserRole;
  restaurantId: number | null;
};

type SessionPayload = {
  role: UserRole;
  rid?: number;
  iat: number;
  exp: number;
};

// Signing key. ADMIN_SESSION_SECRET is preferred; QR_TOKEN_SECRET is accepted so
// an existing deployment keeps working. In production we refuse to fall back to
// a hardcoded value: without a secret, sessions simply cannot be issued or
// verified (fail closed) rather than being signed with a key anyone can read.
function getSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.QR_TOKEN_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return "dev-admin-session-secret-change-me";
}

function sign(encodedPayload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}

export function createSessionToken(role: UserRole, restaurantId?: number | null) {
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  const now = Date.now();
  const payload: SessionPayload = {
    role,
    ...(role === "RESTAURANT_ADMIN" && restaurantId ? { rid: restaurantId } : {}),
    iat: now,
    exp: now + SESSION_TTL_MS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

  return `${SESSION_VERSION}.${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifySessionToken(token: string | undefined | null): AdminSession | null {
  if (!token) {
    return null;
  }

  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [version, encodedPayload, signature] = parts;
  if (version !== SESSION_VERSION) {
    return null;
  }

  if (!safeEqual(signature, sign(encodedPayload, secret))) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (parsed?.role !== "SUPER_ADMIN" && parsed?.role !== "RESTAURANT_ADMIN") {
      return null;
    }

    if (typeof parsed.exp !== "number" || parsed.exp <= Date.now()) {
      return null;
    }

    // A restaurant admin session is meaningless without its tenant id — reject
    // it rather than letting the caller fall through to an unscoped query.
    const restaurantId = typeof parsed.rid === "number" && parsed.rid > 0 ? parsed.rid : null;
    if (parsed.role === "RESTAURANT_ADMIN" && !restaurantId) {
      return null;
    }

    return {
      role: parsed.role,
      restaurantId: parsed.role === "SUPER_ADMIN" ? null : restaurantId,
    };
  } catch {
    return null;
  }
}

export function getSession(request: NextRequest): AdminSession | null {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export async function getSessionFromCookies(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

/**
 * The single tenant-isolation gate every write route goes through.
 *
 * A RESTAURANT_ADMIN is always pinned to the restaurant baked into their signed
 * session — a `restaurantId` sent in the request body or query string is only
 * ever allowed to *match* it, never to replace it. A SUPER_ADMIN may act on any
 * restaurant, but must name it explicitly when the route needs one.
 */
export function resolveTenantScope(
  request: NextRequest,
  requestedRestaurantId?: unknown,
):
  | { ok: true; role: UserRole; restaurantId: number | null }
  | { ok: false; status: 400 | 401 | 403; error: string } {
  const session = getSession(request);

  if (!session) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const requested = Number.parseInt(String(requestedRestaurantId ?? ""), 10);
  const hasRequested = Number.isInteger(requested) && requested > 0;

  if (session.role === "RESTAURANT_ADMIN") {
    if (hasRequested && requested !== session.restaurantId) {
      return { ok: false, status: 403, error: "Forbidden: restaurant mismatch." };
    }

    return { ok: true, role: session.role, restaurantId: session.restaurantId };
  }

  return {
    ok: true,
    role: session.role,
    restaurantId: hasRequested ? requested : null,
  };
}

/** Same as `resolveTenantScope`, but the route cannot proceed without a tenant. */
export function requireTenantScope(
  request: NextRequest,
  requestedRestaurantId?: unknown,
):
  | { ok: true; role: UserRole; restaurantId: number }
  | { ok: false; status: 400 | 401 | 403; error: string } {
  const scope = resolveTenantScope(request, requestedRestaurantId);

  if (!scope.ok) {
    return scope;
  }

  if (!scope.restaurantId) {
    return { ok: false, status: 400, error: "restaurantId is required." };
  }

  return { ok: true, role: scope.role, restaurantId: scope.restaurantId };
}

function isBcryptHash(value: string) {
  return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
}

async function verifyPassword(candidate: string, passwordOrHash: string) {
  if (isBcryptHash(passwordOrHash)) {
    return bcrypt.compare(candidate, passwordOrHash);
  }

  // Legacy restaurants seeded with a plaintext `adminPassword` in their settings
  // JSON. Kept so existing tenants can still log in; re-saving the password from
  // the super-admin panel replaces it with a bcrypt hash.
  return safeEqual(candidate, passwordOrHash);
}

function getRestaurantAdminCredentialsFromSettings(settingsRaw?: string | null) {
  if (!settingsRaw) {
    return null;
  }

  try {
    const parsed = JSON.parse(settingsRaw) as {
      adminLogin?: unknown;
      adminPasswordHash?: unknown;
      adminPassword?: unknown;
    };

    const adminLogin = typeof parsed.adminLogin === "string" ? parsed.adminLogin.trim() : "";
    const adminPasswordHash =
      typeof parsed.adminPasswordHash === "string" ? parsed.adminPasswordHash.trim() : "";
    const adminPassword = typeof parsed.adminPassword === "string" ? parsed.adminPassword.trim() : "";
    const passwordOrHash = adminPasswordHash || adminPassword;

    if (!adminLogin || !passwordOrHash) {
      return null;
    }

    return { login: adminLogin, passwordOrHash };
  } catch {
    return null;
  }
}

export async function validateAdminCredentials(
  login: string,
  password: string,
  restaurantSettings?: string | null,
) {
  const credentials = getRestaurantAdminCredentialsFromSettings(restaurantSettings);
  if (!credentials) {
    return null;
  }

  if (!safeEqual(login, credentials.login)) {
    return null;
  }

  const isValid = await verifyPassword(password, credentials.passwordOrHash);
  return isValid ? { role: "RESTAURANT_ADMIN" as UserRole } : null;
}

export async function validateSuperAdminCredentials(login: string, password: string) {
  // No hardcoded default: an unset SUPER_ADMIN_PASSWORD means nobody can sign in
  // as super admin, instead of everybody being able to.
  const expectedPassword = process.env.SUPER_ADMIN_PASSWORD;
  if (!expectedPassword) {
    return null;
  }

  if (!safeEqual(login, SUPER_ADMIN_LOGIN)) {
    return null;
  }

  const isValid = await verifyPassword(password, expectedPassword);
  return isValid ? { role: "SUPER_ADMIN" as UserRole } : null;
}

export async function setAdminSessionCookie(role: UserRole, restaurantId?: number) {
  const token = createSessionToken(role, restaurantId);
  if (!token) {
    return false;
  }

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  for (const name of LEGACY_COOKIE_NAMES) {
    cookieStore.delete(name);
  }

  return true;
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  for (const name of LEGACY_COOKIE_NAMES) {
    cookieStore.delete(name);
  }
}

export function isAdminRequest(request: NextRequest) {
  return getSession(request) !== null;
}

export function getUserRole(request: NextRequest): UserRole | null {
  return getSession(request)?.role ?? null;
}

export function getUserRestaurantId(request: NextRequest): number | null {
  return getSession(request)?.restaurantId ?? null;
}

export function isSuperAdmin(request: NextRequest): boolean {
  return getSession(request)?.role === "SUPER_ADMIN";
}

export function isRestaurantAdmin(request: NextRequest): boolean {
  return getSession(request)?.role === "RESTAURANT_ADMIN";
}

export async function isAdminSessionActive() {
  return (await getSessionFromCookies()) !== null;
}

export async function getCurrentUserInfo() {
  const session = await getSessionFromCookies();

  if (!session) {
    return null;
  }

  return {
    role: session.role,
    restaurantId: session.restaurantId ?? undefined,
  };
}
