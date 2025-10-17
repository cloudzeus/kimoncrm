// @ts-nocheck
import { 
  redisSessions, 
  redisCache, 
  redisRateLimit, 
  redisEmailCache 
} from './client';

/**
 * Redis Database Management Utilities
 */

export const RedisDatabases = {
  SESSIONS: 0,      // Better-Auth sessions
  CACHE: 1,         // General application caching
  QUEUES: 2,        // BullMQ job queues
  RATE_LIMIT: 3,    // Rate limiting data
  EMAIL_CACHE: 4,   // Email caching and temp data
} as const;

export const RedisClients = {
  sessions: redisSessions,
  cache: redisCache,
  rateLimit: redisRateLimit,
  emailCache: redisEmailCache,
} as const;

export type RedisClientKey = keyof typeof RedisClients;

/**
 * Get Redis client for specific database
 */
export function getRedisClient(database: keyof typeof RedisClients) {
  return RedisClients[database];
}

/**
 * Clear specific Redis database
 */
export async function clearRedisDatabase(database: keyof typeof RedisClients) {
  const client = getRedisClient(database);
  try {
    await client.flushDb();
    console.log(`Cleared Redis database: ${database}`);
    return true;
  } catch (error) {
    console.error(`Failed to clear Redis database ${database}:`, error);
    return false;
  }
}

/**
 * Get Redis database info
 */
export async function getRedisDatabaseInfo() {
  const info = {};
  
  for (const [name, client] of Object.entries(RedisClients)) {
    try {
      const dbSize = await client.dbSize();
      const info_result = await client.info('memory');
      
      info[name] = {
        database: RedisDatabases[name.toUpperCase() as keyof typeof RedisDatabases],
        keys: dbSize,
        memory: info_result,
        connected: client.isReady,
      };
    } catch (error) {
      info[name] = {
        error: error.message,
        connected: false,
      };
    }
  }
  
  return info;
}

/**
 * Cache utilities with proper database separation
 */
export class RedisCacheManager {
  private client = redisCache;

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async clear(): Promise<void> {
    await this.client.flushDb();
  }

  async getStats(): Promise<{ keys: number; memory: string }> {
    const keys = await this.client.dbSize();
    const memory = await this.client.info('memory');
    return { keys, memory };
  }
}

/**
 * Email cache utilities
 */
export class EmailCacheManager {
  private client = redisEmailCache;

  async cacheEmailData(key: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    await this.client.setEx(key, ttlSeconds, JSON.stringify(data));
  }

  async getCachedEmailData(key: string): Promise<any | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheEmailList(userId: string, folderId: string, emails: any[], ttlSeconds: number = 300): Promise<void> {
    const key = `emails:${userId}:${folderId}`;
    await this.cacheEmailData(key, emails, ttlSeconds);
  }

  async getCachedEmailList(userId: string, folderId: string): Promise<any[] | null> {
    const key = `emails:${userId}:${folderId}`;
    return await this.getCachedEmailData(key);
  }

  async invalidateEmailCache(userId: string, folderId?: string): Promise<void> {
    if (folderId) {
      const key = `emails:${userId}:${folderId}`;
      await this.client.del(key);
    } else {
      // Clear all email cache for user
      const keys = await this.client.keys(`emails:${userId}:*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    }
  }

  async clear(): Promise<void> {
    await this.client.flushDb();
  }
}

// Export instances
export const cacheManager = new RedisCacheManager();
export const emailCacheManager = new EmailCacheManager();

/**
 * Health check for all Redis databases
 */
export async function redisHealthCheck() {
  const health = {
    overall: true,
    databases: {} as Record<string, any>,
  };

  for (const [name, client] of Object.entries(RedisClients)) {
    try {
      await client.ping();
      health.databases[name] = { status: 'healthy', connected: client.isReady };
    } catch (error) {
      health.databases[name] = { 
        status: 'unhealthy', 
        connected: false, 
        error: error.message 
      };
      health.overall = false;
    }
  }

  return health;
}
