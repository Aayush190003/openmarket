/**
 * Database Seed Script
 * Creates sample matches, markets, and an admin user
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Wallet, Match, Market } = require('./models');

async function seed() {
    try {
        await sequelize.sync({ force: true });
        console.log('✅ Tables created');

        // Admin user
        const adminHash = await bcrypt.hash('Admin@2026', 12);
        const admin = await User.create({
            username: 'admin',
            email: 'admin@openmarket.com',
            password_hash: adminHash,
            role: 'admin',
            kyc_status: 'verified'
        });
        await Wallet.create({ user_id: admin.id, balance: 100000 });
        console.log('✅ Admin: admin@openmarket.com / Admin@2026');

        // Demo user
        const demoHash = await bcrypt.hash('Demo@2026', 12);
        const demo = await User.create({
            username: 'demo_user',
            email: 'demo@openmarket.com',
            password_hash: demoHash,
            kyc_status: 'verified'
        });
        await Wallet.create({ user_id: demo.id, balance: 12450 });
        console.log('✅ Demo: demo@openmarket.com / Demo@2026');

        // Matches
        const matches = await Match.bulkCreate([
            {
                team_a: 'India', team_b: 'Australia', team_a_code: 'IND', team_b_code: 'AUS',
                tournament: 'ICC Men\'s World Cup Final', venue: 'Ahmedabad',
                match_type: 'ODI', status: 'live',
                start_time: new Date(), image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80'
            },
            {
                team_a: 'England', team_b: 'South Africa', team_a_code: 'ENG', team_b_code: 'SA',
                tournament: 'ICC World Cup Semi-Final', venue: 'Mumbai',
                match_type: 'ODI', status: 'live',
                start_time: new Date(), image_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&q=70'
            },
            {
                team_a: 'Pakistan', team_b: 'New Zealand', team_a_code: 'PAK', team_b_code: 'NZ',
                tournament: 'ICC World Cup', venue: 'Kolkata',
                match_type: 'ODI', status: 'upcoming',
                start_time: new Date(Date.now() + 24 * 60 * 60 * 1000), image_url: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=400&q=70'
            },
            {
                team_a: 'West Indies', team_b: 'Bangladesh', team_a_code: 'WI', team_b_code: 'BAN',
                tournament: 'ICC World Cup', venue: 'Chennai',
                match_type: 'ODI', status: 'upcoming',
                start_time: new Date(Date.now() + 48 * 60 * 60 * 1000)
            },
            {
                team_a: 'Australia', team_b: 'England', team_a_code: 'AUS', team_b_code: 'ENG',
                tournament: 'The Ashes - 3rd Test', venue: 'Melbourne',
                match_type: 'Test', status: 'completed',
                start_time: new Date(Date.now() - 48 * 60 * 60 * 1000)
            }
        ]);
        console.log('✅ 5 matches created');

        // Markets for IND vs AUS
        const indAus = matches[0];
        await Market.bulkCreate([
            { match_id: indAus.id, question: 'Will India win the match against Australia?', category: 'match_result', yes_price: 62, no_price: 38, total_volume: 4200000, total_yes_shares: 9200, total_no_shares: 4100, total_traders: 13300, badge_type: 'popular' },
            { match_id: indAus.id, question: 'Will Virat Kohli score 50+ runs today?', category: 'player_performance', yes_price: 32, no_price: 68, total_volume: 890000, total_yes_shares: 3200, total_no_shares: 6800, badge_type: 'high_yield' },
            { match_id: indAus.id, question: 'Will India score 300+ runs in first innings?', category: 'innings', yes_price: 45, no_price: 55, total_volume: 1250000, total_yes_shares: 4500, total_no_shares: 5500, badge_type: 'popular' },
            { match_id: indAus.id, question: 'Will there be rain interruption today?', category: 'extras', yes_price: 12, no_price: 88, total_volume: 320000, total_yes_shares: 1200, total_no_shares: 8800, badge_type: 'volatile' },
            { match_id: indAus.id, question: 'Will Bumrah take 3+ wickets?', category: 'bowling', yes_price: 38, no_price: 62, total_volume: 560000, badge_type: 'new' },
            { match_id: indAus.id, question: 'Will India score 60+ in first 10 overs?', category: 'powerplay', yes_price: 55, no_price: 45, total_volume: 780000, badge_type: 'popular' },
        ]);

        // Markets for ENG vs SA
        const engSa = matches[1];
        await Market.bulkCreate([
            { match_id: engSa.id, question: 'Will England win the match?', category: 'match_result', yes_price: 55, no_price: 45, total_volume: 2800000, badge_type: 'popular' },
            { match_id: engSa.id, question: 'Will Joe Root score a century?', category: 'player_performance', yes_price: 22, no_price: 78, total_volume: 450000, badge_type: 'high_yield' },
        ]);

        // Markets for PAK vs NZ (upcoming)
        const pakNz = matches[2];
        await Market.bulkCreate([
            { match_id: pakNz.id, question: 'Will Pakistan win the match?', category: 'match_result', yes_price: 58, no_price: 42, total_volume: 1500000, badge_type: 'popular' },
            { match_id: pakNz.id, question: 'Will Babar Azam score 100?', category: 'player_performance', yes_price: 18, no_price: 82, total_volume: 380000, badge_type: 'high_yield' },
        ]);

        console.log('✅ 10 markets created');
        console.log('\n🚀 Seed complete! Backend ready.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    }
}

seed();
