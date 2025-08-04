import Redis from 'ioredis';

const redisHost: string = process.env.REDIS_HOST || 'redis';
const redisPort: number = parseInt(process.env.REDIS_PORT || '6379', 10);

const redis = new Redis({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null
});

redis.on('connect', () => console.log('Connected to Redis'));
redis.on('error', (err: Error) => console.error('Redis connection error:', err));

export default redis;