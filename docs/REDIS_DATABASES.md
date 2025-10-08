# Redis Database Configuration

This document explains the Redis database structure and organization in the CRM application.

## 🗂️ Database Structure

The application uses **multiple Redis databases** to organize different types of data:

| Database | Number | Purpose | Client |
|----------|--------|---------|---------|
| **Sessions** | `0` | Better-Auth user sessions | `redisSessions` |
| **Cache** | `1` | General application caching | `redisCache` |
| **Queues** | `2` | BullMQ job queues | `connection` (IORedis) |
| **Rate Limit** | `3` | API rate limiting data | `redisRateLimit` |
| **Email Cache** | `4` | Email caching and temp data | `redisEmailCache` |

## 🔧 Configuration

### Environment Variables

```env
# Base Redis connection
REDIS_URL=redis://default:password@host:port

# Database assignments
REDIS_SESSIONS_DB=0      # Better-Auth sessions
REDIS_CACHE_DB=1         # General application caching
REDIS_QUEUES_DB=2        # BullMQ job queues
REDIS_RATE_LIMIT_DB=3    # Rate limiting data
REDIS_EMAIL_CACHE_DB=4   # Email caching and temp data
```

### Connection URLs

The application automatically constructs database-specific URLs:
- **Sessions**: `redis://host:port/0`
- **Cache**: `redis://host:port/1`
- **Rate Limit**: `redis://host:port/3`
- **Email Cache**: `redis://host:port/4`

## 📊 Database Details

### Database 0: Sessions
- **Purpose**: User authentication sessions
- **Client**: `redisSessions`
- **TTL**: 7 days (configurable)
- **Keys**: `session:*`, `user:*`
- **Usage**: Better-Auth session storage

### Database 1: Cache
- **Purpose**: General application caching
- **Client**: `redisCache` (default `redis`)
- **TTL**: Variable (1 hour to 24 hours)
- **Keys**: `cache:*`, `temp:*`
- **Usage**: API responses, computed data, temporary storage

### Database 2: Queues
- **Purpose**: Background job processing
- **Client**: `connection` (IORedis for BullMQ)
- **TTL**: Until job completion
- **Keys**: `bull:*`, `queue:*`
- **Usage**: BullMQ job queues, job events

### Database 3: Rate Limit
- **Purpose**: API rate limiting
- **Client**: `redisRateLimit`
- **TTL**: Sliding window (1 minute to 1 hour)
- **Keys**: `rate_limit:*`
- **Usage**: Request throttling, abuse prevention

### Database 4: Email Cache
- **Purpose**: Email data caching
- **Client**: `redisEmailCache`
- **TTL**: 5 minutes to 1 hour
- **Keys**: `emails:*`, `attachments:*`
- **Usage**: Email lists, attachment metadata, temporary email data

## 🛠️ Usage Examples

### Cache Management

```typescript
import { cacheManager } from '@/lib/redis/utils';

// Store data in cache
await cacheManager.set('user:123', JSON.stringify(userData), 3600);

// Retrieve data from cache
const userData = await cacheManager.get('user:123');

// Check if key exists
const exists = await cacheManager.exists('user:123');
```

### Email Caching

```typescript
import { emailCacheManager } from '@/lib/redis/utils';

// Cache email list
await emailCacheManager.cacheEmailList('user123', 'inbox', emails, 300);

// Get cached email list
const emails = await emailCacheManager.getCachedEmailList('user123', 'inbox');

// Invalidate email cache
await emailCacheManager.invalidateEmailCache('user123', 'inbox');
```

### Rate Limiting

```typescript
import { checkRateLimit } from '@/lib/security/rateLimit';

// Check rate limit for request
const result = await checkRateLimit(request, 100, 60000); // 100 req/min

if (!result.allowed) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

## 🔍 Monitoring & Management

### Health Check

```typescript
import { redisHealthCheck } from '@/lib/redis/utils';

const health = await redisHealthCheck();
console.log(health);
// {
//   overall: true,
//   databases: {
//     sessions: { status: 'healthy', connected: true },
//     cache: { status: 'healthy', connected: true },
//     rateLimit: { status: 'healthy', connected: true },
//     emailCache: { status: 'healthy', connected: true }
//   }
// }
```

### Database Information

```typescript
import { getRedisDatabaseInfo } from '@/lib/redis/utils';

const info = await getRedisDatabaseInfo();
console.log(info);
// {
//   sessions: { database: 0, keys: 150, memory: '...', connected: true },
//   cache: { database: 1, keys: 250, memory: '...', connected: true },
//   rateLimit: { database: 3, keys: 45, memory: '...', connected: true },
//   emailCache: { database: 4, keys: 89, memory: '...', connected: true }
// }
```

### Admin API Endpoints

#### Get Redis Information
```bash
GET /api/admin/redis
```

#### Clear Specific Database
```bash
DELETE /api/admin/redis?database=cache
DELETE /api/admin/redis?database=sessions
DELETE /api/admin/redis?database=rateLimit
DELETE /api/admin/redis?database=emailCache
```

## 🚨 Important Notes

### Database Separation Benefits

1. **Data Isolation**: Different types of data are completely separated
2. **Performance**: Better memory management and query optimization
3. **Maintenance**: Can flush specific databases without affecting others
4. **Debugging**: Easier to troubleshoot specific features
5. **Scaling**: Can optimize each database independently

### Migration from Single Database

If you're migrating from a single Redis database setup:

1. **Backup Current Data**: Export existing Redis data
2. **Update Environment Variables**: Set the new database assignments
3. **Deploy New Code**: The new Redis client structure
4. **Monitor**: Check that all databases are connecting properly
5. **Clean Up**: Remove old keys from database 0 if needed

### Production Considerations

1. **Memory Management**: Monitor memory usage per database
2. **TTL Policies**: Set appropriate expiration times
3. **Backup Strategy**: Include all databases in backup procedures
4. **Monitoring**: Set up alerts for database health
5. **Connection Pooling**: Each database has its own connection pool

## 🔧 Troubleshooting

### Common Issues

#### Database Not Connecting
```typescript
// Check individual database connection
const client = getRedisClient('cache');
const isReady = client.isReady;
console.log('Cache DB ready:', isReady);
```

#### Memory Usage High
```bash
# Check memory usage per database
redis-cli -h host -p port -a password
> INFO memory
> SELECT 1
> DBSIZE
```

#### Rate Limiting Not Working
```typescript
// Check rate limit database
const client = getRedisClient('rateLimit');
const keys = await client.keys('rate_limit:*');
console.log('Rate limit keys:', keys);
```

### Performance Optimization

1. **Key Naming**: Use consistent, hierarchical key names
2. **TTL Strategy**: Set appropriate expiration times
3. **Memory Limits**: Configure Redis memory limits
4. **Connection Pooling**: Optimize connection pool sizes
5. **Monitoring**: Set up Redis monitoring and alerts

## 📚 Additional Resources

- [Redis Database Documentation](https://redis.io/docs/manual/keyspace-notifications/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Better-Auth Session Storage](https://www.better-auth.com/docs/configuration/session)
- [Redis Memory Optimization](https://redis.io/docs/manual/eviction/)
