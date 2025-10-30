import redis from 'redis';

let redisClient = null;
let isConnected = false;

async function init() {
  try {
    // Create Redis client
    const parseEnvInt = (value, fallback) => {
      const n = value ? parseInt(value, 10) : NaN;
      return Number.isNaN(n) ? fallback : n;
    };

    const clientConfig = {
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseEnvInt(process.env.REDIS_PORT, 6379),
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
      database: parseEnvInt(process.env.REDIS_DB, 0),
    };

    redisClient = redis.createClient(clientConfig);

    // Event handlers
    redisClient.on('connect', () => {
      console.log('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready');
      isConnected = true;
    });

    redisClient.on('error', (error) => {
      console.error('Redis client error:', error);
      isConnected = false;
    });

    redisClient.on('end', () => {
      console.warn('Redis client connection ended');
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      console.info('Redis client reconnecting...');
    });

    // Connect to Redis
    await redisClient.connect();

    console.log('Redis service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Redis service:', error);
    isConnected = false;
    // Don't throw error - service should work without Redis
  }
}

export { init, isConnected, redisClient };

export default init;
