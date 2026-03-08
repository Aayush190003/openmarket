const express = require('express');
const { Position, Market, Match, Order } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ---- GET USER PORTFOLIO ----
router.get('/', authenticate, async (req, res) => {
    try {
        const { status } = req.query;
        const where = { user_id: req.user.id };
        if (status && ['active', 'won', 'lost', 'void'].includes(status)) where.status = status;

        const positions = await Position.findAll({
            where,
            include: [{
                model: Market, as: 'market',
                include: [{ model: Match, as: 'match', attributes: ['team_a', 'team_b', 'team_a_code', 'team_b_code', 'tournament'] }]
            }],
            order: [['created_at', 'DESC']]
        });

        // Calculate portfolio summary
        let totalInvested = 0, currentValue = 0, totalWon = 0, totalLost = 0, wins = 0, losses = 0;
        const formatted = positions.map(p => {
            const invested = parseFloat(p.total_invested);
            totalInvested += invested;
            let value = 0;
            if (p.status === 'active') {
                const currentPrice = p.side === 'yes' ? parseFloat(p.market.yes_price) : parseFloat(p.market.no_price);
                value = (p.quantity * currentPrice) / 100;
                currentValue += value;
            } else if (p.status === 'won') {
                value = parseFloat(p.payout);
                currentValue += value;
                totalWon += value;
                wins++;
            } else if (p.status === 'lost') {
                totalLost += invested;
                losses++;
            }
            return { ...p.toJSON(), current_value: value, pl: value - invested };
        });

        res.json({
            positions: formatted,
            summary: {
                total_invested: totalInvested,
                current_value: currentValue + positions.filter(p => p.status === 'active').reduce((s, p) => s + parseFloat(p.total_invested), 0),
                total_pl: currentValue - totalInvested + totalWon,
                win_rate: (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0,
                total_trades: positions.length,
                active: positions.filter(p => p.status === 'active').length,
                won: wins,
                lost: losses
            }
        });
    } catch (err) {
        console.error('Portfolio error:', err);
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
});

module.exports = router;
