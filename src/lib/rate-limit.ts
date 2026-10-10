import { envNumber } from "./utils";

/**
 * In-memory sliding-window rate limiter for `POST /api/contact`.
 *
 * Honest trade-off: on serverless platforms (Vercel) memory is per-instance and
 * short-lived, so this is a best-effort throttle that stops bursts and naive
 * scripts rather than a distributed guarantee. For hard limits, put the same
 * check behind Upstash/Redis or Vercel's edge middleware — the call signature
 * (`consume`) is designed to be swappable.
 */

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    const hits = bucket.hits.filter((at) => now - at < windowMs);
    if (hits.length === 0) buckets.delete(key);
    else bucket.hits = hits;
  }
  // Hard ceiling so a hostile key space can't grow the map unbounded.
  if (buckets.size > 10_000) buckets.clear();
}

export type RateLimitConfig = { max: number; windowMs: number };

export function getRateLimitConfig(): RateLimitConfig {
  return {
    max: envNumber(process.env.CONTACT_RATE_LIMIT_MAX, 5),
    windowMs: envNumber(process.env.CONTACT_RATE_LIMIT_WINDOW_MS, 600_000),
  };
}

/**
 * Second, looser ceiling applied to *every* authenticated attempt (including
 * ones that fail validation). A few typos shouldn't lock a real person out of
 * the success budget, but hammering the endpoint should still stop.
 */
export function getAbuseConfig(): RateLimitConfig {
  const base = getRateLimitConfig();
  return { max: base.max * 4, windowMs: base.windowMs };
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterMs: number;
};

export function consume(key: string, config: RateLimitConfig = getRateLimitConfig(), now = Date.now()): RateLimitResult {
  sweep(now, config.windowMs);

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((at) => now - at < config.windowMs);

  if (bucket.hits.length >= config.max) {
    buckets.set(key, bucket);
    const oldest = bucket.hits[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      limit: config.max,
      retryAfterMs: Math.max(1000, config.windowMs - (now - oldest)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  return {
    allowed: true,
    remaining: Math.max(0, config.max - bucket.hits.length),
    limit: config.max,
    retryAfterMs: 0,
  };
}

/** Test/ops helper. */
export function resetRateLimits(): void {
  buckets.clear();
}
