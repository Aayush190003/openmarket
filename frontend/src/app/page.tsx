'use client';
import { useState } from 'react';

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState('Live Matches');
  const filters = ['⚡ Live Matches', '🕐 Upcoming', '🏆 Tournaments', '📅 Recent'];

  return (
    <div className="page-container">
      <h1 className="page-title animate-fade-in-up">Live Market</h1>
      <p className="page-subtitle animate-fade-in-up delay-1">Predict game outcomes and win real cash instantly.</p>

      <div className="filter-pills animate-fade-in-up delay-2">
        {filters.map(f => (
          <button key={f} className={`pill ${f.includes(activeFilter) ? 'active' : ''}`} onClick={() => setActiveFilter(f.split(' ').slice(1).join(' '))}>
            {f}
          </button>
        ))}
      </div>

      <div className="glass-card animate-scale-in delay-3" style={{ textAlign: 'center', padding: '80px 20px', marginTop: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>Markets are currently closed</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>We're currently preparing new prediction markets. Check back soon when the next game goes live!</p>
      </div>
    </div>
  );
}
