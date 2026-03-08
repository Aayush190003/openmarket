const express = require('express');
const { body, validationResult } = require('express-validator');
const { Market, Order, Position, Wallet, Transaction, Match, sequelize } = require('../models');
const { authenticate, adminOnly } = require('../middleware/auth');
const AntiCheatEngine = require('../services/antiCheat');
const { tradeLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const PLATFORM_FEE = parseFloat(process.env.PLATFORM_FEE_PERCENT || 2) / 100;
const MIN_TRADE = parseInt(process.env.MIN_TRADE_AMOUNT || 10);
const MAX_TRADE = parseInt(process.env.MAX_TRADE_AMOUNT || 100000);

// ---- GET MARKET DETAILS ----
router.get('/:id', async (req, res) => {
    try {
        const market = await Market.findByPk(req.params.id, {
            include: [{ model: Match, as: 'match' }]
        });
        if (!market) return res.status(404).json({ error: 'Market not found' });
        res.json({ market });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch market' });
    }
});

// ---- PLACE TRADE (Core Trading Engine) ----
router.post('/:id/trade', authenticate, tradeLimiter, [
    body('side').isIn(['yes', 'no']).withMessage('Side must be yes or no'),
    body('amount').isFloat({ min: MIN_TRADE, max: MAX_TRADE }).withMessage(`Amount must be ₹${MIN_TRADE} - ₹${MAX_TRADE}`)
], async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { await t.rollback(); return res.status(400).json({ errors: errors.array() }); }

        const { side, amount } = req.body;
        const marketId = req.params.id;
        const userId = req.user.id;
        const ip = req.ip || req.connection.remoteAddress;

        // 1. Validate market is open
        const market = await Market.findByPk(marketId, { lock: true, transaction: t });
        if (!market || market.status !== 'open') {
            await t.rollback();
            return res.status(400).json({ error: 'Market is not open for trading' });
        }

        // 2. Get wallet with lock
        const wallet = await Wallet.findOne({ where: { user_id: userId }, lock: true, transaction: t });
        if (!wallet) { await t.rollback(); return res.status(404).json({ error: 'Wallet not found' }); }

        const available = parseFloat(wallet.balance) - parseFloat(wallet.locked_balance);
        if (amount > available) {
            await t.rollback();
            return res.status(400).json({ error: 'Insufficient balance', available_balance: available });
        }

        // 3. Anti-cheat checks
        const cheatResult = await AntiCheatEngine.runPreTradeChecks(userId, marketId, side, amount, available, ip);
        if (!cheatResult.allowed) {
            await t.rollback();
            return res.status(403).json({ error: cheatResult.reason });
        }

        // 4. Calculate price and shares
        const price = side === 'yes' ? parseFloat(market.yes_price) : parseFloat(market.no_price);
        const shares = Math.floor((amount / price) * 100);
        const actualCost = (shares * price) / 100;
        const fee = actualCost * PLATFORM_FEE;
        const totalCost = actualCost + fee;

        // 5. Deduct from wallet
        const newBalance = parseFloat(wallet.balance) - totalCost;
        await wallet.update({ balance: newBalance }, { transaction: t });

        // 6. Create order
        const order = await Order.create({
            user_id: userId,
            market_id: marketId,
            side,
            price,
            quantity: shares,
            amount: actualCost,
            fee,
            status: 'filled',
            filled_at: new Date(),
            ip_address: ip
        }, { transaction: t });

        // 7. Update or create position
        let position = await Position.findOne({
            where: { user_id: userId, market_id: marketId, side, status: 'active' },
            lock: true,
            transaction: t
        });

        if (position) {
            const newQty = position.quantity + shares;
            const newInvested = parseFloat(position.total_invested) + actualCost;
            const newAvgPrice = (newInvested / newQty) * 100;
            await position.update({
                quantity: newQty,
                avg_price: newAvgPrice.toFixed(2),
                total_invested: newInvested
            }, { transaction: t });
        } else {
            position = await Position.create({
                user_id: userId,
                market_id: marketId,
                side,
                quantity: shares,
                avg_price: price,
                total_invested: actualCost
            }, { transaction: t });
        }

        // 8. Update market stats
        const updateFields = {
            total_volume: parseFloat(market.total_volume) + actualCost,
        };
        if (side === 'yes') {
            updateFields.total_yes_shares = market.total_yes_shares + shares;
            // Dynamic pricing: more YES buyers → YES price goes up
            const totalShares = market.total_yes_shares + shares + market.total_no_shares;
            if (totalShares > 0) {
                const newYesPrice = Math.min(99, Math.max(1, ((market.total_yes_shares + shares) / totalShares * 100)));
                updateFields.yes_price = newYesPrice.toFixed(2);
                updateFields.no_price = (100 - newYesPrice).toFixed(2);
            }
        } else {
            updateFields.total_no_shares = market.total_no_shares + shares;
            const totalShares = market.total_yes_shares + market.total_no_shares + shares;
            if (totalShares > 0) {
                const newNoPrice = Math.min(99, Math.max(1, ((market.total_no_shares + shares) / totalShares * 100)));
                updateFields.no_price = newNoPrice.toFixed(2);
                updateFields.yes_price = (100 - newNoPrice).toFixed(2);
            }
        }
        await market.update(updateFields, { transaction: t });

        // 9. Record transaction
        await Transaction.create({
            wallet_id: wallet.id,
            type: 'trade_buy',
            amount: -totalCost,
            balance_after: newBalance,
            description: `Bought ${shares} ${side.toUpperCase()} shares @ ₹${price}`,
            reference_id: order.id,
            status: 'success',
            ip_address: ip
        }, { transaction: t });

        await t.commit();

        res.json({
            message: 'Trade placed successfully',
            order: {
                id: order.id,
                side,
                shares,
                price,
                cost: actualCost,
                fee,
                total: totalCost
            },
            wallet: { new_balance: newBalance },
            market: {
                yes_price: updateFields.yes_price || market.yes_price,
                no_price: updateFields.no_price || market.no_price
            },
            warnings: cheatResult.warnings || []
        });
    } catch (err) {
        await t.rollback();
        console.error('Trade error:', err);
        res.status(500).json({ error: 'Trade failed' });
    }
});

// ---- RESOLVE MARKET (Admin) ----
router.post('/:id/resolve', authenticate, adminOnly, async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { resolution } = req.body; // 'yes', 'no', or 'void'
        if (!['yes', 'no', 'void'].includes(resolution)) {
            await t.rollback();
            return res.status(400).json({ error: 'Resolution must be yes, no, or void' });
        }

        const market = await Market.findByPk(req.params.id, { lock: true, transaction: t });
        if (!market) { await t.rollback(); return res.status(404).json({ error: 'Market not found' }); }
        if (market.status === 'resolved') { await t.rollback(); return res.status(400).json({ error: 'Market already resolved' }); }

        // Get all active positions
        const positions = await Position.findAll({
            where: { market_id: market.id, status: 'active' },
            transaction: t
        });

        for (const pos of positions) {
            const wallet = await Wallet.findOne({ where: { user_id: pos.user_id }, lock: true, transaction: t });
            if (!wallet) continue;

            if (resolution === 'void') {
                // Refund all positions
                const refund = parseFloat(pos.total_invested);
                await wallet.update({ balance: parseFloat(wallet.balance) + refund }, { transaction: t });
                await pos.update({ status: 'void', payout: refund }, { transaction: t });
                await Transaction.create({
                    wallet_id: wallet.id, type: 'refund', amount: refund,
                    balance_after: parseFloat(wallet.balance) + refund,
                    description: `Refund: Market voided`, reference_id: market.id, status: 'success'
                }, { transaction: t });
            } else if (pos.side === resolution) {
                // Winner: payout = shares * ₹1 (each share pays ₹1 if correct)
                const payout = pos.quantity; // 1 share = ₹1 payout
                await wallet.update({
                    balance: parseFloat(wallet.balance) + payout,
                    total_won: parseFloat(wallet.total_won) + payout
                }, { transaction: t });
                await pos.update({ status: 'won', payout }, { transaction: t });
                await Transaction.create({
                    wallet_id: wallet.id, type: 'trade_win', amount: payout,
                    balance_after: parseFloat(wallet.balance) + payout,
                    description: `Won: ${market.question}`, reference_id: market.id, status: 'success'
                }, { transaction: t });
            } else {
                // Loser
                await wallet.update({
                    total_lost: parseFloat(wallet.total_lost) + parseFloat(pos.total_invested)
                }, { transaction: t });
                await pos.update({ status: 'lost', payout: 0 }, { transaction: t });
                await Transaction.create({
                    wallet_id: wallet.id, type: 'trade_loss', amount: 0,
                    balance_after: parseFloat(wallet.balance),
                    description: `Lost: ${market.question}`, reference_id: market.id, status: 'success'
                }, { transaction: t });
            }
        }

        await market.update({ status: 'resolved', resolution, resolved_at: new Date() }, { transaction: t });
        await t.commit();
        res.json({ message: `Market resolved as ${resolution.toUpperCase()}`, positions_settled: positions.length });
    } catch (err) {
        await t.rollback();
        console.error('Resolve error:', err);
        res.status(500).json({ error: 'Resolution failed' });
    }
});

// ---- CREATE MARKET (Admin) ----
router.post('/', authenticate, adminOnly, async (req, res) => {
    try {
        const { match_id, question, category, yes_price, no_price, badge_type } = req.body;
        const match = await Match.findByPk(match_id);
        if (!match) return res.status(404).json({ error: 'Match not found' });
        const market = await Market.create({
            match_id, question, category,
            yes_price: yes_price || 50, no_price: no_price || 50,
            badge_type
        });
        res.status(201).json({ market });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create market' });
    }
});

module.exports = router;
