import { createNavbar, createBottomBar, initCommon } from './components.js';
import './style.css';

const stadiumImg = 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80';

// Fetch live matches from API (empty until backend populates)
let matches = [];
let predictions = [];

async function loadMatches() {
  try {
    const res = await fetch('/api/matches/live');
    if (res.ok) {
      const data = await res.json();
      matches = data.matches || [];
    }
  } catch (e) {
    // API not available, show empty state
  }
  renderPage();
}

function renderPage() {
  document.getElementById('app').innerHTML = `
  ${createNavbar('home')}
  
  <div class="page-container">
    <h1 class="page-title animate-fade-in-up">Live Market</h1>
    <p class="page-subtitle animate-fade-in-up delay-1">Predict game outcomes and win real cash instantly.</p>
    
    <div class="filter-pills animate-fade-in-up delay-2">
      <button class="pill active"><span class="pill-icon">⚡</span> Live Matches</button>
      <button class="pill"><span class="pill-icon">🕐</span> Upcoming</button>
      <button class="pill"><span class="pill-icon">🏆</span> Tournaments</button>
      <button class="pill"><span class="pill-icon">📅</span> Recent</button>
    </div>

    ${matches.length > 0 ? renderMatchCards() : renderEmptyState()}
  </div>

  ${createBottomBar('home')}
`;

  // Filter pills toggle
  document.querySelectorAll('.filter-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });

  initCommon();
}

function renderEmptyState() {
  return `
    <!-- Featured Match Placeholder -->
    <div class="featured-card tilt-card animate-scale-in delay-3">
      <div class="featured-image">
        <img src="${stadiumImg}" alt="Cricket Stadium" loading="lazy" />
        <div class="stadium-overlay">
          <div class="match-title" style="font-size:22px;opacity:0.9;">Welcome to OpenMarket</div>
          <div class="match-subtitle">Cricket Prediction Market</div>
        </div>
      </div>
      <div class="featured-content">
        <div class="prediction-label">GETTING STARTED</div>
        <div class="prediction-question">No live matches right now. Check back soon for exciting prediction markets!</div>
        <div class="trade-buttons">
          <button class="trade-btn yes" onclick="window.location.href='/matches.html'">
            Browse Markets
          </button>
          <button class="trade-btn no" onclick="window.location.href='/account.html'">
            Setup Wallet
          </button>
        </div>
      </div>
    </div>

    <!-- Empty prediction cards -->
    <div class="predictions-grid stagger">
      <div class="prediction-card glow-hover" style="display:flex;align-items:center;justify-content:center;min-height:180px;opacity:0.6;">
        <div style="text-align:center;color:var(--text-muted);">
          <div style="font-size:40px;margin-bottom:8px;">🏏</div>
          <div style="font-weight:600;">No predictions available</div>
          <div style="font-size:13px;margin-top:4px;">Markets will appear when matches are scheduled</div>
        </div>
      </div>
    </div>`;
}

function renderMatchCards() {
  return matches.map(m => `
    <div class="featured-card tilt-card animate-scale-in delay-3">
      <div class="featured-content">
        <div class="prediction-label">${m.tournament || 'MATCH'}</div>
        <div class="prediction-question">${m.team1} vs ${m.team2}</div>
        <div class="trade-buttons">
          <button class="trade-btn yes" onclick="handleTrade('yes', ${m.yesPrice || 50})">
            Yes <strong>₹${m.yesPrice || 50}</strong>
          </button>
          <button class="trade-btn no" onclick="handleTrade('no', ${m.noPrice || 50})">
            No <strong>₹${m.noPrice || 50}</strong>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Trade handler
window.handleTrade = function (side, price) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);
    backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;z-index:9999;
    animation:fadeIn 0.3s ease;
  `;
  modal.innerHTML = `
    <div style="background:white;border-radius:20px;padding:32px;max-width:420px;width:90%;box-shadow:0 25px 60px rgba(0,0,0,0.2);animation:scaleIn 0.3s ease;">
      <h3 style="font-size:20px;font-weight:800;margin-bottom:8px;">Place Your Trade</h3>
      <p style="color:#5a5a7a;margin-bottom:20px;font-size:14px;">You're trading <strong style="color:${side === 'yes' ? '#D4A017' : '#1a1a2e'}">${side.toUpperCase()}</strong> at ₹${price}</p>
      <div style="margin-bottom:16px;">
        <label style="font-size:12px;font-weight:600;color:#8a8aaa;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:6px;">Amount (₹)</label>
        <input type="number" value="100" min="10" max="10000" style="width:100%;padding:14px;border:2px solid rgba(0,0,0,0.1);border-radius:12px;font-family:Manrope,sans-serif;font-size:18px;font-weight:700;outline:none;" onfocus="this.style.borderColor='#D4A017'" onblur="this.style.borderColor='rgba(0,0,0,0.1)'" />
      </div>
      <div style="display:flex;gap:8px;margin-bottom:20px;">
        ${[50, 100, 500, 1000].map(a => `<button onclick="this.parentElement.previousElementSibling.querySelector('input').value=${a}" style="flex:1;padding:8px;border:1.5px solid rgba(0,0,0,0.1);border-radius:50px;background:transparent;cursor:pointer;font-family:Manrope;font-weight:600;font-size:12px;">₹${a}</button>`).join('')}
      </div>
      <div style="background:rgba(212,160,23,0.08);border-radius:12px;padding:14px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span style="color:#5a5a7a">Potential Return</span><span style="font-weight:700;">₹${Math.round(100 * (100 / price))}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:13px;"><span style="color:#5a5a7a">Net Profit</span><span style="font-weight:700;color:#22c55e">+₹${Math.round(100 * (100 / price) - 100)}</span></div>
      </div>
      <div style="display:flex;gap:12px;">
        <button onclick="this.closest('div[style*=fixed]').remove()" style="flex:1;padding:14px;border:1.5px solid rgba(0,0,0,0.1);border-radius:50px;background:transparent;cursor:pointer;font-family:Manrope;font-weight:600;font-size:14px;">Cancel</button>
        <button onclick="alert('Trade placed successfully! 🎉');this.closest('div[style*=fixed]').remove()" style="flex:1;padding:14px;border:none;border-radius:50px;background:#D4A017;color:white;cursor:pointer;font-family:Manrope;font-weight:700;font-size:14px;box-shadow:0 4px 20px rgba(212,160,23,0.4);">Confirm Trade</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
};

loadMatches();
