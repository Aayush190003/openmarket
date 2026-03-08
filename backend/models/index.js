const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'openmarket',
    process.env.DB_USER || 'openmarket_user',
    process.env.DB_PASSWORD || 'openmarket_secure_pass_2026',
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: { max: 20, min: 2, acquire: 30000, idle: 10000 },
        define: { timestamps: true, underscored: true }
    }
);

// ===================== USER =====================
const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    username: {
        type: DataTypes.STRING(50), allowNull: false, unique: true,
        validate: { len: [3, 50], is: /^[a-zA-Z0-9_]+$/i }
    },
    email: {
        type: DataTypes.STRING, allowNull: false, unique: true,
        validate: { isEmail: true }
    },
    phone: { type: DataTypes.STRING(15), allowNull: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
    kyc_status: { type: DataTypes.ENUM('pending', 'verified', 'rejected'), defaultValue: 'pending' },
    is_banned: { type: DataTypes.BOOLEAN, defaultValue: false },
    ban_reason: { type: DataTypes.STRING, allowNull: true },
    login_attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    last_login_at: { type: DataTypes.DATE, allowNull: true },
    ip_address: { type: DataTypes.STRING, allowNull: true }
});

// ===================== WALLET =====================
const Wallet = sequelize.define('Wallet', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    balance: {
        type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00,
        validate: { min: 0 }
    },
    locked_balance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    total_deposited: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    total_withdrawn: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    total_won: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    total_lost: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    currency: { type: DataTypes.STRING(3), defaultValue: 'INR' }
});

// ===================== TRANSACTION =====================
const Transaction = sequelize.define('Transaction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    wallet_id: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.ENUM('deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'trade_win', 'trade_loss', 'refund', 'fee'), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    balance_after: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    reference_id: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'success', 'failed', 'reversed'), defaultValue: 'pending' },
    payment_method: { type: DataTypes.STRING, allowNull: true },
    ip_address: { type: DataTypes.STRING, allowNull: true }
});

// ===================== MATCH =====================
const Match = sequelize.define('Match', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    team_a: { type: DataTypes.STRING, allowNull: false },
    team_b: { type: DataTypes.STRING, allowNull: false },
    team_a_code: { type: DataTypes.STRING(5), allowNull: true },
    team_b_code: { type: DataTypes.STRING(5), allowNull: true },
    tournament: { type: DataTypes.STRING, allowNull: false },
    venue: { type: DataTypes.STRING, allowNull: true },
    match_type: { type: DataTypes.ENUM('ODI', 'T20', 'Test', 'T10'), defaultValue: 'ODI' },
    status: { type: DataTypes.ENUM('upcoming', 'live', 'completed', 'cancelled'), defaultValue: 'upcoming' },
    start_time: { type: DataTypes.DATE, allowNull: false },
    end_time: { type: DataTypes.DATE, allowNull: true },
    image_url: { type: DataTypes.STRING, allowNull: true },
    score_a: { type: DataTypes.STRING, allowNull: true },
    score_b: { type: DataTypes.STRING, allowNull: true }
});

// ===================== MARKET =====================
const Market = sequelize.define('Market', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    match_id: { type: DataTypes.UUID, allowNull: false },
    question: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.ENUM('match_result', 'player_performance', 'innings', 'extras', 'bowling', 'powerplay'), defaultValue: 'match_result' },
    status: { type: DataTypes.ENUM('open', 'suspended', 'closed', 'resolved'), defaultValue: 'open' },
    resolution: { type: DataTypes.ENUM('yes', 'no', 'void'), allowNull: true },
    yes_price: { type: DataTypes.DECIMAL(5, 2), defaultValue: 50.00 },
    no_price: { type: DataTypes.DECIMAL(5, 2), defaultValue: 50.00 },
    total_yes_shares: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_no_shares: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_volume: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    total_traders: { type: DataTypes.INTEGER, defaultValue: 0 },
    badge_type: { type: DataTypes.ENUM('high_yield', 'popular', 'volatile', 'new'), allowNull: true },
    resolved_at: { type: DataTypes.DATE, allowNull: true }
});

// ===================== ORDER =====================
const Order = sequelize.define('Order', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    market_id: { type: DataTypes.UUID, allowNull: false },
    side: { type: DataTypes.ENUM('yes', 'no'), allowNull: false },
    price: {
        type: DataTypes.DECIMAL(5, 2), allowNull: false,
        validate: { min: 1, max: 99 }
    },
    quantity: {
        type: DataTypes.INTEGER, allowNull: false,
        validate: { min: 1 }
    },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    fee: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    status: { type: DataTypes.ENUM('pending', 'filled', 'cancelled', 'expired'), defaultValue: 'pending' },
    filled_at: { type: DataTypes.DATE, allowNull: true },
    ip_address: { type: DataTypes.STRING, allowNull: true }
});

// ===================== POSITION =====================
const Position = sequelize.define('Position', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    market_id: { type: DataTypes.UUID, allowNull: false },
    side: { type: DataTypes.ENUM('yes', 'no'), allowNull: false },
    quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    avg_price: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    total_invested: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    payout: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    status: { type: DataTypes.ENUM('active', 'won', 'lost', 'void'), defaultValue: 'active' }
});

// ===================== ANTI-CHEAT LOG =====================
const AntiCheatLog = sequelize.define('AntiCheatLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    event_type: {
        type: DataTypes.ENUM(
            'rapid_trading', 'unusual_amount', 'ip_mismatch', 'multi_account',
            'wash_trading', 'price_manipulation', 'suspicious_withdrawal'
        ), allowNull: false
    },
    severity: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'low' },
    details: { type: DataTypes.JSON, allowNull: true },
    action_taken: { type: DataTypes.ENUM('flagged', 'warned', 'suspended', 'banned'), defaultValue: 'flagged' },
    ip_address: { type: DataTypes.STRING, allowNull: true },
    resolved: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// ===================== ASSOCIATIONS =====================
User.hasOne(Wallet, { foreignKey: 'user_id', as: 'wallet' });
Wallet.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Wallet.hasMany(Transaction, { foreignKey: 'wallet_id', as: 'transactions' });
Transaction.belongsTo(Wallet, { foreignKey: 'wallet_id' });

Match.hasMany(Market, { foreignKey: 'match_id', as: 'markets' });
Market.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id' });
Order.belongsTo(Market, { foreignKey: 'market_id', as: 'market' });
Market.hasMany(Order, { foreignKey: 'market_id', as: 'orders' });

User.hasMany(Position, { foreignKey: 'user_id', as: 'positions' });
Position.belongsTo(User, { foreignKey: 'user_id' });
Position.belongsTo(Market, { foreignKey: 'market_id', as: 'market' });
Market.hasMany(Position, { foreignKey: 'market_id', as: 'positions' });

User.hasMany(AntiCheatLog, { foreignKey: 'user_id', as: 'anticheat_logs' });

module.exports = {
    sequelize,
    User,
    Wallet,
    Transaction,
    Match,
    Market,
    Order,
    Position,
    AntiCheatLog
};
