const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || 'openmarket-api';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'openmarket-client';

// ---- JWT Authentication Middleware ----
const authenticate = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const token = header.split(' ')[1];
        if (!token || token === 'undefined' || token === 'null') {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });

        const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password_hash'] } });
        if (!user) return res.status(401).json({ error: 'User not found' });
        if (user.is_banned) return res.status(403).json({ error: 'Account suspended', reason: user.ban_reason });

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
        if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

// ---- Optional Auth (doesn't fail if no token — just sets req.user if present) ----
const optionalAuth = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) return next();
        const token = header.split(' ')[1];
        if (!token || token === 'undefined' || token === 'null') return next();

        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });
        const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password_hash'] } });
        if (user && !user.is_banned) req.user = user;
        next();
    } catch {
        // Token invalid — just continue without user context
        next();
    }
};

// ---- Admin Only ----
const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ---- Generate JWT ----
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        }
    );
};

module.exports = { authenticate, optionalAuth, adminOnly, generateToken };
