'use client';
import { useEffect, useRef, ReactNode } from 'react';

export function Particles({ count = 20 }: { count?: number }) {
    return (
        <div className="particles-bg">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="particle" style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 15}s`,
                    animationDuration: `${10 + Math.random() * 15}s`,
                    width: `${2 + Math.random() * 4}px`,
                    height: `${2 + Math.random() * 4}px`
                }} />
            ))}
        </div>
    );
}

export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = ref.current;
        if (!card) return;
        const handleMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateX = (y - rect.height / 2) / 20;
            const rotateY = (rect.width / 2 - x) / 20;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        };
        const handleLeave = () => { card.style.transform = ''; };
        card.addEventListener('mousemove', handleMove);
        card.addEventListener('mouseleave', handleLeave);
        return () => { card.removeEventListener('mousemove', handleMove); card.removeEventListener('mouseleave', handleLeave); };
    }, []);

    return <div ref={ref} className={className}>{children}</div>;
}

export function ButtonTilt() {
    useEffect(() => {
        const tiltElements = document.querySelectorAll('.trade-btn, .pred-btn, .btn, .pill, .wallet-action-btn, .amount-pill, .tab-item');

        const handleMove = (e: MouseEvent) => {
            const btn = e.currentTarget as HTMLElement;
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 8;
            const rotateY = (centerX - x) / 8;
            btn.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
            btn.style.boxShadow = `${(centerX - x) / 10}px ${(centerY - y) / 10}px 25px rgba(212,160,23,0.3)`;
            btn.style.transition = 'transform 0.1s ease, box-shadow 0.1s ease';
        };

        const handleLeave = (e: MouseEvent) => {
            const btn = e.currentTarget as HTMLElement;
            btn.style.transform = '';
            btn.style.boxShadow = '';
            btn.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        };

        tiltElements.forEach(btn => {
            btn.addEventListener('mousemove', handleMove as EventListener);
            btn.addEventListener('mouseleave', handleLeave as EventListener);
        });

        return () => {
            tiltElements.forEach(btn => {
                btn.removeEventListener('mousemove', handleMove as EventListener);
                btn.removeEventListener('mouseleave', handleLeave as EventListener);
            });
        };
    }, []);

    return null;
}

export function TradeModal({ side, price, onClose }: { side: string; price: number; onClose: () => void }) {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '90%', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', animation: 'scaleIn 0.3s ease' }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Place Your Trade</h3>
                <p style={{ color: '#5a5a7a', marginBottom: 20, fontSize: 14 }}>
                    You&apos;re trading <strong style={{ color: side === 'yes' ? '#D4A017' : '#1a1a2e' }}>{side.toUpperCase()}</strong> at ₹{price}
                </p>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#8a8aaa', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Amount (₹)</label>
                    <input type="number" defaultValue={100} min={10} max={10000} style={{ width: '100%', padding: 14, border: '2px solid rgba(0,0,0,0.1)', borderRadius: 12, fontFamily: 'Manrope,sans-serif', fontSize: 18, fontWeight: 700, outline: 'none' }} />
                </div>
                <div style={{ background: 'rgba(212,160,23,0.08)', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: '#5a5a7a' }}>Potential Return</span>
                        <span style={{ fontWeight: 700 }}>₹{Math.round(100 * (100 / price))}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#5a5a7a' }}>Net Profit</span>
                        <span style={{ fontWeight: 700, color: '#22c55e' }}>+₹{Math.round(100 * (100 / price) - 100)}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: 14, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 50, background: 'transparent', cursor: 'pointer', fontFamily: 'Manrope', fontWeight: 600, fontSize: 14 }}>Cancel</button>
                    <button onClick={() => { alert('Trade placed successfully! 🎉'); onClose(); }} style={{ flex: 1, padding: 14, border: 'none', borderRadius: 50, background: '#D4A017', color: 'white', cursor: 'pointer', fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 20px rgba(212,160,23,0.4)' }}>Confirm Trade</button>
                </div>
            </div>
        </div>
    );
}
