'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function PortfolioPage() {
    return (
        <div className="page-container">
            <h1 className="page-title animate-fade-in-up">My Portfolio</h1>
            <p className="page-subtitle animate-fade-in-up delay-1">Track your predictions and earnings</p>

            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Your portfolio is empty</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>You haven't made any predictions yet. Start trading to see your portfolio grow!</p>
                <Link href="/matches" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                    Explore Markets
                </Link>
            </div>
        </div>
    );
}
