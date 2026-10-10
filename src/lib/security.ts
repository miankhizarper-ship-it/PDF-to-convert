import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sanitisation + anti-spam primitives for the contact API.
 * Server-only: uses `node:crypto`.
 */

/** C0/C1 control characters, zero-width joiners and BOM. */
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u00AD\u200B-\u200F\u2028\u2029\u2060\uFEFF]/g;

/** Markup is detected (without /g, so `.test` has no lastIndex state) and rejected. */
const MARKUP = /<[a-zA-Z!/][^>]*>/;

/** Belt-and-braces: anything tag-like is also stripped before storage. */
const TAGS = /<[^>]*>/g;

/** Cheap URL/script payload detection for the message body. */
const SUSPICIOUS = /(javascript:|data:text\/html|<script|\bunion\s+select\b|\bdrop\s+table\b)/i;

export type SanitizeOptions = {
  maxLength: number;
  /** Allow line breaks (message body). When false they are collapsed to spaces. */
  multiline?: boolean;
};

/**
 * Normalises and strips a free-text field.
 * Returns `null` when the result is empty or still contains an injection payload.
 */
export function sanitizeText(raw: unknown, options: SanitizeOptions): string | null {
  if (typeof raw !== "string") return null;

  // Reject markup and injection payloads instead of silently rewriting the text.
  if (MARKUP.test(raw) || SUSPICIOUS.test(raw)) return null;

  let value = raw.normalize("NFKC").replace(INVISIBLE, "").replace(TAGS, " ");

  if (options.multiline) {
    value = value.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ");
  } else {
    value = value.replace(/\s+/g, " ");
  }

  value = value.trim().slice(0, options.maxLength);
  if (!value) return null;
  if (SUSPICIOUS.test(value)) return null;

  return value;
}

export function sanitizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().toLowerCase().slice(0, 254);
  // Deliberately conservative: one @, no whitespace, a dot in the domain.
  if (!/^[^\s@,;:<>()[\]\\]+@[^\s@,;:<>()[\]\\]+\.[a-z]{2,}$/i.test(value)) return null;
  return value;
}

/** Rejects obviously disposable/injection-style values in short fields. */
export function sanitizeShort(raw: unknown, maxLength: number): string | null {
  const value = sanitizeText(raw, { maxLength });
  if (!value) return null;
  return value;
}

/* ── Signed form token (proof the form was served by us) ────────── */

const TOKEN_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours to fill the form in
const TOKEN_MIN_AGE_MS = 1500; // submitted faster than a human can read

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Issues `<issuedAt>.<signature>` — rendered into the form by a server component. */
export function createFormToken(secret: string, issuedAt: number = Date.now()): string {
  return `${issuedAt}.${sign(secret, String(issuedAt))}`;
}

export type TokenVerdict = { valid: true } | { valid: false; reason: "malformed" | "expired" | "signature" | "too-fast" };

export function verifyFormToken(token: unknown, secret: string, now: number = Date.now()): TokenVerdict {
  if (typeof token !== "string" || !token.includes(".")) return { valid: false, reason: "malformed" };

  const [rawIssuedAt, signature] = token.split(".") as [string, string];
  const issuedAt = Number(rawIssuedAt);
  if (!Number.isFinite(issuedAt) || !signature) return { valid: false, reason: "malformed" };

  const expected = Buffer.from(sign(secret, rawIssuedAt));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return { valid: false, reason: "signature" };
  }

  const age = now - issuedAt;
  if (age < 0 || age > TOKEN_TTL_MS) return { valid: false, reason: "expired" };
  if (age < TOKEN_MIN_AGE_MS) return { valid: false, reason: "too-fast" };

  return { valid: true };
}
