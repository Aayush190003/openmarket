import { createNavbar, createBottomBar, initCommon, animateCounter } from './components.js';
import './style.css';

// Empty until data is loaded
let trades = [];

function getPL(t) {
  if (t.status === 'lost') return -t.invested;
  return t.current - t.invested;
}

function renderPage() {
  document.getElementById('app').innerHTML = `
  ${createNavbar('portfolio')}
  
  <div class="page-container">
    <h1 class="page-title animate-fade-in-up">My Portfolio</h1>
    <p class="page-subtitle animate-fade-in-up delay-1">Track your predictions and earnings</p>

    <div class="stats-row stagger">
      <div class="stat-card">
        <div class="stat-label">Total Invested</div>
        <div class="stat-value">₹<span id="counter-invested">0</span></div>
        <span class="stat-change" style="color:var(--text-muted)">No active investments</span>
      </div>
      <div class="stat-card">
        <div class="stat-label">Current Value</div>
        <div class="stat-value">₹<span id="counter-value">0</span></div>
        <span class="stat-change" style="color:var(--text-muted)">-</span>
      </div>
      <div class="stat-card">
        <div class="stat-label">Profit / Loss</div>
        <div class="stat-value" style="color:var(--text-primary)">₹<span id="counter-pl">0</span></div>
        <span class="stat-change" style="color:var(--text-muted)">All time</span>
      </div>
      <div class="stat-card">
        <div class="stat-label">Win Rate</div>
        <div style="display:flex;align-items:center;gap:16px;">
          <div class="circular-progress">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle class="progress-bg" cx="40" cy="40" r="34" />
              <circle class="progress-bar" cx="40" cy="40" r="34" 
                stroke-dasharray="${2 * Math.PI * 34}" 
                stroke-dashoffset="${2 * Math.PI * 34}" />
            </svg>
            <div class="progress-text">0%</div>
          </div>
        </div>
      </div>
    </div>

    <div class="filter-pills" style="margin-bottom:20px">
      <button class="pill active" data-filter="all">All</button>
      <button class="pill" data-filter="active">⚡ Active</button>
      <button class="pill" data-filter="won">✅ Won</button>
      <button class="pill" data-filter="lost">❌ Lost</button>
    </div>

    <div class="glass-card" style="padding:0;overflow:auto;">
      <table class="data-table">
        <thead>
          <tr>
            <th>Match</th>
            <th>Prediction</th>
            <th>Position</th>
            <th>Invested</th>
            <th>Current Value</th>
            <th>P&L</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="trades-body">
          ${trades.length > 0 ? trades.map(t => {
    const pl = getPL(t);
    return `
            <tr data-status="${t.status}">
              <td><strong>${t.match}</strong></td>
              <td style="max-width:220px">${t.question}</td>
              <td><span class="badge-tag ${t.position === 'Yes' ? 'high-yield' : 'volatile'}" style="padding:6px 14px">${t.position}</span></td>
              <td>₹${t.invested.toLocaleString('en-IN')}</td>
              <td>₹${t.current.toLocaleString('en-IN')}</td>
              <td style="color:${pl >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:700">${pl >= 0 ? '+' : ''}₹${Math.abs(pl).toLocaleString('en-IN')}</td>
              <td><span class="status-badge ${t.status}">${t.status.charAt(0).toUpperCase() + t.status.slice(1)}</span></td>
            </tr>`;
  }).join('') : `
            <tr>
              <td colspan="7" style="text-align:center;padding:48px 20px;color:var(--text-muted);">
                <div style="font-size:40px;margin-bottom:12px;">📁</div>
                <div style="font-size:16px;font-weight:600;color:var(--text-primary);margin-bottom:6px;">No Portfolio Data Yet</div>
                <div>Your active and completed predictions will appear here once you place a trade.</div>
                <button class="btn btn-primary" style="margin-top:16px;" onclick="window.location.href='/matches.html'">Explore Markets</button>
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
  </div>

  ${createBottomBar('portfolio')}
`;

  // Filter trades
  document.querySelectorAll('.filter-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.dataset.filter;
      document.querySelectorAll('#trades-body tr[data-status]').forEach(row => {
        if (filter === 'all' || row.dataset.status === filter) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });

  initCommon();
}

renderPage();
