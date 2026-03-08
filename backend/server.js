require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const hpp = require('hpp');
const http = require('http');
const { Server } = require('socket.io');

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const matchRoutes = require('./routes/matches');
const marketRoutes = require('./routes/markets');
const portfolioRoutes = require('./routes/portfolio');
const leaderboardRoutes = require('./routes/leaderboard');
const transactionRoutes = require('./routes/transactions');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const { initWebSocket } = require('./ws/socket');
const { redis } = require('./services/redis');
const { generalLimiter, authLimiter, paymentLimiter, tradeLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

// ---- Startup Security Checks ----
(function validateEnvironment() {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
        console.error('❌ FATAL: JWT_SECRET must be set and at least 32 characters long');
        if (process.env.NODE_ENV === 'production') process.exit(1);
    }
    const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    for (const key of required) {
        if (!process.env[key]) {
            console.error(`❌ FATAL: Missing required env var: ${key}`);
            if (process.env.NODE_ENV === 'production') process.exit(1);
        }
    }
    console.log('✅ Environment validation passed');
})();

// ---- Trust Proxy (Nginx) ----
// Critical: allows express-rate-limit to see real client IPs behind Nginx
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ---- CORS Configuration ----
// Supports comma-separated origins: CORS_ORIGIN=http://localhost:3000,http://13.234.20.170:8080
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (server-to-server, curl, mobile apps)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.warn(`🚫 CORS blocked request from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86400, // 24 hours — browsers cache preflight responses
};

// ---- WebSocket ----
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    }
});
initWebSocket(io);

// ---- Security Middleware ----
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", ...allowedOrigins],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow loading external images
}));
app.use(cors(corsOptions));
app.use(hpp()); // Prevent HTTP Parameter Pollution

// ---- Rate Limiting ----
app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/payments/', paymentLimiter);

// ---- Body Parsing ----
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ---- Logging ----
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// ---- Health Check ----
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// ---- 404 Handler ----
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
    // Handle CORS errors specifically
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'Origin not allowed' });
    }
    console.error('Server Error:', err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// ---- Start Server ----
const PORT = process.env.PORT || 4000;

async function start() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');
        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        console.log('✅ Models synced');

        server.listen(PORT, () => {
            console.log(`🚀 OpenMarket API running on port ${PORT}`);
            console.log(`📡 WebSocket ready`);
            console.log(`🔒 CORS allowed origins: ${allowedOrigins.join(', ')}`);
            console.log(`🛡️  Rate limiters active (Redis-backed)`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

start();

module.exports = { app, server, io };
