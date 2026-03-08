/**
 * Tiered Rate Limiting Middleware
 * 
 * Uses Redis for persistence (survives server restarts).
 * Falls back to in-memory if Redis is unavailable.
 * 
 * Tiers:
 *   - General API:  100 req / 1 min  (configurable)
 *   - Auth:           5 req / 15 min (brute-force protection)
 *   - Payment:       10 req / 5 min  (abuse protection)
 *   - Trade:         30 req / 1 min  (fair use)
 */

const rateLimit = require('express-rate-limit');

let RedisStore;
let redisClient;

try {
    RedisStore = require('rate-limit-redis').default;
    const { redis } = require('../services/redis');
    redisClient = redis;
} catch (err) {
    console.warn('⚠️  Redis store unavailable for rate limiting, using in-memory fallback');
}

// ---- Factory: Create a rate limiter with optional Redis backing ----
function createLimiter({ windowMs, max, prefix, message }) {
    const config = {
        windowMs,
        max,
        message: { error: message || 'Too many requests, please try again later.' },
        standardHeaders: true,   // Returns `RateLimit-*` headers
        legacyHeaders: false,    // Disables `X-RateLimit-*` headers
        keyGenerator: (req) => {
            // Use authenticated user ID if available, otherwise IP
            return req.user?.id || req.ip;
        },
    };

    // Use Redis store if available (persistent across restarts)
    if (redisClient && RedisStore) {
        try {
            config.store = new RedisStore({
                sendCommand: (...args) => redisClient.call(...args),
                prefix: `rl:${prefix}:`,
            });
        } catch (err) {
            console.warn(`⚠️  Failed to create Redis rate limit store for ${prefix}, using memory`);
        }
    }

    return rateLimit(config);
}

// ---- General API Rate Limiter ----
// 100 requests per minute (configurable via env)
const generalLimiter = createLimiter({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_GENERAL) || 1) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_GENERAL) || 100,
    prefix: 'general',
    message: 'Too many requests, please try again later.',
});

// ---- Auth Rate Limiter ----
// 5 attempts per 15 minutes (brute-force protection)
const authLimiter = createLimiter({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_AUTH) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_AUTH) || 5,
    prefix: 'auth',
    message: 'Too many authentication attempts. Please try again later.',
});

// ---- Payment Rate Limiter ----
// 10 requests per 5 minutes (financial abuse protection)
const paymentLimiter = createLimiter({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_PAYMENT) || 5) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_PAYMENT) || 10,
    prefix: 'payment',
    message: 'Too many payment requests. Please wait before trying again.',
});

// ---- Trade Rate Limiter ----
// 30 trades per minute (fair use)
const tradeLimiter = createLimiter({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_TRADE) || 1) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_TRADE) || 30,
    prefix: 'trade',
    message: 'Too many trade requests. Please slow down.',
});

module.exports = { generalLimiter, authLimiter, paymentLimiter, tradeLimiter };
