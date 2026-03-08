'use client';

export default function MatchesPage() {
    return (
        <div className="page-container">
            <h1 className="page-title animate-fade-in-up">All Markets</h1>
            <p className="page-subtitle animate-fade-in-up delay-1">Browse and trade on cricket predictions</p>

            <div className="filter-bar animate-fade-in-up delay-2">
                <select className="filter-select"><option>All Tournaments</option><option>ICC World Cup</option><option>The Ashes</option><option>IPL 2026</option></select>
                <select className="filter-select"><option>All Status</option><option>🔴 Live</option><option>🕐 Upcoming</option><option>✅ Completed</option></select>
                <select className="filter-select"><option>All Categories</option><option>Match Result</option><option>Player Performance</option><option>Innings Score</option></select>
                <select className="filter-select" style={{ marginLeft: 'auto' }}><option>Sort: Trending</option><option>Sort: Volume</option><option>Sort: Newest</option></select>
            </div>

            <div className="main-with-sidebar">
                <div className="markets-grid stagger">
                    <div className="glass-card animate-scale-in" style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏏</div>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>No matches found</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Check back later for new markets and tournaments.</p>
                    </div>
                </div>

                <div className="sidebar">
                    <div className="glass-card" style={{ position: 'sticky', top: 90 }}>
                        <div className="sidebar-title">🔥 Trending Markets</div>
                        <div className="stagger">
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No trending markets currently.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
