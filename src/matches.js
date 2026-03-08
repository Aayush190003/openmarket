import { createNavbar, createBottomBar, initCommon } from './components.js';
import './style.css';

// Fetch matches from API (empty until backend populates)
let matches = [];
let trending = [];

async function loadMatches() {
  try {
    const res = await fetch('/api/matches');
    if (res.ok) {
      const data = await res.json();
      matches = data.matches || [];
    }
  } catch (e) {
    // API not available
  }
  renderPage();
}

function renderPage() {
  document.getElementById('app').innerHTML = `
  ${createNavbar('matches')}
  
  <div class="page-container">
    <h1 class="page-title animate-fade-in-up">All Markets</h1>
    <p class="page-subtitle animate-fade-in-up delay-1">Browse and trade on cricket predictions</p>

    <div class="filter-bar animate-fade-in-up delay-2">
      <select class="filter-select">
        <option>All Tournaments</option>
        <option>ICC World Cup</option>
        <option>IPL 2026</option>
        <option>T20 World Cup</option>
        <option>The Ashes</option>
      </select>
      <select class="filter-select">
        <option>All Status</option>
        <option>🔴 Live</option>
        <option>🕐 Upcoming</option>
        <option>✅ Completed</option>
      </select>
      <select class="filter-select" style="margin-left:auto">
        <option>Sort by: Trending</option>
        <option>Sort by: Volume</option>
        <option>Sort by: Newest</option>
      </select>
    </div>

    <div class="main-with-sidebar">
      <div class="markets-grid stagger">
        ${matches.length > 0 ? matches.map(m => renderMatchCard(m)).join('') : renderEmptyMarkets()}
      </div>

      <div class="sidebar">
        <div class="glass-card" style="position:sticky;top:90px;">
          <div class="sidebar-title">🔥 Trending Markets</div>
          <div class="stagger">
            ${trending.length > 0 ? trending.map((t, i) => `
              <div class="trending-item">
                <div class="trending-rank">${i + 1}</div>
                <div class="trending-info">
                  <div class="trending-question">${t.q}</div>
                  <div class="trending-odds">
                    <span class="t-yes">Yes ₹${t.yes}</span>
                    <span class="t-no">No ₹${t.no}</span>
                  </div>
                </div>
              </div>
            `).join('') : `
              <div style="text-align:center;padding:30px 10px;color:var(--text-muted);">
                <div style="font-size:32px;margin-bottom:8px;">📊</div>
                <div style="font-size:13px;">No trending markets yet</div>
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  </div>

  ${createBottomBar('matches')}
`;

  initCommon();
}

function renderMatchCard(m) {
  return `
    <div class="market-card glow-hover">
      <div class="market-thumb">
        <img src="${m.img || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&q=70'}" alt="${m.name}" loading="lazy" />
        <div class="match-badge" style="position:absolute;top:12px;left:12px;">
          <span class="${m.status === 'LIVE' ? 'live-badge' : 'status-badge ' + (m.status === 'UPCOMING' ? 'active' : 'won')}">${m.status === 'LIVE' ? '<span class="live-dot"></span>' : ''} ${m.status}</span>
        </div>
      </div>
      <div class="market-body">
        <div class="market-name">${m.name}</div>
        <div class="market-tournament">${m.tournament}</div>
        <div class="market-meta">
          <div class="market-meta-item">
            <div class="meta-value">${m.markets || 0}</div>
            <div class="meta-label">Markets</div>
          </div>
          <div class="market-meta-item">
            <div class="meta-value">${m.volume || '₹0'}</div>
            <div class="meta-label">Volume</div>
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="window.location.href='/'">View Markets</button>
      </div>
    </div>`;
}

function renderEmptyMarkets() {
  return `
    <div class="market-card glow-hover" style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;min-height:300px;">
      <div style="text-align:center;color:var(--text-muted);">
        <div style="font-size:48px;margin-bottom:12px;">🏟️</div>
        <div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:6px;">No Markets Available</div>
        <div style="font-size:14px;max-width:300px;margin:0 auto;">Markets will appear here when cricket matches are scheduled. Check back soon!</div>
      </div>
    </div>`;
}

loadMatches();
