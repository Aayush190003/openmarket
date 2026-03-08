// Shared components and utilities for OpenMarket

// ---- Navbar HTML ----
export function createNavbar(activePage = 'home') {
  return `
  <nav class="navbar" id="navbar">
    <div class="nav-left">
      <a href="/" class="nav-logo">
        <div class="logo-icon">🏏</div>
        OpenMarket
      </a>
      <div class="nav-links">
        <a href="/matches.html" class="${activePage === 'matches' ? 'active' : ''}">Matches</a>
        <a href="/portfolio.html" class="${activePage === 'portfolio' ? 'active' : ''}">Portfolio</a>
        <a href="/winners.html" class="${activePage === 'winners' ? 'active' : ''}">Winners</a>
      </div>
    </div>
    <div class="nav-right">
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="Search matches..." />
      </div>
      <button class="nav-btn" title="Notifications">
        🔔
        <span class="badge"></span>
      </button>
      <div class="wallet-btn" onclick="window.location.href='/account.html'">
        <div>
          <div class="wallet-label">Wallet</div>
          <div class="wallet-amount" id="nav-wallet">₹0</div>
        </div>
      </div>
      <div class="avatar" onclick="window.location.href='/account.html'" title="My Account">AK</div>
    </div>
  </nav>`;
}

// ---- Bottom Tab Bar HTML ----
export function createBottomBar(activePage = 'home') {
  return `
  <div class="bottom-bar">
    <a href="/" class="tab-item ${activePage === 'home' ? 'active' : ''}">
      <span class="tab-icon">🏠</span>
      <span class="tab-label">Home</span>
    </a>
    <a href="/matches.html" class="tab-item ${activePage === 'matches' ? 'active' : ''}">
      <span class="tab-icon">📊</span>
      <span class="tab-label">Market</span>
    </a>
    <a href="/portfolio.html" class="tab-item ${activePage === 'portfolio' ? 'active' : ''}">
      <span class="tab-icon">📁</span>
      <span class="tab-label">Portfolio</span>
    </a>
    <a href="/account.html" class="tab-item ${activePage === 'account' ? 'active' : ''}">
      <span class="tab-icon">👤</span>
      <span class="tab-label">Account</span>
    </a>
  </div>`;
}

// ---- Floating Particles ----
export function createParticles(count = 20) {
  const container = document.createElement('div');
  container.className = 'particles-bg';
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 15}s`;
    particle.style.animationDuration = `${10 + Math.random() * 15}s`;
    particle.style.width = `${2 + Math.random() * 4}px`;
    particle.style.height = particle.style.width;
    container.appendChild(particle);
  }
  document.body.appendChild(container);
}

// ---- 3D Tilt Effect ----
export function initTiltEffect() {
  document.querySelectorAll('.tilt-card, .prediction-card, .glass-card, .stat-card, .market-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ---- Navbar Scroll Effect ----
export function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ---- Intersection Observer for Animations ----
export function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.glass-card, .prediction-card, .stat-card, .market-card, .txn-item, .podium-card').forEach(el => {
    observer.observe(el);
  });
}

// ---- Counter Animation ----
export function animateCounter(el, target, duration = 1500) {
  const start = 0;
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    el.textContent = current.toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ---- 3D Button Hover Effect ----
export function initButtonTilt() {
  document.querySelectorAll('.trade-btn, .pred-btn, .btn, .pill, .wallet-action-btn, .amount-pill, .tab-item').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
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
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.boxShadow = '';
      btn.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    });
  });
}

// ---- Initialize Common Features ----
export function initCommon() {
  createParticles();
  initTiltEffect();
  initButtonTilt();
  initNavbarScroll();
  initScrollAnimations();
}
