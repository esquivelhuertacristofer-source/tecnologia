// In-memory rate limiter for login attempts.
// WARNING: state is per-process — not shared across Vercel serverless instances.
// For multi-region / multi-instance deployments, migrate to Upstash Redis.

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Cleanup stale entries every hour to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of store.entries()) {
      if (now > bucket.resetAt) store.delete(key);
    }
  }, 60 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimitOptions {
  key: string;
  max: number;
  windowMs: number;
}

export function rateLimit({ key, max, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= max) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: max - bucket.count, resetAt: bucket.resetAt };
}

// Legacy wrapper — used by proxy.ts
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function checkLoginRateLimit(identifier: string): RateLimitResult {
  return rateLimit({ key: identifier, max: MAX_ATTEMPTS, windowMs: WINDOW_MS });
}
