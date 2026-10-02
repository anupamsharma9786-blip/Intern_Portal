import { query, validationResult } from 'express-validator';
import Redis from 'ioredis';

// 1. Configure Redis to stop retrying after 3 failed attempts
const redis = new Redis({
    retryStrategy: (times) => {
        if (times > 3) {
            console.warn('⚠️  [ioredis] Redis server is not running. Caching is temporarily disabled.');
            return null; // Returning null stops the infinite connection loop
        }
        return Math.min(times * 50, 2000); // Delay between retries
    }
});

// 2. Catch the error event so it doesn't crash the Node.js process
redis.on('error', (err) => {
    // We suppress the raw error spam here since the retryStrategy handles the warning
});

// 3. Your existing date validation logic
const validateDateRange = [
    query('from').optional().isISO8601().withMessage('Invalid "from" date format'),
    query('to').optional().isISO8601().withMessage('Invalid "to" date format'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// 4. Your caching logic (updated to bypass cache if Redis is down)
const cacheAnalytics = async (req, res, next) => {
    // If Redis gave up connecting, skip caching and go straight to the database
    if (redis.status !== 'ready') {
        return next();
    }

    const key = `analytics:${req.originalUrl}`;
    
    try {
        const cachedData = await redis.get(key);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        // Intercept the response to save it to Redis before sending it to the user
        const originalJson = res.json;
        res.json = (body) => {
            // Cache for 1 hour (3600 seconds)
            redis.set(key, JSON.stringify(body), 'EX', 3600).catch(console.error);
            originalJson.call(res, body);
        };
        
        next();
    } catch (error) {
        console.error('[Redis Cache Error]:', error);
        next(); // Proceed to the route handler even if cache fails
    }
};

// 5. Modern ES Module named exports
export { validateDateRange, cacheAnalytics };