import { redisRateLimit } from '@/lib/redis/client';

export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const windowKey = `${key}:${window}`;

  try {
    const current = await redisRateLimit.get(windowKey);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: (window + 1) * windowMs,
      };
    }

    await redisRateLimit.incr(windowKey);
    await redisRateLimit.expire(windowKey, Math.ceil(windowMs / 1000));

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetTime: (window + 1) * windowMs,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Allow request if Redis is down
    return {
      allowed: true,
      remaining: limit,
      resetTime: now + windowMs,
    };
  }
}

export async function checkRateLimit(
  request: Request,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  
  return rateLimit(ip, limit, windowMs);
}
