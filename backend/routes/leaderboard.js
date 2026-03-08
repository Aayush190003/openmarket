const express = require('express');
const { User, Wallet, Position, sequelize } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// ---- GET LEADERBOARD ----
router.get('/', async (req, res) => {
    try {
        const { period = 'month', page = 1, limit = 20 } = req.query;
        let dateFilter = {};
        const now = new Date();
        if (period === 'week') dateFilter = { [Op.gte]: new Date(now - 7 * 24 * 60 * 60 * 1000) };
        else if (period === 'month') dateFilter = { [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1) };

        // Get users with most winnings
        const users = await User.findAll({
            attributes: ['id', 'username'],
            include: [{
                model: Wallet, as: 'wallet',
                attributes: ['total_won', 'total_lost']
            }, {
                model: Position, as: 'positions',
                attributes: ['status'],
                where: dateFilter.length ? { created_at: dateFilter } : {},
                required: false
            }],
            where: { is_banned: false },
            order: [[{ model: Wallet, as: 'wallet' }, 'total_won', 'DESC']],
            offset: (page - 1) * limit,
            limit: parseInt(limit)
        });

        const leaderboard = users.map((u, i) => {
            const positions = u.positions || [];
            const wins = positions.filter(p => p.status === 'won').length;
            const losses = positions.filter(p => p.status === 'lost').length;
            const total = wins + losses;
            return {
                rank: (page - 1) * limit + i + 1,
                username: u.username,
                initials: u.username.slice(0, 2).toUpperCase(),
                earnings: parseFloat(u.wallet?.total_won || 0),
                win_rate: total > 0 ? Math.round((wins / total) * 100) : 0,
                total_trades: total,
                streak: Math.floor(Math.random() * 7) + 1 // TODO: Calculate actual streak
            };
        });

        res.json({ leaderboard, period, page: parseInt(page) });
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

module.exports = router;
