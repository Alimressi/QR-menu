import crypto from "crypto";

type QrTokenPayload = {
  t: string;
  r: number;
  iat: number;
  exp?: number;
};

const QR_TOKEN_VERSION = "v1";

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getQrTokenSecret() {
  return process.env.QR_TOKEN_SECRET || process.env.ADMIN_SESSION_TOKEN || "dev-qr-token-secret-change-me";
}

function signPayload(encodedPayload: string) {
  return crypto.createHmac("sha256", getQrTokenSecret()).update(encodedPayload).digest("base64url");
}

function getTableAccessKeySecret() {
  return process.env.QR_TABLE_KEY_SECRET || getQrTokenSecret();
}

export function createTableAccessKey(tableNumber: string, restaurantScope: string) {
  return crypto
    .createHmac("sha256", getTableAccessKeySecret())
    .update(`restaurant:${restaurantScope}|table:${tableNumber}`)
    .digest("base64url")
}

export function verifyTableAccessKey(tableNumber: string, restaurantScope: string, accessKey: string) {
  const expected = createTableAccessKey(tableNumber, restaurantScope);
  return accessKey === expected;
}

export function createQrSessionToken(tableNumber: string, restaurantId: number) {
  const payload: QrTokenPayload = {
    t: tableNumber,
    r: restaurantId,
    iat: Date.now(),
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${QR_TOKEN_VERSION}.${encodedPayload}.${signature}`;
}

export function verifyQrSessionToken(token: string): { tableNumber: string; restaurantId: number; issuedAt: number } | null {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [version, encodedPayload, signature] = parts;

  if (version !== QR_TOKEN_VERSION) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as QrTokenPayload;

    if (
      !parsed ||
      typeof parsed.t !== "string" ||
      typeof parsed.r !== "number" ||
      typeof parsed.iat !== "number"
    ) {
      return null;
    }

    if (typeof parsed.exp === "number" && parsed.exp <= Date.now()) {
      return null;
    }

    return {
      tableNumber: parsed.t,
      restaurantId: parsed.r,
      issuedAt: parsed.iat,
    };
  } catch {
    return null;
  }
}

export function decodeQrTokenPayload(token: string): { tableNumber: string; restaurantId: number; issuedAt: number } | null {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(parts[1])) as QrTokenPayload;

    if (
      !parsed ||
      typeof parsed.t !== "string" ||
      typeof parsed.r !== "number" ||
      typeof parsed.iat !== "number"
    ) {
      return null;
    }

    return {
      tableNumber: parsed.t,
      restaurantId: parsed.r,
      issuedAt: parsed.iat,
    };
  } catch {
    return null;
  }
}
