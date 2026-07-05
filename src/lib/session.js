// Custom session cookie: no Supabase Auth, no email involved anywhere.
// A signed (HMAC-SHA256, Web Crypto so this also runs on the Edge runtime
// inside src/proxy.js) cookie holding { uid, exp }. Verified by
// recomputing/checking the signature against SESSION_SECRET.

export const SESSION_COOKIE_NAME = "kdp_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function encodeBase64Url(bytes) {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env var is not set");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(uid) {
  const payload = { uid, exp: Date.now() + SESSION_TTL_MS };
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, payloadBytes);
  return `${encodeBase64Url(payloadBytes)}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sigB64] = token.split(".");
  try {
    const payloadBytes = decodeBase64Url(payloadB64);
    const sigBytes = decodeBase64Url(sigB64);
    const key = await getKey();
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, payloadBytes);
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};
