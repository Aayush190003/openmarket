const { AntiCheatLog, Order, Position, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Anti-Cheat / Fraud Detection Engine
 * Monitors for suspicious trading patterns and protects market integrity.
 */
class AntiCheatEngine {

    // ---- Check for rapid-fire trading (>10 trades in 60 seconds) ----
    static async checkRapidTrading(userId, ip) {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recentOrders = await Order.count({
            where: { user_id: userId, created_at: { [Op.gte]: oneMinuteAgo } }
        });
        if (recentOrders >= 10) {
            await this.logEvent(userId, 'rapid_trading', 'high', { trades_per_minute: recentOrders }, ip);
            return { flagged: true, reason: 'Rapid trading detected. Please slow down.' };
        }
        return { flagged: false };
    }

    // ---- Check for unusual trade amounts (>50% of wallet balance) ----
    static async checkUnusualAmount(userId, amount, walletBalance, ip) {
        if (amount > walletBalance * 0.5 && amount > 5000) {
            await this.logEvent(userId, 'unusual_amount', 'medium', {
                amount, wallet_balance: walletBalance, percentage: ((amount / walletBalance) * 100).toFixed(1)
            }, ip);
            // Flag but don't block - just monitor
            return { flagged: true, reason: 'Large trade flagged for review', block: false };
        }
        return { flagged: false };
    }

    // ---- Check for wash trading (same user buying YES and NO on same market) ----
    static async checkWashTrading(userId, marketId, side, ip) {
        const oppositePosition = await Position.findOne({
            where: {
                user_id: userId,
                market_id: marketId,
                side: side === 'yes' ? 'no' : 'yes',
                quantity: { [Op.gt]: 0 },
                status: 'active'
            }
        });
        if (oppositePosition) {
            await this.logEvent(userId, 'wash_trading', 'high', {
                market_id: marketId, existing_side: oppositePosition.side, attempted_side: side
            }, ip);
            return { flagged: true, reason: 'Cannot hold both YES and NO positions on the same market' };
        }
        return { flagged: false };
    }

    // ---- Check for multi-account from same IP ----
    static async checkMultiAccount(userId, ip) {
        if (!ip || ip === '127.0.0.1') return { flagged: false };
        const sameIpUsers = await User.count({
            where: { ip_address: ip, id: { [Op.ne]: userId }, is_banned: false }
        });
        if (sameIpUsers >= 3) {
            await this.logEvent(userId, 'multi_account', 'critical', {
                ip, accounts_from_ip: sameIpUsers + 1
            }, ip);
            return { flagged: true, reason: 'Suspicious activity detected from this network' };
        }
        return { flagged: false };
    }

    // ---- Check suspicious withdrawal patterns ----
    static async checkSuspiciousWithdrawal(userId, amount, wallet, ip) {
        // Flag if withdrawing > 80% of recent winnings
        const recentWins = parseFloat(wallet.total_won) || 0;
        const totalDeposited = parseFloat(wallet.total_deposited) || 0;

        // Never deposited but trying to withdraw large amounts
        if (totalDeposited < 100 && amount > 1000) {
            await this.logEvent(userId, 'suspicious_withdrawal', 'high', {
                amount, total_deposited: totalDeposited
            }, ip);
            return { flagged: true, reason: 'Withdrawal review required', block: true };
        }
        return { flagged: false };
    }

    // ---- Run all pre-trade checks ----
    static async runPreTradeChecks(userId, marketId, side, amount, walletBalance, ip) {
        const checks = [
            await this.checkRapidTrading(userId, ip),
            await this.checkWashTrading(userId, marketId, side, ip),
            await this.checkUnusualAmount(userId, amount, walletBalance, ip)
        ];
        const blocked = checks.find(c => c.flagged && c.reason && !c.block === undefined);
        const hardBlock = checks.find(c => c.flagged && c.block !== false);
        if (hardBlock) return { allowed: false, reason: hardBlock.reason };
        return { allowed: true, warnings: checks.filter(c => c.flagged).map(c => c.reason) };
    }

    // ---- Log anti-cheat event ----
    static async logEvent(userId, eventType, severity, details, ip) {
        try {
            await AntiCheatLog.create({
                user_id: userId,
                event_type: eventType,
                severity,
                details,
                ip_address: ip,
                action_taken: severity === 'critical' ? 'suspended' : 'flagged'
            });
            // Auto-ban on critical severity
            if (severity === 'critical') {
                await User.update(
                    { is_banned: true, ban_reason: `Auto-ban: ${eventType}` },
                    { where: { id: userId } }
                );
            }
        } catch (err) {
            console.error('Anti-cheat log error:', err);
        }
    }
}

module.exports = AntiCheatEngine;
