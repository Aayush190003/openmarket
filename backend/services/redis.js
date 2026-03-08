const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis;
try {
    redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
        enableReadyCheck: true,
    });

    redis.on('error', (err) => {
        console.error('Redis error:', err.message);
    });

    redis.on('connect', () => {
        console.log('✅ Redis connected');
    });
} catch (err) {
    console.error('Redis init failed:', err);
    redis = null;
}

// Cache wrapper with fallback (if Redis is down, just skip cache)
const cache = {
    async get(key) {
        if (!redis) return null;
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    },

    async set(key, value, ttlSeconds = 300) {
        if (!redis) return;
        try {
            await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch { /* silent */ }
    },

    async del(key) {
        if (!redis) return;
        try {
            await redis.del(key);
        } catch { /* silent */ }
    },

    async invalidatePattern(pattern) {
        if (!redis) return;
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) await redis.del(...keys);
        } catch { /* silent */ }
    },

    // ── Specific cache functions ──
    async getMatches() {
        return this.get('matches:all');
    },

    async setMatches(data) {
        return this.set('matches:all', data, 300); // 5 min
    },

    async getMarketPrice(marketId) {
        return this.get(`market:price:${marketId}`);
    },

    async setMarketPrice(marketId, data) {
        return this.set(`market:price:${marketId}`, data, 30); // 30 sec
    },

    async getLeaderboard(period = 'all') {
        return this.get(`leaderboard:${period}`);
    },

    async setLeaderboard(period, data) {
        return this.set(`leaderboard:${period}`, data, 120); // 2 min
    },

    // Session blacklisting for logout
    async blacklistToken(token, expiresIn = 604800) {
        return this.set(`blacklist:${token}`, true, expiresIn); // 7 days
    },

    async isTokenBlacklisted(token) {
        const result = await this.get(`blacklist:${token}`);
        return !!result;
    },
};

module.exports = { redis, cache };
