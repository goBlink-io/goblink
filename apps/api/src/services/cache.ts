import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis client
 */
export const initRedis = async (): Promise<void> => {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not configured, caching will be disabled');
    return;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: false, // Disable reconnection attempts
      },
    });

    redisClient.on('error', (err) => {
      // Only log significant errors, not connection retry spam
      if (err.code !== 'ECONNREFUSED') {
        console.error('Redis Client Error:', err);
      }
    });

    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });

    await redisClient.connect();
    console.log('Redis initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize Redis, continuing without caching');
    redisClient = null;
  }
};

/**
 * Check if Redis is available
 */
export const isRedisAvailable = (): boolean => {
  return redisClient !== null && redisClient.isOpen;
};

/**
 * Get a value from cache
 */
export const get = async <T = any>(key: string): Promise<T | null> => {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const value = await redisClient!.get(key);
    if (!value) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
};

/**
 * Set a value in cache with optional TTL (in seconds)
 */
export const set = async (key: string, value: any, ttl?: number): Promise<boolean> => {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redisClient!.setEx(key, ttl, serialized);
    } else {
      await redisClient!.set(key, serialized);
    }
    return true;
  } catch (error) {
    console.error('Redis SET error:', error);
    return false;
  }
};

/**
 * Delete a key from cache
 */
export const del = async (key: string): Promise<boolean> => {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    await redisClient!.del(key);
    return true;
  } catch (error) {
    console.error('Redis DEL error:', error);
    return false;
  }
};

/**
 * Delete multiple keys matching a pattern
 */
export const delPattern = async (pattern: string): Promise<number> => {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const keys = await redisClient!.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    await redisClient!.del(keys);
    return keys.length;
  } catch (error) {
    console.error('Redis DEL pattern error:', error);
    return 0;
  }
};

/**
 * Get or set a value with a fetcher function
 * If the key exists, return cached value
 * Otherwise, fetch the value, cache it, and return it
 */
export const getOrSet = async <T = any>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // Try to get from cache first
  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch the value
  const value = await fetcher();

  // Store in cache
  await set(key, value, ttl);

  return value;
};

/**
 * Close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }
};

// Cache key helpers
export const CacheKeys = {
  tokens: () => 'sapphire:tokens',
  swapStatus: (depositAddress: string) => `sapphire:status:${depositAddress}`,
  userSession: (sessionId: string) => `sapphire:session:${sessionId}`,
};

// Cache TTLs (in seconds)
export const CacheTTL = {
  tokens: 5 * 60, // 5 minutes
  swapStatus: 30, // 30 seconds
  userSession: 24 * 60 * 60, // 24 hours
};

export default {
  initRedis,
  isRedisAvailable,
  get,
  set,
  del,
  delPattern,
  getOrSet,
  closeRedis,
  CacheKeys,
  CacheTTL,
};
