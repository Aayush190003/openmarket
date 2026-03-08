import { createNavbar, createBottomBar, initCommon } from './components.js';
import './style.css';

// Empty until loaded
let transactions = [];

function renderPage() {
  document.getElementById('app').innerHTML = `
  ${createNavbar('account')}
  
  <div class="page-container">
    <h1 class="page-title animate-fade-in-up">Account & Wallet</h1>
    <p class="page-subtitle animate-fade-in-up delay-1">Manage your profile, wallet, and transactions</p>

    <div class="two-col">
      <!-- Left: Profile -->
      <div class="glass-card animate-fade-in-up delay-2">
        <div class="profile-section">
          <div class="profile-avatar-large">U</div>
          <h3 style="font-size:20px;font-weight:700;margin-bottom:4px">Guest User</h3>
          <p style="color:var(--text-muted);margin-bottom:16px;font-size:13px">Complete profile to unlock features</p>
        </div>
        
        <div style="padding:0 4px;">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input class="form-input" type="text" placeholder="Enter username" />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" placeholder="Enter email" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input class="form-input" type="tel" placeholder="Enter phone" />
          </div>
          <button class="btn btn-primary" style="width:100%">Save Profile</button>
        </div>
      </div>

      <!-- Right: Wallet -->
      <div class="animate-fade-in-up delay-3">
        <div class="wallet-card" style="margin-bottom:20px">
          <div class="wallet-balance-label">Wallet Balance</div>
          <div class="wallet-balance-amount">₹0</div>
          <div class="wallet-actions">
            <button class="wallet-action-btn add" onclick="alert('Payment gateway integration pending')">+ Add Money</button>
            <button class="wallet-action-btn withdraw" onclick="alert('Minimum balance required for withdrawal')">↓ Withdraw</button>
          </div>
        </div>

        <div class="glass-card" style="margin-bottom:20px">
          <h4 style="font-size:14px;font-weight:700;margin-bottom:12px;">Quick Add</h4>
          <div class="amount-pills">
            <button class="amount-pill">₹500</button>
            <button class="amount-pill selected">₹1,000</button>
            <button class="amount-pill">₹2,000</button>
            <button class="amount-pill">₹5,000</button>
            <button class="amount-pill">₹10,000</button>
          </div>
        </div>

        <div class="glass-card">
          <h4 style="font-size:14px;font-weight:700;margin-bottom:12px;">Payment Method</h4>
          <div class="payment-tabs">
            <div class="payment-tab active">UPI</div>
            <div class="payment-tab">Card</div>
            <div class="payment-tab">Net Banking</div>
          </div>
          <div class="form-group">
            <label class="form-label">UPI ID</label>
            <input class="form-input" type="text" placeholder="yourname@upi" />
          </div>
          <button class="btn btn-primary" style="width:100%">Add ₹1,000</button>
        </div>
      </div>
    </div>

    <!-- Transactions -->
    <h3 style="font-size:20px;font-weight:700;margin:32px 0 16px;">Recent Transactions</h3>
    <div class="txn-list stagger">
      ${transactions.length > 0 ? transactions.map(t => `
        <div class="txn-item">
          <div class="txn-icon ${t.type}">
            ${t.type === 'deposit' ? '↑' : t.type === 'withdraw' ? '↓' : '📊'}
          </div>
          <div class="txn-details">
            <div class="txn-desc">${t.desc}</div>
            <div class="txn-date">${t.date}</div>
          </div>
          <div class="txn-amount ${t.amount >= 0 ? 'positive' : 'negative'}">
            ${t.amount >= 0 ? '+' : ''}₹${Math.abs(t.amount).toLocaleString('en-IN')}
          </div>
          <span class="status-badge ${t.status}">${t.status}</span>
        </div>
      `).join('') : `
        <div class="glass-card" style="text-align:center;padding:40px 20px;color:var(--text-muted);">
          <div style="font-size:32px;margin-bottom:8px;">💳</div>
          <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">No Transactions Yet</div>
          <div style="font-size:13px;">Your deposits, withdrawals, and trades will appear here.</div>
        </div>
      `}
    </div>
  </div>

  ${createBottomBar('account')}
`;

  // Amount pills toggle
  document.querySelectorAll('.amount-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.amount-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      const addBtn = document.querySelector('.glass-card .btn-primary:last-of-type');
      if (addBtn) addBtn.textContent = `Add ${pill.textContent}`;
    });
  });

  // Payment tabs toggle
  document.querySelectorAll('.payment-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.payment-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  initCommon();
}

renderPage();
