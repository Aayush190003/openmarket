const express = require('express');
const { User, Wallet, Match, Market, Order, Position, Transaction, AntiCheatLog, sequelize } = require('../models');
const { authenticate, adminOnly } = require('../middleware/auth');
const { Op, fn, col, literal } = require('sequelize');

const router = express.Router();

// All admin routes require auth + admin role
router.use(authenticate);
router.use(adminOnly);

// ---- DASHBOARD STATS ----
router.get('/stats', async (req, res) => {
    try {
        const [
            totalUsers,
            activeUsers,
            totalVolume,
            totalDeposits,
            openMarkets,
            todayTrades,
            flaggedUsers
        ] = await Promise.all([
            User.count(),
            User.count({ where: { last_login_at: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
            Market.sum('total_volume') || 0,
            Transaction.sum('amount', { where: { type: 'deposit', status: 'success' } }) || 0,
            Market.count({ where: { status: 'open' } }),
            Order.count({ where: { created_at: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
            AntiCheatLog.count({ where: { resolved: false } })
        ]);

        // Revenue from fees
        const totalFees = await Order.sum('fee', { where: { status: 'filled' } }) || 0;

        res.json({
            stats: {
                total_users: totalUsers,
                active_users_7d: activeUsers,
                total_volume: totalVolume,
                total_deposits: totalDeposits,
                total_revenue: totalFees,
                open_markets: openMarkets,
                today_trades: todayTrades,
                flagged_users: flaggedUsers
            }
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ---- USER LIST ----
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        const where = search ? {
            [Op.or]: [
                { username: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ]
        } : {};

        const { count, rows } = await User.findAndCountAll({
            where,
            include: [{ model: Wallet, as: 'wallet', attributes: ['balance', 'total_deposited', 'total_won', 'total_lost'] }],
            attributes: { exclude: ['password_hash'] },
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.json({ users: rows, total: count, page, pages: Math.ceil(count / limit) });
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// ---- BAN USER ----
router.post('/users/:id/ban', async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ error: 'Cannot ban admin users' });

        await user.update({ is_banned: true, ban_reason: reason || 'Admin action' });
        res.json({ message: `User ${user.username} banned`, user: { id: user.id, username: user.username, is_banned: true } });
    } catch (err) {
        res.status(500).json({ error: 'Failed to ban user' });
    }
});

// ---- UNBAN USER ----
router.post('/users/:id/unban', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.update({ is_banned: false, ban_reason: null });
        res.json({ message: `User ${user.username} unbanned` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to unban user' });
    }
});

// ---- ANTI-CHEAT LOGS ----
router.get('/anticheat', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const severity = req.query.severity;

        const where = {};
        if (severity) where.severity = severity;
        if (req.query.unresolved === 'true') where.resolved = false;

        const { count, rows } = await AntiCheatLog.findAndCountAll({
            where,
            include: [{ model: User, attributes: ['username', 'email'] }],
            order: [['created_at', 'DESC']],
            limit,
            offset: (page - 1) * limit
        });

        res.json({ logs: rows, total: count, page });
    } catch (err) {
        console.error('Admin anticheat error:', err);
        res.status(500).json({ error: 'Failed to fetch anti-cheat logs' });
    }
});

// ---- RESOLVE ANTI-CHEAT FLAG ----
router.post('/anticheat/:id/resolve', async (req, res) => {
    try {
        const log = await AntiCheatLog.findByPk(req.params.id);
        if (!log) return res.status(404).json({ error: 'Log not found' });

        await log.update({ resolved: true, action_taken: req.body.action || 'flagged' });
        res.json({ message: 'Flag resolved', log });
    } catch (err) {
        res.status(500).json({ error: 'Failed to resolve flag' });
    }
});

// ---- CREATE MATCH (Admin) ----
router.post('/matches', async (req, res) => {
    try {
        const { team_a, team_b, team_a_code, team_b_code, tournament, venue, match_type, start_time, image_url } = req.body;
        if (!team_a || !team_b || !tournament || !start_time) {
            return res.status(400).json({ error: 'team_a, team_b, tournament, and start_time are required' });
        }
        const match = await Match.create({
            team_a, team_b, team_a_code, team_b_code, tournament, venue,
            match_type: match_type || 'ODI', start_time, image_url
        });
        res.status(201).json({ match });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create match' });
    }
});

// ---- UPDATE MATCH STATUS ----
router.patch('/matches/:id', async (req, res) => {
    try {
        const match = await Match.findByPk(req.params.id);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        const { status, score_a, score_b } = req.body;
        const updates = {};
        if (status) updates.status = status;
        if (score_a) updates.score_a = score_a;
        if (score_b) updates.score_b = score_b;
        if (status === 'completed') updates.end_time = new Date();

        await match.update(updates);
        res.json({ match });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update match' });
    }
});

module.exports = router;
