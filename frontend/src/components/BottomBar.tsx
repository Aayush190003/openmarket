'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomBar() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path ? 'active' : '';

    return (
        <div className="bottom-bar">
            <Link href="/" className={`tab-item ${isActive('/')}`}>
                <span className="tab-icon">🏠</span>
                <span className="tab-label">Home</span>
            </Link>
            <Link href="/matches" className={`tab-item ${isActive('/matches')}`}>
                <span className="tab-icon">📊</span>
                <span className="tab-label">Market</span>
            </Link>
            <Link href="/portfolio" className={`tab-item ${isActive('/portfolio')}`}>
                <span className="tab-icon">📁</span>
                <span className="tab-label">Portfolio</span>
            </Link>
            <Link href="/account" className={`tab-item ${isActive('/account')}`}>
                <span className="tab-icon">👤</span>
                <span className="tab-label">Account</span>
            </Link>
        </div>
    );
}
