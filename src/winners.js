import { createNavbar, createBottomBar, initCommon } from './components.js';
import './style.css';

// Empty until data is loaded from API
let topWinners = [];
let leaderboard = [];

function renderPage() {
  document.getElementById('app').innerHTML = `
  ${createNavbar('winners')}
  
  <div class="page-container">
    <h1 class="page-title animate-fade-in-up">Winners</h1>
    <p class="page-subtitle animate-fade-in-up delay-1">Top traders and earners this season</p>

    <div class="filter-pills animate-fade-in-up delay-2">
      <button class="pill">This Week</button>
      <button class="pill active">This Month</button>
      <button class="pill">All Time</button>
      <button class="pill">By Tournament</button>
    </div>

    <!-- Podium -->
    <div class="podium-section animate-scale-in delay-3">
      ${topWinners.length > 0 ? topWinners.map(w => `
        <div class="podium-card ${w.rank === 1 ? 'first' : ''} glow-hover">
          <div class="podium-rank ${w.cls}">${w.rank === 1 ? '👑' : w.rank}</div>
          <div class="podium-avatar">${w.initials}</div>
          <div class="podium-name">${w.name}</div>
          <div class="podium-earnings">${w.earnings}</div>
          <div class="podium-stats">
            <span>W: ${w.winRate}</span>
            <span>T: ${w.trades}</span>
          </div>
        </div>
      `).join('') : `
        <div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:var(--text-muted);background:rgba(255,255,255,0.4);border-radius:24px;border:1px solid var(--glass-border);backdrop-filter:blur(20px);">
          <div style="font-size:48px;margin-bottom:12px;">🏆</div>
          <div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:6px;">No Data for This Period</div>
          <div>The leaderboard will update once predictions are settled.</div>
        </div>
      `}
    </div>

    <!-- Full Leaderboard -->
    ${leaderboard.length > 0 ? `
    <div class="glass-card" style="padding:0;overflow:auto;">
      <table class="data-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Trader</th>
            <th>Total Earnings</th>
            <th>Win Rate</th>
            <th>Trades</th>
            <th>Streak</th>
            <th></th>
          </tr>
        </thead>
        <tbody class="stagger">
          ${leaderboard.map(l => `
            <tr>
              <td><strong style="color:var(--amber)">#${l.rank}</strong></td>
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="avatar" style="width:32px;height:32px;font-size:11px">${l.name.slice(0, 2).toUpperCase()}</div>
                  <strong>${l.name}</strong>
                </div>
              </td>
              <td><strong>${l.earnings}</strong></td>
              <td>${l.winRate}</td>
              <td>${l.trades}</td>
              <td>🔥${l.streak}</td>
              <td><button class="btn btn-outline btn-sm">View</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>` : ''}
  </div>

  ${createBottomBar('winners')}
`;

  // Filter pills
  document.querySelectorAll('.filter-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });

  initCommon();
}

renderPage();
