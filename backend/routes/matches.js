const express = require('express');
const { Match, Market } = require('../models');
const { authenticate, adminOnly } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// ---- GET ALL MATCHES ----
router.get('/', async (req, res) => {
    try {
        const { status, tournament, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status) where.status = status;
        if (tournament) where.tournament = { [Op.iLike]: `%${tournament}%` };

        const { rows: matches, count } = await Match.findAndCountAll({
            where,
            include: [{ model: Market, as: 'markets', attributes: ['id', 'status', 'total_volume'] }],
            order: [['start_time', 'ASC']],
            offset: (page - 1) * limit,
            limit: parseInt(limit)
        });

        const formatted = matches.map(m => ({
            ...m.toJSON(),
            active_markets: m.markets.filter(mk => mk.status === 'open').length,
            total_volume: m.markets.reduce((sum, mk) => sum + parseFloat(mk.total_volume || 0), 0)
        }));

        res.json({ matches: formatted, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// ---- GET SINGLE MATCH WITH MARKETS ----
router.get('/:id', async (req, res) => {
    try {
        const match = await Match.findByPk(req.params.id, {
            include: [{ model: Market, as: 'markets' }]
        });
        if (!match) return res.status(404).json({ error: 'Match not found' });
        res.json({ match });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch match' });
    }
});

// ---- GET MARKETS FOR A MATCH ----
router.get('/:id/markets', async (req, res) => {
    try {
        const markets = await Market.findAll({
            where: { match_id: req.params.id },
            order: [['created_at', 'DESC']]
        });
        res.json({ markets });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch markets' });
    }
});

// ---- CREATE MATCH (Admin) ----
router.post('/', authenticate, adminOnly, async (req, res) => {
    try {
        const { team_a, team_b, team_a_code, team_b_code, tournament, venue, match_type, start_time, image_url } = req.body;
        const match = await Match.create({ team_a, team_b, team_a_code, team_b_code, tournament, venue, match_type, start_time, image_url });
        res.status(201).json({ match });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create match' });
    }
});

// ---- UPDATE MATCH STATUS (Admin) ----
router.patch('/:id', authenticate, adminOnly, async (req, res) => {
    try {
        const match = await Match.findByPk(req.params.id);
        if (!match) return res.status(404).json({ error: 'Match not found' });
        await match.update(req.body);
        res.json({ match });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update match' });
    }
});

module.exports = router;
