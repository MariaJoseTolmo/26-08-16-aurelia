import type { NextFunction, Request, Response } from 'express';
import type { DataSource } from 'typeorm';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitEntry> | RateLimitEntry;
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  store?: RateLimitStore;
}

export function securityHeaders(_request: Request, response: Response, next: NextFunction): void {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  next();
}

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, RateLimitEntry>();

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || current.resetAt <= now) {
      const next = { count: 1, resetAt: now + windowMs };
      this.buckets.set(key, next);
      return next;
    }

    current.count += 1;
    return current;
  }
}

export class DatabaseRateLimitStore implements RateLimitStore {
  constructor(private readonly dataSource: DataSource) {}

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const resetAt = new Date(Date.now() + windowMs);
    const rows = await this.dataSource.query(
      `INSERT INTO rate_limit_buckets ("key", count, reset_at)
       VALUES ($1, 1, $2)
       ON CONFLICT ("key") DO UPDATE
       SET count = CASE
             WHEN rate_limit_buckets.reset_at <= now() THEN 1
             ELSE rate_limit_buckets.count + 1
           END,
           reset_at = CASE
             WHEN rate_limit_buckets.reset_at <= now() THEN EXCLUDED.reset_at
             ELSE rate_limit_buckets.reset_at
           END,
           updated_at = now()
       RETURNING count, reset_at`,
      [key, resetAt],
    ) as Array<{ count: number | string; reset_at: Date | string }>;

    const row = rows[0];
    return {
      count: Number(row.count),
      resetAt: new Date(row.reset_at).getTime(),
    };
  }
}

export function createRateLimit(options: RateLimitOptions) {
  const store = options.store ?? new MemoryRateLimitStore();

  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const key = `${request.ip}:${request.method}:${request.path}`;

    try {
      const current = await store.increment(key, options.windowMs);
      response.setHeader('X-RateLimit-Limit', String(options.max));
      response.setHeader('X-RateLimit-Remaining', String(Math.max(options.max - current.count, 0)));
      response.setHeader('X-RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)));

      if (current.count > options.max) {
        response.status(429).json({ statusCode: 429, message: 'Too many requests' });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
