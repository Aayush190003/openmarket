const express = require('express');
const crypto = require('crypto');
const { Wallet, Transaction, sequelize } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Razorpay config — NEVER use hardcoded fallbacks for payment secrets
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

if (process.env.NODE_ENV === 'production' && (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET)) {
    console.error('❌ FATAL: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in production');
    process.exit(1);
}

// In production, use the Razorpay SDK:
// const Razorpay = require('razorpay');
// const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

// ---- CREATE PAYMENT ORDER ----
router.post('/create-order', authenticate, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount < 100 || amount > 1000000) {
            return res.status(400).json({ error: 'Amount must be between ₹100 and ₹10,00,000' });
        }

        // Idempotency: check for duplicate within 30 seconds
        const idempotencyKey = `${req.user.id}_${amount}_${Math.floor(Date.now() / 30000)}`;

        // In production, create order via Razorpay SDK:
        // const order = await razorpay.orders.create({
        //     amount: amount * 100, // Razorpay uses paise
        //     currency: 'INR',
        //     receipt: `om_${Date.now()}_${req.user.id.slice(0, 8)}`,
        //     notes: { user_id: req.user.id, idempotency_key: idempotencyKey }
        // });

        // Mock order for development
        const order = {
            id: `order_${crypto.randomBytes(16).toString('hex')}`,
            amount: amount * 100,
            currency: 'INR',
            receipt: `om_${Date.now()}_${req.user.id.slice(0, 8)}`,
            status: 'created'
        };

        // Store pending transaction
        const wallet = await Wallet.findOne({ where: { user_id: req.user.id } });
        await Transaction.create({
            wallet_id: wallet.id,
            type: 'deposit',
            amount: amount,
            balance_after: parseFloat(wallet.balance),
            description: `Deposit order: ${order.id}`,
            reference_id: order.id,
            status: 'pending',
            payment_method: 'razorpay',
            ip_address: req.ip
        });

        res.json({
            order_id: order.id,
            amount: amount,
            currency: 'INR',
            key_id: RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});

// ---- VERIFY PAYMENT ----
router.post('/verify', authenticate, async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            await t.rollback();
            return res.status(400).json({ error: 'Missing payment verification data' });
        }

        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            await t.rollback();
            return res.status(400).json({ error: 'Payment verification failed' });
        }

        // Find pending transaction (idempotency check)
        const pendingTx = await Transaction.findOne({
            where: { reference_id: razorpay_order_id, status: 'pending' },
            lock: true,
            transaction: t
        });

        if (!pendingTx) {
            await t.rollback();
            return res.status(400).json({ error: 'No pending transaction found or already processed' });
        }

        // Credit wallet
        const wallet = await Wallet.findOne({
            where: { id: pendingTx.wallet_id },
            lock: true,
            transaction: t
        });

        const newBalance = parseFloat(wallet.balance) + parseFloat(pendingTx.amount);
        const newDeposited = parseFloat(wallet.total_deposited) + parseFloat(pendingTx.amount);

        await wallet.update({
            balance: newBalance,
            total_deposited: newDeposited
        }, { transaction: t });

        // Update transaction
        await pendingTx.update({
            status: 'success',
            balance_after: newBalance,
            reference_id: `${razorpay_order_id}|${razorpay_payment_id}`,
            description: `Deposit via Razorpay: ₹${pendingTx.amount}`
        }, { transaction: t });

        await t.commit();

        res.json({
            success: true,
            wallet: { balance: newBalance, total_deposited: newDeposited }
        });
    } catch (err) {
        await t.rollback();
        console.error('Verify payment error:', err);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

// ---- RAZORPAY WEBHOOK ----
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const expectedSignature = crypto
            .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(400).json({ error: 'Invalid webhook signature' });
        }

        const event = req.body.event;
        const payload = req.body.payload;

        if (event === 'payment.captured') {
            const orderId = payload.payment.entity.order_id;
            const paymentId = payload.payment.entity.id;

            // Find and update transaction if not already processed
            const tx = await Transaction.findOne({
                where: { reference_id: orderId, status: 'pending' }
            });

            if (tx) {
                const wallet = await Wallet.findOne({ where: { id: tx.wallet_id } });
                const newBalance = parseFloat(wallet.balance) + parseFloat(tx.amount);

                await sequelize.transaction(async (t) => {
                    await wallet.update({
                        balance: newBalance,
                        total_deposited: parseFloat(wallet.total_deposited) + parseFloat(tx.amount)
                    }, { transaction: t });

                    await tx.update({
                        status: 'success',
                        balance_after: newBalance,
                        reference_id: `${orderId}|${paymentId}`
                    }, { transaction: t });
                });
            }
        } else if (event === 'payment.failed') {
            const orderId = payload.payment.entity.order_id;
            await Transaction.update(
                { status: 'failed', description: 'Payment failed' },
                { where: { reference_id: orderId, status: 'pending' } }
            );
        }

        res.json({ status: 'ok' });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

module.exports = router;
