'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Navbar() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path ? 'active' : '';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <>
            <nav className="navbar" id="navbar">
                <div className="nav-left">
                    <Link href="/" className="nav-logo">
                        <div className="logo-icon">🏏</div>
                        OpenMarket
                    </Link>
                    <div className="nav-links">
                        <Link href="/matches" className={isActive('/matches')}>Matches</Link>
                        <Link href="/portfolio" className={isActive('/portfolio')}>Portfolio</Link>
                        <Link href="/winners" className={isActive('/winners')}>Winners</Link>
                    </div>
                </div>
                <div className="nav-center">
                    <Link href="/account" className="wallet-pill-ui">
                        <div className="wallet-balance-container">
                            <span className="crypto-symbol">₹</span>
                            <span className="wallet-balance-val">0.00</span>
                        </div>
                        <div className="wallet-button-action">
                            Wallet
                        </div>
                    </Link>
                </div>
                <div className="nav-right" style={{ justifyContent: 'flex-end' }}>
                    <div className="search-bar">
                        <span className="search-icon">🔍</span>
                        <input type="text" placeholder="Search matches..." />
                    </div>

                    <button className="nav-btn" title="Notifications">
                        🔔
                        <span className="badge" style={{ display: 'none' }}></span>
                    </button>
                    <button onClick={() => setIsSidebarOpen(true)} className="avatar" title="My Account" style={{ border: 'none' }}>GU</button>
                </div>
            </nav>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </>
    );
}
