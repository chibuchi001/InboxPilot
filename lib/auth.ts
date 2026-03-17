export const SESSION_COOKIE = "inboxpilot_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

async function hmac(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Creates a timestamped session token: "<issuedAt>.<hmac(secret, email:issuedAt)>"
 * The issuedAt is a Unix timestamp (seconds) embedded in the token so it can
 * be validated for age in the middleware, independent of the cookie's maxAge.
 */
export async function makeSessionToken(email: string, secret: string): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const sig = await hmac(secret, `${email.toLowerCase()}:${issuedAt}`);
  return `${issuedAt}.${sig}`;
}

/**
 * Verifies a session token. Returns true if the signature is valid and the
 * token was issued within SESSION_MAX_AGE seconds.
 */
export async function verifySessionToken(token: string, email: string, secret: string): Promise<boolean> {
  const dot = token.indexOf(".");
  if (dot === -1) return false;

  const issuedAt = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const age = Math.floor(Date.now() / 1000) - parseInt(issuedAt, 10);
  if (isNaN(age) || age < 0 || age > SESSION_MAX_AGE) return false;

  const expected = await hmac(secret, `${email.toLowerCase()}:${issuedAt}`);
  return expected === sig;
}

// In-memory rate limiter — resets on process restart.
// Sufficient for single-instance / container deployments.
// For multi-instance deployments, replace with a Redis-backed solution.
const _rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true if the key is within the allowed rate, false if it should be blocked.
 * @param key      Identifier to throttle (e.g. "login:<ip>")
 * @param max      Max allowed attempts per window (default 10)
 * @param windowMs Window duration in milliseconds (default 15 minutes)
 */
export function checkRateLimit(key: string, max = 10, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = _rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    _rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) return false;

  entry.count++;
  return true;
}
