'use client';
import { useState } from 'react';

export default function WinnersPage() {
    const [period, setPeriod] = useState('This Month');

    return (
        <div className="page-container">
            <h1 className="page-title animate-fade-in-up">Winners</h1>
            <p className="page-subtitle animate-fade-in-up delay-1">Top traders and earners this season</p>

            <div className="filter-pills animate-fade-in-up delay-2">
                {['This Week', 'This Month', 'All Time', 'By Tournament'].map(f => (
                    <button key={f} className={`pill ${period === f ? 'active' : ''}`} onClick={() => setPeriod(f)}>{f}</button>
                ))}
            </div>

            <div className="glass-card animate-scale-in delay-3" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Leaderboard coming soon!</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Compete with other users and reach the top to be featured here.</p>
            </div>
        </div>
    );
}
