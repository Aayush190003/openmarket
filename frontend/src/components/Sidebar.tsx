'use client';
import Link from 'next/link';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const menuItems = [
    { icon: '💳', label: 'Wallet', href: '/account' },
    { icon: '🏦', label: 'Vault', href: '/account' },
    { icon: '👑', label: 'VIP', href: '/account' },
    { icon: '👥', label: 'Affiliate', href: '/account' },
    { icon: '📊', label: 'Statistics', href: '/account' },
    { icon: '📋', label: 'Transactions', href: '/account' },
    { icon: '✅', label: 'My Bets', href: '/portfolio' },
    { icon: '⚙️', label: 'Settings', href: '/account' },
    { icon: '🛡️', label: 'Stake Smart', href: '/account' },
    { icon: '🎧', label: 'Live Support', href: '/account' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    return (
        <>
            {/* Overlay */}
            <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />

            {/* Sidebar Panel */}
            <aside className={`sidebar-panel ${isOpen ? 'open' : ''}`}>
                {/* User Profile Header */}
                <div className="sidebar-profile">
                    <div className="sidebar-avatar">GU</div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-username">Guest User</span>
                        <span className="sidebar-level">⭐ Level 1 Starter</span>
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="sidebar-link"
                            onClick={onClose}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            <span className="sidebar-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Logout */}
                <div className="sidebar-footer">
                    <Link href="/" className="sidebar-link sidebar-logout" onClick={onClose}>
                        <span className="sidebar-icon">🚪</span>
                        <span className="sidebar-label">Logout</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
