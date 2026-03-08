'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPanel() {
    const { isAdmin, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!isAuthenticated || !isAdmin)) {
            router.replace('/');
        }
    }, [loading, isAuthenticated, isAdmin, router]);

    // Show nothing while checking auth
    if (loading) {
        return (
            <div className="page-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
                <div className="shimmer" style={{ width: '200px', height: '24px', borderRadius: '8px', margin: '0 auto 16px' }} />
                <div className="shimmer" style={{ width: '300px', height: '16px', borderRadius: '8px', margin: '0 auto' }} />
            </div>
        );
    }

    // Not admin? Don't render anything (redirect is happening)
    if (!isAuthenticated || !isAdmin) {
        return null;
    }

    return (
        <div className="page-container">
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Manage matches, create markets, and resolve outcomes.</p>

            {/* Create New Match */}
            <div className="glass-card" style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '22px' }}>🏏</span>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--amber)' }}>Create New Match</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Match Title</label>
                        <input type="text" placeholder="e.g. IND vs AUS — T20 World Cup" style={{
                            width: '100%', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--glass-border)',
                            background: 'var(--bg-glass)', fontFamily: 'var(--font)', fontSize: '14px', color: 'var(--text-primary)', outline: 'none',
                            transition: 'border-color 0.2s ease'
                        }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Date & Time</label>
                        <input type="datetime-local" style={{
                            width: '100%', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--glass-border)',
                            background: 'var(--bg-glass)', fontFamily: 'var(--font)', fontSize: '14px', color: 'var(--text-primary)', outline: 'none'
                        }} />
                    </div>
                </div>
                <button className="trade-btn yes" style={{ width: '100%', border: 'none', cursor: 'pointer' }}>
                    🚀 Publish Match
                </button>
            </div>

            {/* Create New Market */}
            <div className="glass-card" style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '22px' }}>📈</span>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--amber)' }}>Create New Market</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Select Match</label>
                        <select style={{
                            width: '100%', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--glass-border)',
                            background: 'var(--bg-glass)', fontFamily: 'var(--font)', fontSize: '14px', color: 'var(--text-primary)', outline: 'none',
                            cursor: 'pointer'
                        }}>
                            <option value="">Choose a match to attach this market to...</option>
                            <option>IND vs AUS — T20 World Cup</option>
                            <option>ENG vs SA — ODI Series</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Prediction Question</label>
                        <input type="text" placeholder="e.g. Will Virat Kohli score 50+ runs?" style={{
                            width: '100%', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--glass-border)',
                            background: 'var(--bg-glass)', fontFamily: 'var(--font)', fontSize: '14px', color: 'var(--text-primary)', outline: 'none'
                        }} />
                    </div>
                </div>
                <button style={{
                    width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)', background: 'var(--blue)',
                    color: 'white', fontFamily: 'var(--font)', fontWeight: 700, fontSize: '16px', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)', transition: 'all 0.2s ease'
                }}>
                    📊 Open Market
                </button>
            </div>

            {/* Resolve Outcomes - Danger Zone */}
            <div className="glass-card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '22px' }}>⚠️</span>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--red)' }}>Resolve Outcomes</h2>
                    <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--red-bg)', color: 'var(--red)', padding: '4px 10px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Danger Zone</span>
                </div>

                <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                    {/* Settlement Item */}
                    <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>Will India win the toss?</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>IND vs ENG · Pool: <strong style={{ color: 'var(--amber)' }}>₹45,000</strong></div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={{ padding: '8px 16px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Settle Yes</button>
                            <button style={{ padding: '8px 16px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Settle No</button>
                        </div>
                    </div>
                    {/* Empty fallback */}
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                        No more pending settlements at this time.
                    </div>
                </div>
            </div>
        </div>
    );
}
