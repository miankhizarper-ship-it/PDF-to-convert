import { NextResponse, type NextRequest } from "next/server";
import { isMongoConfigured, insertContactMessage } from "@/lib/mongodb";
import { consume, getAbuseConfig, getRateLimitConfig } from "@/lib/rate-limit";
import { sanitizeEmail, sanitizeText, verifyFormToken } from "@/lib/security";
import type { ContactFailure, ContactPayload, ContactSuccess } from "@/lib/contact-contract";
import { BUDGETS, LIMITS, PROJECT_TYPES, TIMELINES, validateContact, type ContactErrors } from "@/lib/validation";

/**
 * POST /api/contact
 *
 * Defence in depth, in order of cost:
 *   1. content-type + body-size guard
 *   2. HMAC-signed form token (proves the form was served by us, and that a
 *      human had at least ~1.5s to read it)
 *   3. per-IP abuse ceiling (counts every authenticated attempt)
 *   4. honeypot field
 *   5. sanitisation → validation
 *   6. per-IP success budget (only valid submissions consume it)
 *   7. write to MongoDB Atlas (secrets stay server-side)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 12_000;

function json(body: ContactSuccess | ContactFailure, status: number, headers?: Record<string, string>) {
  return NextResponse.json(body, { status, headers });
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function rateLimited(retryAfterMs: number) {
  const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
  return json(
    {
      ok: false,
      error: `Too many messages from this network. Try again in about ${Math.max(1, Math.ceil(retryAfterSeconds / 60))} minute(s).`,
      retryAfterMs,
    },
    429,
    { "Retry-After": String(retryAfterSeconds), "X-RateLimit-Remaining": "0" },
  );
}

function pick<T extends string>(payload: Record<string, unknown>, key: string, allowList: readonly T[]): T | "" {
  const value = payload[key];
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return allowList.includes(trimmed as T) ? (trimmed as T) : "";
}

export async function POST(request: NextRequest) {
  try {
    /* 1 — content type + size */
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return json({ ok: false, error: "Expected a JSON body." }, 415);
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json({ ok: false, error: "Message is too large." }, 413);
    }

    let payload: ContactPayload;
    try {
      payload = JSON.parse(raw) as ContactPayload;
    } catch {
      return json({ ok: false, error: "Malformed request body." }, 400);
    }

    const ip = getClientIp(request);

    /* 2 — signed token */
    const secret = process.env.CONTACT_FORM_SECRET;
    if (!secret) {
      console.error("[contact] CONTACT_FORM_SECRET is not configured");
      return json({ ok: false, error: "The form is misconfigured on the server. Please email me directly." }, 500);
    }

    const verdict = verifyFormToken(payload.token, secret);
    if (!verdict.valid) {
      const message =
        verdict.reason === "expired"
          ? "This form session expired. Please reload the page and try again."
          : verdict.reason === "too-fast"
            ? "That was faster than a human could type. Please try again."
            : "Your session could not be verified. Please reload the page and try again.";
      return json({ ok: false, error: message }, 400);
    }

    /* 3 — abuse ceiling: counts every authenticated attempt */
    const abuseConfig = getAbuseConfig();
    const abuse = consume(`abuse:${ip}`, abuseConfig);
    if (!abuse.allowed) {
      return rateLimited(abuse.retryAfterMs);
    }

    /* 4 — honeypot: answer 200 so bots learn nothing */
    if (typeof payload.website === "string" && payload.website.trim().length > 0) {
      console.info("[contact] honeypot triggered — submission discarded");
      return json({ ok: true, persisted: false, receivedAt: new Date().toISOString() }, 200);
    }

    /* 5 — sanitise, then validate */
    const fieldErrors: ContactErrors = {};

    const name = sanitizeText(payload.name, { maxLength: LIMITS.name.max });
    if (!name) fieldErrors.name = "Please enter your name.";

    const email = sanitizeEmail(payload.email);
    if (!email) fieldErrors.email = "Please enter a valid email address.";

    const subject = sanitizeText(payload.subject, { maxLength: LIMITS.subject.max });
    if (!subject) fieldErrors.subject = "Please add a short subject.";

    const message = sanitizeText(payload.message, { maxLength: LIMITS.message.max, multiline: true });
    if (!message) fieldErrors.message = "Please write a message (plain text only).";

    if (Object.keys(fieldErrors).length > 0) {
      return json({ ok: false, error: "Some fields need attention.", fieldErrors }, 422);
    }

    const body = payload as unknown as Record<string, unknown>;
    const projectType = pick(body, "projectType", PROJECT_TYPES);
    const budget = pick(body, "budget", BUDGETS);
    const timeline = pick(body, "timeline", TIMELINES);

    const checked = validateContact({
      name: name as string,
      email: email as string,
      subject: subject as string,
      message: message as string,
      projectType,
      budget,
      timeline,
    });

    if (!checked.valid) {
      return json({ ok: false, error: "Some fields need attention.", fieldErrors: checked.errors }, 422);
    }

    /* 6 — persist */
    const record = {
      name: name as string,
      email: email as string,
      subject: subject as string,
      message: message as string,
      projectType,
      budget,
      timeline,
      ip,
      userAgent: (request.headers.get("user-agent") ?? "unknown").slice(0, 300),
      referer: (request.headers.get("referer") ?? "unknown").slice(0, 300),
    };

    // Success budget: only fully valid submissions consume it.
    const config = getRateLimitConfig();
    const limit = consume(`contact:${ip}`, config);
    if (!limit.allowed) {
      return rateLimited(limit.retryAfterMs);
    }

    if (isMongoConfigured()) {
      const { id } = await insertContactMessage(record);
      console.info(`[contact] stored submission ${id} from ${record.email}`);
      return json({ ok: true, persisted: true, id, receivedAt: new Date().toISOString() }, 201, {
        "X-RateLimit-Remaining": String(limit.remaining),
      });
    }

    const allowLogOnly = process.env.CONTACT_ALLOW_LOG_ONLY === "true";

    if (process.env.NODE_ENV === "production" && !allowLogOnly) {
      console.error("[contact] MONGODB_URI is not configured — refusing to pretend the message was stored");
      return json({ ok: false, error: "Message storage is offline. Please email me directly." }, 503);
    }

    // No database available: log it, and tell the caller nothing was persisted.
    // Opt in explicitly with CONTACT_ALLOW_LOG_ONLY=true outside development.
    console.warn("[contact] MONGODB_URI not set — submission logged only:", JSON.stringify(record, null, 2));
    return json({ ok: true, persisted: false, receivedAt: new Date().toISOString() }, 201);
  } catch (error) {
    console.error("[contact] unexpected failure:", error);
    return json({ ok: false, error: "Something went wrong on my side. Please try again shortly." }, 500);
  }
}

/** Cheap health check — useful after deploying to confirm the route is live. */
export async function GET() {
  return json(
    {
      ok: true,
      endpoint: "POST /api/contact",
      storage: isMongoConfigured()
        ? "mongodb"
        : process.env.CONTACT_ALLOW_LOG_ONLY === "true" || process.env.NODE_ENV !== "production"
          ? "log-only"
          : "unavailable",
      rateLimit: getRateLimitConfig(),
      abuseLimit: getAbuseConfig(),
    } as unknown as ContactSuccess,
    200,
  );
}
