import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_ROLE_COOKIE_NAME = "admin_role";
export const ADMIN_RESTAURANT_COOKIE_NAME = "admin_restaurant_id";

export const SUPER_ADMIN_COOKIE_NAME = "super_admin_session";
export const RESTAURANT_ADMIN_COOKIE_NAME = "restaurant_admin_session";
export const RESTAURANT_ADMIN_RESTAURANT_COOKIE_NAME = "restaurant_admin_restaurant_id";

const LEGACY_ADMIN_COOKIE_VALUE = process.env.ADMIN_SESSION_TOKEN || "restaurant-admin-session";
const SUPER_ADMIN_COOKIE_VALUE = process.env.SUPER_ADMIN_SESSION_TOKEN || "super-admin-session";
const RESTAURANT_ADMIN_COOKIE_VALUE =
  process.env.RESTAURANT_ADMIN_SESSION_TOKEN || "restaurant-admin-session";

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const SUPER_ADMIN_LOGIN = process.env.SUPER_ADMIN_LOGIN || "superadmin";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "superadmin123";

export type UserRole = "SUPER_ADMIN" | "RESTAURANT_ADMIN";

function isBcryptHash(value: string) {
  return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
}

async function verifyPassword(candidate: string, passwordOrHash: string) {
  if (isBcryptHash(passwordOrHash)) {
    return bcrypt.compare(candidate, passwordOrHash);
  }

  return candidate === passwordOrHash;
}

function hasValidSuperAdminSession(request: NextRequest) {
  const superAdminSession = request.cookies.get(SUPER_ADMIN_COOKIE_NAME)?.value;
  if (superAdminSession === SUPER_ADMIN_COOKIE_VALUE) {
    return true;
  }

  const legacySession = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const legacyRole = request.cookies.get(ADMIN_ROLE_COOKIE_NAME)?.value;
  return legacySession === LEGACY_ADMIN_COOKIE_VALUE && legacyRole === "SUPER_ADMIN";
}

function hasValidRestaurantAdminSession(request: NextRequest) {
  const restaurantAdminSession = request.cookies.get(RESTAURANT_ADMIN_COOKIE_NAME)?.value;
  if (restaurantAdminSession === RESTAURANT_ADMIN_COOKIE_VALUE) {
    return true;
  }

  const legacySession = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const legacyRole = request.cookies.get(ADMIN_ROLE_COOKIE_NAME)?.value;
  return legacySession === LEGACY_ADMIN_COOKIE_VALUE && legacyRole === "RESTAURANT_ADMIN";
}

function getRoleFromCookieStore(cookieStore: Awaited<ReturnType<typeof cookies>>): UserRole | null {
  const superAdminSession = cookieStore.get(SUPER_ADMIN_COOKIE_NAME)?.value;
  if (superAdminSession === SUPER_ADMIN_COOKIE_VALUE) {
    return "SUPER_ADMIN";
  }

  const restaurantAdminSession = cookieStore.get(RESTAURANT_ADMIN_COOKIE_NAME)?.value;
  if (restaurantAdminSession === RESTAURANT_ADMIN_COOKIE_VALUE) {
    return "RESTAURANT_ADMIN";
  }

  const legacySession = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const legacyRole = cookieStore.get(ADMIN_ROLE_COOKIE_NAME)?.value;

  if (legacySession === LEGACY_ADMIN_COOKIE_VALUE && (legacyRole === "SUPER_ADMIN" || legacyRole === "RESTAURANT_ADMIN")) {
    return legacyRole;
  }

  return null;
}

function getRestaurantIdFromCookieStore(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const restaurantId = cookieStore.get(RESTAURANT_ADMIN_RESTAURANT_COOKIE_NAME)?.value;
  if (restaurantId) {
    return Number(restaurantId);
  }

  const legacyRestaurantId = cookieStore.get(ADMIN_RESTAURANT_COOKIE_NAME)?.value;
  return legacyRestaurantId ? Number(legacyRestaurantId) : null;
}

export async function validateAdminCredentials(login: string, password: string) {
  if (login !== ADMIN_LOGIN) {
    return null;
  }

  const isValid = await verifyPassword(password, ADMIN_PASSWORD);
  if (isValid) {
    return { role: "RESTAURANT_ADMIN" as UserRole };
  }

  return null;
}

export async function validateSuperAdminCredentials(login: string, password: string) {
  if (login !== SUPER_ADMIN_LOGIN) {
    return null;
  }

  const isValid = await verifyPassword(password, SUPER_ADMIN_PASSWORD);
  if (isValid) {
    return { role: "SUPER_ADMIN" as UserRole };
  }

  return null;
}

export async function setAdminSessionCookie(role: UserRole, restaurantId?: number) {
  const cookieStore = await cookies();
  const commonCookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  };

  if (role === "SUPER_ADMIN") {
    cookieStore.delete(RESTAURANT_ADMIN_COOKIE_NAME);
    cookieStore.delete(RESTAURANT_ADMIN_RESTAURANT_COOKIE_NAME);
    cookieStore.set(SUPER_ADMIN_COOKIE_NAME, SUPER_ADMIN_COOKIE_VALUE, commonCookieOptions);
  }

  if (role === "RESTAURANT_ADMIN") {
    cookieStore.delete(SUPER_ADMIN_COOKIE_NAME);
    cookieStore.set(RESTAURANT_ADMIN_COOKIE_NAME, RESTAURANT_ADMIN_COOKIE_VALUE, commonCookieOptions);
    if (restaurantId) {
      cookieStore.set(RESTAURANT_ADMIN_RESTAURANT_COOKIE_NAME, String(restaurantId), {
        ...commonCookieOptions,
      });
    }
  }

  // Clear old shared cookies to prevent cross-role conflicts.
  cookieStore.delete(ADMIN_COOKIE_NAME);
  cookieStore.delete(ADMIN_ROLE_COOKIE_NAME);
  cookieStore.delete(ADMIN_RESTAURANT_COOKIE_NAME);
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  cookieStore.delete(ADMIN_ROLE_COOKIE_NAME);
  cookieStore.delete(ADMIN_RESTAURANT_COOKIE_NAME);
  cookieStore.delete(SUPER_ADMIN_COOKIE_NAME);
  cookieStore.delete(RESTAURANT_ADMIN_COOKIE_NAME);
  cookieStore.delete(RESTAURANT_ADMIN_RESTAURANT_COOKIE_NAME);
}

export function isAdminRequest(request: NextRequest) {
  return hasValidSuperAdminSession(request) || hasValidRestaurantAdminSession(request);
}

export function getUserRole(request: NextRequest): UserRole | null {
  if (hasValidSuperAdminSession(request)) {
    return "SUPER_ADMIN";
  }

  if (hasValidRestaurantAdminSession(request)) {
    return "RESTAURANT_ADMIN";
  }

  return null;
}

export function getUserRestaurantId(request: NextRequest): number | null {
  const restaurantId = request.cookies.get(RESTAURANT_ADMIN_RESTAURANT_COOKIE_NAME)?.value;
  if (restaurantId) {
    return Number(restaurantId);
  }

  const legacyRestaurantId = request.cookies.get(ADMIN_RESTAURANT_COOKIE_NAME)?.value;
  return legacyRestaurantId ? Number(legacyRestaurantId) : null;
}

export function isSuperAdmin(request: NextRequest): boolean {
  return hasValidSuperAdminSession(request);
}

export function isRestaurantAdmin(request: NextRequest): boolean {
  return hasValidRestaurantAdminSession(request);
}

export async function isAdminSessionActive() {
  const cookieStore = await cookies();
  return getRoleFromCookieStore(cookieStore) !== null;
}

export async function getCurrentUserInfo() {
  const cookieStore = await cookies();
  const role = getRoleFromCookieStore(cookieStore);

  if (!role) {
    return null;
  }

  const restaurantId = getRestaurantIdFromCookieStore(cookieStore);
  return {
    role,
    restaurantId: restaurantId ?? undefined,
  };
}
