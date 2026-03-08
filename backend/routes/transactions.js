const express = require('express');
const { Transaction, Wallet } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ---- GET USER TRANSACTIONS ----
router.get('/', authenticate, async (req, res) => {
    try {
        const { type, page = 1, limit = 20 } = req.query;
        const wallet = await Wallet.findOne({ where: { user_id: req.user.id } });
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

        const where = { wallet_id: wallet.id };
        if (type) where.type = type;

        const { rows: transactions, count } = await Transaction.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            offset: (page - 1) * limit,
            limit: parseInt(limit)
        });

        res.json({
            transactions: transactions.map(t => ({
                id: t.id,
                type: t.type,
                amount: parseFloat(t.amount),
                balance_after: parseFloat(t.balance_after),
                description: t.description,
                status: t.status,
                payment_method: t.payment_method,
                created_at: t.created_at
            })),
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

module.exports = router;
