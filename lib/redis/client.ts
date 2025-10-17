import { createClient } from 'redis';
import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// Skip Redis initialization during Next.js build phase
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

// Parse Redis URL to extract base connection info
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let baseUrl: string = 'redis://localhost:6379';
let password: string | undefined;

if (!isBuildTime) {
  try {
    const urlParts = new URL(redisUrl);
    baseUrl = `${urlParts.protocol}//${urlParts.host}`;
    password = urlParts.password;
  } catch (error) {
    console.warn('Redis URL parsing failed, using defaults');
  }
}

// Create base IORedis connection for BullMQ (lazy connect during build)
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: isBuildTime, // Don't connect during build
});

// Redis clients for different databases
export const redisSessions = createClient({
  url: `${baseUrl}/${process.env.REDIS_SESSIONS_DB || 0}`,
  password,
});

export const redisCache = createClient({
  url: `${baseUrl}/${process.env.REDIS_CACHE_DB || 1}`,
  password,
});

export const redisRateLimit = createClient({
  url: `${baseUrl}/${process.env.REDIS_RATE_LIMIT_DB || 3}`,
  password,
});

export const redisEmailCache = createClient({
  url: `${baseUrl}/${process.env.REDIS_EMAIL_CACHE_DB || 4}`,
  password,
});

// Default Redis client (for backward compatibility)
export const redis = redisCache;

// Error handling for all clients
[redisSessions, redisCache, redisRateLimit, redisEmailCache].forEach(client => {
  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });
});

// Connect all clients (skip during build time)
if (!isBuildTime) {
  Promise.all([
    redisSessions.connect(),
    redisCache.connect(),
    redisRateLimit.connect(),
    redisEmailCache.connect(),
  ]).catch(err => {
    console.error('Failed to connect to Redis:', err);
  });
}

// Queue instances
export const softoneFullQueue = new Queue('softone-full', { connection });
export const softoneDeltaQueue = new Queue('softone-delta', { connection });
export const slaCheckQueue = new Queue('sla-check', { connection });
export const emailRemindersQueue = new Queue('email-reminders', { connection });
export const calendarRemindersQueue = new Queue('calendar-reminders', { connection });
export const backupsQueue = new Queue('backups', { connection });
export const fonosterEventsQueue = new Queue('fonoster-events', { connection });

// Queue events
export const softoneFullEvents = new QueueEvents('softone-full', { connection });
export const softoneDeltaEvents = new QueueEvents('softone-delta', { connection });
export const slaCheckEvents = new QueueEvents('sla-check', { connection });
export const emailRemindersEvents = new QueueEvents('email-reminders', { connection });
export const calendarRemindersEvents = new QueueEvents('calendar-reminders', { connection });
export const backupsEvents = new QueueEvents('backups', { connection });
export const fonosterEventsEvents = new QueueEvents('fonoster-events', { connection });

export { Queue, Worker, QueueEvents, connection };
