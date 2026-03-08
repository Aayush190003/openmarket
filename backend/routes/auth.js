const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User, Wallet } = require('../models');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// ---- REGISTER ----
router.post('/register', [
    body('username').trim().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('phone').optional().isMobilePhone('en-IN')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { username, email, password, phone } = req.body;

        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(409).json({ error: 'Email already registered' });

        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) return res.status(409).json({ error: 'Username already taken' });

        const password_hash = await bcrypt.hash(password, 12);
        const ip = req.ip || req.connection.remoteAddress;

        const user = await User.create({ username, email, password_hash, phone, ip_address: ip });
        // Create wallet for the user
        await Wallet.create({ user_id: user.id });

        const token = generateToken(user);
        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// ---- LOGIN ----
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        // Check login attempts (brute force protection)
        if (user.login_attempts >= 5) {
            const lockoutTime = new Date(user.updatedAt).getTime() + 15 * 60 * 1000;
            if (Date.now() < lockoutTime) {
                return res.status(429).json({ error: 'Account locked. Try again in 15 minutes.' });
            }
            await user.update({ login_attempts: 0 });
        }

        if (user.is_banned) return res.status(403).json({ error: 'Account suspended', reason: user.ban_reason });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            await user.increment('login_attempts');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await user.update({
            login_attempts: 0,
            last_login_at: new Date(),
            ip_address: req.ip || req.connection.remoteAddress
        });

        const token = generateToken(user);
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role, kyc_status: user.kyc_status }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ---- GET CURRENT USER ----
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash'] },
            include: [{ model: Wallet, as: 'wallet', attributes: ['balance', 'locked_balance', 'total_won', 'total_lost'] }]
        });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// ---- UPDATE PROFILE ----
router.put('/me', authenticate, [
    body('username').optional().trim().isLength({ min: 3, max: 50 }),
    body('phone').optional().isMobilePhone('en-IN')
], async (req, res) => {
    try {
        const { username, phone } = req.body;
        const updates = {};
        if (username) updates.username = username;
        if (phone) updates.phone = phone;
        await User.update(updates, { where: { id: req.user.id } });
        res.json({ message: 'Profile updated' });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

module.exports = router;
