'use client';
import { useState } from 'react';

export default function AccountPage() {
    const [paymentTab, setPaymentTab] = useState('UPI');
    const [selectedAmount, setSelectedAmount] = useState(1000);

    return (
        <div className="page-container">
            <h1 className="page-title animate-fade-in-up">Account & Wallet</h1>
            <p className="page-subtitle animate-fade-in-up delay-1">Manage your profile, wallet, and transactions</p>

            <div className="two-col">
                <div className="glass-card animate-fade-in-up delay-2">
                    <div className="profile-section">
                        <div className="profile-avatar-large">GU</div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Guest User</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 13 }}>New Member</p>
                    </div>
                    <div style={{ padding: '0 4px' }}>
                        <div className="form-group"><label className="form-label">Username</label><input className="form-input" type="text" placeholder="Enter username" /></div>
                        <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="Enter email" /></div>
                        <div className="form-group"><label className="form-label">Phone</label><input className="form-input" type="tel" placeholder="Enter phone number" /></div>
                        <button className="btn btn-primary" style={{ width: '100%' }}>Update Profile</button>
                    </div>
                </div>

                <div className="animate-fade-in-up delay-3">
                    <div className="wallet-card" style={{ marginBottom: 20 }}>
                        <div className="wallet-balance-label">Wallet Balance</div>
                        <div className="wallet-balance-amount">₹0</div>
                        <div className="wallet-actions">
                            <button className="wallet-action-btn add" onClick={() => alert('Payment gateway integration pending')}>+ Add Money</button>
                            <button className="wallet-action-btn withdraw" onClick={() => alert('Withdrawal feature coming soon')}>↓ Withdraw</button>
                        </div>
                    </div>

                    <div className="glass-card" style={{ marginBottom: 20 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Quick Add</h4>
                        <div className="amount-pills">
                            {[500, 1000, 2000, 5000, 10000].map(a => (
                                <button key={a} className={`amount-pill ${selectedAmount === a ? 'selected' : ''}`} onClick={() => setSelectedAmount(a)}>₹{a.toLocaleString('en-IN')}</button>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card">
                        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Payment Method</h4>
                        <div className="payment-tabs">
                            {['UPI', 'Card', 'Net Banking'].map(t => (
                                <div key={t} className={`payment-tab ${paymentTab === t ? 'active' : ''}`} onClick={() => setPaymentTab(t)}>{t}</div>
                            ))}
                        </div>
                        <div className="form-group"><label className="form-label">{paymentTab} ID</label><input className="form-input" type="text" placeholder={paymentTab === 'UPI' ? 'yourname@upi' : paymentTab === 'Card' ? 'Card number' : 'Select bank'} /></div>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => alert('Payment gateway integration pending')}>Add ₹{selectedAmount.toLocaleString('en-IN')}</button>
                    </div>
                </div>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 700, margin: '32px 0 16px' }}>Recent Transactions</h3>
            <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>🧾</div>
                <p style={{ color: 'var(--text-secondary)' }}>No transactions yet.</p>
            </div>
        </div>
    );
}
