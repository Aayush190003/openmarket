const express = require('express');
const { body, validationResult } = require('express-validator');
const { Wallet, Transaction, sequelize } = require('../models');
const { authenticate } = require('../middleware/auth');
const AntiCheatEngine = require('../services/antiCheat');

const router = express.Router();

// ---- GET WALLET BALANCE ----
router.get('/balance', authenticate, async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ where: { user_id: req.user.id } });
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
        res.json({
            balance: parseFloat(wallet.balance),
            locked_balance: parseFloat(wallet.locked_balance),
            available_balance: parseFloat(wallet.balance) - parseFloat(wallet.locked_balance),
            total_deposited: parseFloat(wallet.total_deposited),
            total_withdrawn: parseFloat(wallet.total_withdrawn),
            total_won: parseFloat(wallet.total_won),
            total_lost: parseFloat(wallet.total_lost),
            currency: wallet.currency
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

// ---- DEPOSIT MONEY ----
router.post('/deposit', authenticate, [
    body('amount').isFloat({ min: 100, max: 500000 }).withMessage('Amount must be between ₹100 and ₹5,00,000'),
    body('payment_method').isIn(['upi', 'card', 'netbanking']).withMessage('Invalid payment method')
], async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { amount, payment_method } = req.body;
        const wallet = await Wallet.findOne({ where: { user_id: req.user.id }, lock: true, transaction: t });
        if (!wallet) { await t.rollback(); return res.status(404).json({ error: 'Wallet not found' }); }

        const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
        await wallet.update({
            balance: newBalance,
            total_deposited: parseFloat(wallet.total_deposited) + parseFloat(amount)
        }, { transaction: t });

        const txn = await Transaction.create({
            wallet_id: wallet.id,
            type: 'deposit',
            amount: amount,
            balance_after: newBalance,
            description: `Deposited via ${payment_method.toUpperCase()}`,
            payment_method,
            status: 'success',
            ip_address: req.ip
        }, { transaction: t });

        await t.commit();
        res.json({ message: 'Deposit successful', transaction_id: txn.id, new_balance: newBalance });
    } catch (err) {
        await t.rollback();
        console.error('Deposit error:', err);
        res.status(500).json({ error: 'Deposit failed' });
    }
});

// ---- WITHDRAW MONEY ----
router.post('/withdraw', authenticate, [
    body('amount').isFloat({ min: 100 }).withMessage('Minimum withdrawal is ₹100'),
    body('payment_method').isIn(['upi', 'bank_transfer']).withMessage('Invalid payment method')
], async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { amount, payment_method } = req.body;
        const wallet = await Wallet.findOne({ where: { user_id: req.user.id }, lock: true, transaction: t });
        if (!wallet) { await t.rollback(); return res.status(404).json({ error: 'Wallet not found' }); }

        const available = parseFloat(wallet.balance) - parseFloat(wallet.locked_balance);
        if (amount > available) {
            await t.rollback();
            return res.status(400).json({ error: 'Insufficient balance', available_balance: available });
        }

        // Anti-cheat check
        const ip = req.ip || req.connection.remoteAddress;
        const cheatCheck = await AntiCheatEngine.checkSuspiciousWithdrawal(req.user.id, amount, wallet, ip);
        if (cheatCheck.flagged && cheatCheck.block) {
            await t.rollback();
            return res.status(403).json({ error: cheatCheck.reason });
        }

        // KYC check for large withdrawals
        if (amount > 10000 && req.user.kyc_status !== 'verified') {
            await t.rollback();
            return res.status(403).json({ error: 'KYC verification required for withdrawals above ₹10,000' });
        }

        const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
        await wallet.update({
            balance: newBalance,
            total_withdrawn: parseFloat(wallet.total_withdrawn) + parseFloat(amount)
        }, { transaction: t });

        const txn = await Transaction.create({
            wallet_id: wallet.id,
            type: 'withdrawal',
            amount: -amount,
            balance_after: newBalance,
            description: `Withdrawal to ${payment_method.toUpperCase()}`,
            payment_method,
            status: 'pending',
            ip_address: req.ip
        }, { transaction: t });

        await t.commit();
        res.json({ message: 'Withdrawal initiated. Processing within 24 hours.', transaction_id: txn.id, new_balance: newBalance });
    } catch (err) {
        await t.rollback();
        console.error('Withdraw error:', err);
        res.status(500).json({ error: 'Withdrawal failed' });
    }
});

module.exports = router;
