// DOMINION OF ARKENFOLD — COMMUNITY PORTAL SCRIPT
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, updateProfile,
  updatePassword, onAuthStateChanged, sendPasswordResetEmail,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
  reauthenticateWithCredential, EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

/* ═══════════════════════════════════════════════
   FIREBASE CONFIG
   ═══════════════════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyDsXlCyLS4WodBRnwtqM6TbgbW8SighNOI",
  authDomain: "dominion-of-arkenfold.firebaseapp.com",
  projectId: "dominion-of-arkenfold",
  storageBucket: "dominion-of-arkenfold.firebasestorage.app",
  messagingSenderId: "189228678030",
  appId: "1:189228678030:web:e07ca03f6dfba9d14a02df",
  measurementId: "G-XM8T002XYP"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* ═══════════════════════════════════════════════
   DATA — Members, Council, Updates
   ═══════════════════════════════════════════════ */
const MEMBERS = [
  { name: "Gamer_sam612", role: "archon", title: "Supreme Archon", desc: "Highest authority of the Dominion" },
  { name: "_navi_49", role: "council", title: "High Command Council", desc: "Advisor and administrator of the Dominion" },
  { name: "Lordwolf2203", role: "council", title: "High Command Council", desc: "Advisor and administrator of the Dominion" },
  { name: "Retryant", role: "citizen" },
  { name: "thereal43213222", role: "citizen" },
  { name: "kaiLordXD", role: "citizen" },
  { name: "tomabrato", role: "citizen" },
  { name: ".ZingyParty6068", role: "citizen" },
  { name: "poisedsole35967", role: "citizen" },
  { name: "RicardoDono", role: "citizen" },
  { name: "golfista222", role: "citizen" },
  { name: "Acc200", role: "citizen" },
  { name: "Amfound", role: "citizen" },
  { name: "Onpowerg", role: "citizen" },
  { name: ".RadTerror202", role: "citizen" },
  { name: "Deadsoul888", role: "citizen" },
  { name: "LordAspect888", role: "citizen" },
  { name: "SKYKING4000", role: "citizen" },
  { name: "leafy02leafeon", role: "citizen" },
  { name: "Alein2203", role: "citizen" },
  { name: "KhioALT", role: "citizen" },
  { name: "LordAspect777", role: "citizen" },
  { name: "7youngstunna7", role: "citizen" }
];

const UPDATES = [
  { id: 1, title: "Constitution Ratified", body: "The foundational Constitution of the Dominion has been formally ratified and enacted by the Supreme Archon. All nine articles are now in effect.", date: "August 28, 2026", category: "governance", pinned: true },
  { id: 2, title: "Council Formed", body: "The High Command Council has been established. Two founding members have been appointed to advise and assist the Supreme Archon.", date: "August 25, 2026", category: "governance", pinned: false },
  { id: 3, title: "Arkenfold Opens", body: "The Dominion of Arkenfold officially opens its doors to citizens. All loyal subjects are welcome to join the ranks.", date: "August 20, 2026", category: "community", pinned: false },
  { id: 4, title: "Community Portal Launched", body: "The official website and community portal of the Dominion is now live. Citizens can explore the Constitution, meet the Council, and stay updated.", date: "August 28, 2026", category: "community", pinned: false },
  { id: 5, title: "Founding Era Declared", body: "The Supreme Archon has declared the beginning of the Founding Era — the first chapter in the history of the Dominion of Arkenfold.", date: "August 15, 2026", category: "general", pinned: false }
];

/* ═══════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════ */
let currentTheme = localStorage.getItem('arkenfold-theme') || 'dark';
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('arkenfold-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀' : '☾';
}
window.toggleTheme = () => applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
applyTheme(currentTheme);

/* ═══════════════════════════════════════════════
   HASH ROUTING
   ═══════════════════════════════════════════════ */
const PAGES = ['home', 'constitution', 'council', 'updates', 'account'];
let currentPage = 'home';

window.navigateTo = function(page) {
  if (!PAGES.includes(page)) page = 'home';
  if (page === currentPage && document.getElementById(page)?.classList.contains('active')) return;
  currentPage = page;
  window.location.hash = page === 'home' ? '' : page;
  renderPage(page);
  closeMobileMenu();
};

function renderPage(page) {
  PAGES.forEach(p => {
    const el = document.getElementById(p);
    if (el) el.classList.toggle('active', p === page);
  });
  // Update nav links
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (page === 'constitution') initConstitutionPage();
  if (page === 'council') renderCouncil();
  if (page === 'updates') renderUpdates();
  if (page === 'account') renderAccount();
  // Re-init scroll reveals for new page content
  requestAnimationFrame(() => {
    document.querySelectorAll('#' + page + ' .reveal-up, #' + page + ' .reveal-left, #' + page + ' .reveal-right, #' + page + ' .reveal-scale').forEach(el => {
      el.classList.remove('visible');
    });
    initScrollReveals();
    if (page === 'council') initTiltEffect();
    if (page === 'updates') initTiltEffect();
  });
}

function handleHash() {
  const hash = window.location.hash.replace('#', '').trim();
  const page = PAGES.includes(hash) ? hash : 'home';
  currentPage = page;
  renderPage(page);
}
window.addEventListener('hashchange', handleHash);

/* ═══════════════════════════════════════════════
   PARTICLES
   ═══════════════════════════════════════════════ */
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const count = window.innerWidth < 768 ? 12 : 22;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 3 + 1;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;animation-duration:${Math.random()*15+10}s;animation-delay:-${Math.random()*20}s;opacity:${Math.random()*0.4+0.1};`;
    container.appendChild(p);
  }
}

/* ═══════════════════════════════════════════════
   SPLASH SCREEN
   ═══════════════════════════════════════════════ */
function initSplash() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;
  document.body.classList.add('splash-active');
  setTimeout(() => {
    splash.classList.add('hidden');
    document.body.classList.remove('splash-active');
    setTimeout(() => splash.remove(), 600);
  }, 2100);
}

/* ═══════════════════════════════════════════════
   HEADER SCROLL
   ═══════════════════════════════════════════════ */
function initHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* ═══════════════════════════════════════════════
   SCROLL PROGRESS
   ═══════════════════════════════════════════════ */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const pct = document.documentElement.scrollHeight - window.innerHeight > 0
          ? (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
          : 0;
        bar.style.width = pct + '%';
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* ═══════════════════════════════════════════════
   BACK TO TOP
   ═══════════════════════════════════════════════ */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        btn.classList.toggle('visible', window.scrollY > 300);
        ticking = false;
      });
      ticking = true;
    }
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ═══════════════════════════════════════════════
   MOBILE MENU
   ═══════════════════════════════════════════════ */
function initMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const overlay = document.getElementById('mobile-nav-overlay');
  const close = document.getElementById('mobile-nav-close');
  if (!toggle || !overlay) return;
  toggle.addEventListener('click', () => {
    overlay.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    close?.focus();
  });
  close?.addEventListener('click', closeMobileMenu);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeMobileMenu(); });
}
function closeMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const overlay = document.getElementById('mobile-nav-overlay');
  if (overlay) overlay.classList.remove('open');
  if (toggle) { toggle.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
}

/* ═══════════════════════════════════════════════
   USER MENU DROPDOWN
   ═══════════════════════════════════════════════ */
function initUserMenu() {
  const avatar = document.getElementById('user-avatar');
  const dropdown = document.querySelector('.user-dropdown');
  if (!avatar || !dropdown) return;
  avatar.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dropdown.classList.toggle('show');
    avatar.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
      dropdown.classList.remove('show');
      avatar.setAttribute('aria-expanded', 'false');
    }
  });
  dropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      dropdown.classList.remove('show');
      avatar.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ═══════════════════════════════════════════════
   CONSTITUTION PAGE FEATURES
   ═══════════════════════════════════════════════ */
function initConstitutionPage() {
  initConstitutionSearch();
  initConstitutionTOC();
  initConstitutionProgress();
  initCopyLinks();
  initPrintBtn();
  initTOCToggle();
  initConstitutionReveals();
}

function initConstitutionSearch() {
  const input = document.getElementById('const-search');
  const countEl = document.getElementById('search-count');
  if (!input) return;
  input.removeEventListener('input', input._handler);
  input._handler = () => {
    const q = input.value.trim().toLowerCase();
    const sections = document.querySelectorAll('#const-body .const-section');
    const clauses = document.querySelectorAll('#const-body .const-clause');
    const texts = document.querySelectorAll('#const-body .const-text');
    // Clear old highlights
    texts.forEach(t => { t.querySelectorAll('.search-highlight').forEach(h => { h.replaceWith(h.textContent); }); });
    clauses.forEach(c => c.classList.remove('search-hidden'));
    sections.forEach(s => s.classList.remove('search-hidden'));
    if (!q) { if (countEl) countEl.textContent = ''; return; }
    let matches = 0;
    sections.forEach(sec => {
      let sectionHasMatch = false;
      const textEls = sec.querySelectorAll('.const-text');
      textEls.forEach(t => {
        const raw = t.textContent;
        if (raw.toLowerCase().includes(q)) {
          const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          t.innerHTML = raw.replace(regex, '<span class="search-highlight">$1</span>');
          sectionHasMatch = true;
          matches += raw.toLowerCase().split(q).length - 1;
        }
      });
      if (!sectionHasMatch) sec.classList.add('search-hidden');
    });
    if (countEl) countEl.textContent = matches > 0 ? `${matches} match${matches !== 1 ? 'es' : ''}` : 'No matches';
  };
  input.addEventListener('input', input._handler);
}

function initConstitutionTOC() {
  const tocLinks = document.querySelectorAll('.toc-link');
  const sections = document.querySelectorAll('#const-body .const-section');
  if (!tocLinks.length || !sections.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        tocLinks.forEach(l => l.classList.remove('active'));
        const link = document.querySelector(`.toc-link[href="#${entry.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });
  sections.forEach(s => observer.observe(s));
}

function initConstitutionProgress() {
  const bar = document.getElementById('const-progress-bar');
  const body = document.getElementById('const-body');
  if (!bar || !body) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (currentPage !== 'constitution') return;
    if (!ticking) {
      requestAnimationFrame(() => {
        const rect = body.getBoundingClientRect();
        const total = body.offsetHeight - window.innerHeight;
        const scrolled = -rect.top;
        const pct = total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) * 100 : 0;
        bar.style.width = pct + '%';
        ticking = false;
      });
      ticking = true;
    }
  });
}

function initCopyLinks() {
  document.querySelectorAll('.copy-link-btn').forEach(btn => {
    btn.onclick = () => {
      const section = btn.dataset.section;
      const url = `${window.location.origin}${window.location.pathname}#${section}`;
      navigator.clipboard.writeText(url).then(() => {
        btn.textContent = '✓';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = '🔗'; btn.classList.remove('copied'); }, 1500);
      });
    };
  });
}

function initPrintBtn() {
  const btn = document.getElementById('const-print-btn');
  if (btn) btn.addEventListener('click', () => window.print());
}

function initTOCToggle() {
  const btn = document.getElementById('const-toc-toggle');
  const toc = document.getElementById('const-toc');
  if (btn && toc) {
    btn.addEventListener('click', () => toc.classList.toggle('hidden'));
  }
}

/* ═══════════════════════════════════════════════
   COUNCIL PAGE
   ═══════════════════════════════════════════════ */
let councilFilter = 'all';
let councilSearch = '';

function renderCouncil() {
  renderCouncilCards();
  initCouncilFilters();
  initCouncilSearch();
}

function renderCouncilCards() {
  const q = councilSearch.toLowerCase();
  const filtered = MEMBERS.filter(m => {
    if (councilFilter !== 'all' && m.role !== councilFilter) return false;
    if (q && !m.name.toLowerCase().includes(q)) return false;
    return true;
  });

  const archonCards = document.getElementById('archon-cards');
  const councilCards = document.getElementById('council-cards');
  const citizenCards = document.getElementById('citizen-cards');
  const countEl = document.getElementById('council-citizen-count');
  const emptyEl = document.getElementById('council-empty');
  if (!archonCards || !councilCards || !citizenCards) return;

  archonCards.innerHTML = '';
  councilCards.innerHTML = '';
  citizenCards.innerHTML = '';

  filtered.forEach(m => {
    const card = createMemberCard(m);
    if (m.role === 'archon') archonCards.appendChild(card);
    else if (m.role === 'council') councilCards.appendChild(card);
    else citizenCards.appendChild(card);
  });

  const citizenCount = filtered.filter(m => m.role === 'citizen').length;
  if (countEl) countEl.textContent = `(${citizenCount})`;
  if (emptyEl) emptyEl.style.display = filtered.length === 0 ? 'block' : 'none';

  // Show/hide sections based on filter
  const sections = document.querySelectorAll('.council-section');
  sections[0].style.display = (councilFilter === 'all' || councilFilter === 'archon') ? '' : 'none';
  sections[1].style.display = (councilFilter === 'all' || councilFilter === 'council') ? '' : 'none';
  sections[2].style.display = (councilFilter === 'all' || councilFilter === 'citizen') ? '' : 'none';
}

function createMemberCard(m) {
  const card = document.createElement('div');
  card.className = 'member-card' + (m.role === 'archon' ? ' archon-card' : '');
  const initial = getInitial(m.name);
  card.innerHTML = `
    <div class="member-avatar-lg">${initial}</div>
    <div class="member-card-name">${escapeHtml(m.name)}</div>
    <div class="member-card-role">${m.title || capitalize(m.role)}</div>
    ${m.desc ? `<div class="member-card-desc">${escapeHtml(m.desc)}</div>` : ''}
  `;
  return card;
}

function initCouncilFilters() {
  document.querySelectorAll('#council .filter-btn[data-role]').forEach(btn => {
    btn.onclick = () => {
      councilFilter = btn.dataset.role;
      document.querySelectorAll('#council .filter-btn[data-role]').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-checked', b === btn);
      });
      renderCouncilCards();
    };
  });
}

function initCouncilSearch() {
  const input = document.getElementById('member-search');
  if (!input || input._bound) return;
  input._bound = true;
  input.addEventListener('input', () => {
    councilSearch = input.value.trim();
    renderCouncilCards();
  });
}

/* ═══════════════════════════════════════════════
   UPDATES PAGE
   ═══════════════════════════════════════════════ */
let updatesFilter = 'all';

function renderUpdates() {
  renderUpdateTimeline();
  initUpdateFilters();
}

function renderUpdateTimeline() {
  const container = document.getElementById('updates-timeline');
  const emptyEl = document.getElementById('updates-empty');
  if (!container) return;

  const filtered = UPDATES.filter(u => updatesFilter === 'all' || u.category === updatesFilter);
  // Sort: pinned first, then by date
  filtered.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  container.innerHTML = filtered.map(u => `
    <div class="update-item${u.pinned ? ' pinned' : ''}">
      <div class="update-meta">
        <span class="update-date">${escapeHtml(u.date)}</span>
        <span class="update-category">${escapeHtml(u.category)}</span>
        ${u.pinned ? '<span class="update-pin">Pinned</span>' : ''}
      </div>
      <h3 class="update-title">${escapeHtml(u.title)}</h3>
      <p class="update-body">${escapeHtml(u.body)}</p>
    </div>
  `).join('');

  if (emptyEl) emptyEl.style.display = filtered.length === 0 ? 'block' : 'none';
}

function initUpdateFilters() {
  document.querySelectorAll('#updates .filter-btn[data-filter]').forEach(btn => {
    btn.onclick = () => {
      updatesFilter = btn.dataset.filter;
      document.querySelectorAll('#updates .filter-btn[data-filter]').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-checked', b === btn);
      });
      renderUpdateTimeline();
    };
  });
}

/* ═══════════════════════════════════════════════
   ACCOUNT PAGE
   ═══════════════════════════════════════════════ */
function renderAccount() {
  const guest = document.getElementById('account-guest');
  const logged = document.getElementById('account-logged');
  if (!guest || !logged) return;
  const user = auth.currentUser;
  if (user) {
    guest.style.display = 'none';
    logged.style.display = 'block';
    const name = user.displayName || user.email.split('@')[0];
    const initial = getInitial(name);
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('account-avatar', initial);
    setEl('account-name', name);
    setEl('account-email', user.email);
    setEl('detail-name', name);
    setEl('detail-email', user.email);
    setEl('detail-verified', user.emailVerified ? 'Yes' : 'Not yet verified');
    setEl('detail-since', user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : '—');
    // Determine role
    const member = MEMBERS.find(m => m.name.toLowerCase() === name.toLowerCase());
    setEl('account-role', member ? (member.title || capitalize(member.role)) : 'Citizen');
  } else {
    guest.style.display = '';
    logged.style.display = 'none';
  }
}

/* ═══════════════════════════════════════════════
   AUTH — Error mapping
   ═══════════════════════════════════════════════ */
const errorMap = {
  'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/weak-password': 'Password is too weak. Please choose a stronger one.',
  'auth/requires-recent-login': 'Please log out and log back in to perform this action.',
  'auth/invalid-action-code': 'The verification link is invalid or has expired.',
  'auth/expired-action-code': 'The verification link has expired. Please request a new one.',
};
function friendlyError(err) {
  const msg = err?.message ? err.message.replace('Firebase: ', '') : '';
  const match = msg.match(/\(([^)]+)\)/) || msg.match(/^([a-z/-]+)\b/);
  const code = match ? match[1] : '';
  return (code && errorMap[code]) || msg || 'Something went wrong. Please try again.';
}

/* ═══════════════════════════════════════════════
   AUTH — Modals
   ═══════════════════════════════════════════════ */
let mode = 'login';
let pendingSignupData = null;

function resetSubmitBtn(btnId = 'auth-submit-btn', label = 'Login') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.querySelector('.btn-text').textContent = label;
  btn.querySelector('.btn-spinner').style.display = 'none';
  btn.style.opacity = '1';
  btn.style.pointerEvents = 'auto';
}

function showBtnLoading(btnId, text) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.querySelector('.btn-text').textContent = text;
  btn.querySelector('.btn-spinner').style.display = 'inline-block';
  btn.style.opacity = '0.7';
  btn.style.pointerEvents = 'none';
}

window.openAuthModal = function() {
  mode = 'login';
  const title = document.getElementById('auth-modal-title');
  const submitBtn = document.getElementById('auth-submit-btn');
  const username = document.getElementById('auth-username');
  const password = document.getElementById('auth-password');
  const toggleLabel = document.getElementById('auth-toggle-label');
  const toggleLink = document.getElementById('auth-toggle-link');
  const forgotLink = document.getElementById('forgot-password-link');
  if (title) title.textContent = 'Login';
  if (submitBtn) submitBtn.querySelector('.btn-text').textContent = 'Login';
  if (username) username.style.display = 'none';
  if (password) password.style.display = 'block';
  if (toggleLabel) toggleLabel.textContent = "Don't have an account?";
  if (toggleLink) toggleLink.textContent = 'Sign up';
  if (forgotLink) forgotLink.style.display = 'inline-block';
  document.getElementById('auth-error').textContent = '';
  document.getElementById('auth-modal').style.display = 'flex';
  document.getElementById('auth-email')?.focus();
};

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
  // Clear errors
  const err = modal?.querySelector('.auth-error');
  if (err) err.textContent = '';
}

window.closeAuthModal = () => closeModal('auth-modal');
window.closeEmailConfirmModal = () => { closeModal('email-confirm-modal'); pendingSignupData = null; };
window.closePasswordSetupModal = () => closeModal('password-setup-modal');
window.closeChangePasswordModal = () => closeModal('change-password-modal');
window.closeResetPasswordModal = () => closeModal('reset-password-modal');

window.toggleAuthMode = (e) => {
  e.preventDefault();
  mode = mode === 'login' ? 'signup' : 'login';
  document.getElementById('auth-modal-title').textContent = mode === 'login' ? 'Login' : 'Sign Up';
  document.getElementById('auth-submit-btn').querySelector('.btn-text').textContent = mode === 'login' ? 'Login' : 'Sign Up';
  document.getElementById('auth-toggle-label').textContent = mode === 'login' ? "Don't have an account?" : 'Already have an account?';
  document.getElementById('auth-toggle-link').textContent = mode === 'login' ? 'Sign up' : 'Login';
  document.getElementById('auth-username').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('auth-password').style.display = mode === 'login' ? 'block' : 'none';
  document.getElementById('auth-error').textContent = '';
  const forgot = document.getElementById('forgot-password-link');
  if (forgot) forgot.style.display = mode === 'login' ? 'inline-block' : 'none';
};

window.submitAuth = function() {
  const username = document.getElementById('auth-username')?.value.trim();
  const email = document.getElementById('auth-email')?.value.trim();
  const password = document.getElementById('auth-password')?.value;
  const errorBox = document.getElementById('auth-error');
  errorBox.textContent = '';

  if (mode === 'login') {
    if (!email || !password) { errorBox.textContent = 'Please fill in both fields.'; return; }
    showBtnLoading('auth-submit-btn', 'Logging in...');
    signInWithEmailAndPassword(auth, email, password)
      .then(() => { window.closeAuthModal(); })
      .catch(err => { errorBox.textContent = friendlyError(err); resetSubmitBtn(); });
  } else {
    if (!username || !email) { errorBox.textContent = 'Please fill in username and email.'; return; }
    pendingSignupData = { username, email };
    window.closeAuthModal();
    setTimeout(() => {
      document.getElementById('confirm-email-display').innerHTML =
        `<span class="confirm-label">Your email address</span><span class="confirm-email">${escapeHtml(email)}</span>`;
      document.getElementById('confirm-error').textContent = '';
      document.getElementById('email-confirm-modal').style.display = 'flex';
    }, 300);
  }
};

window.confirmEmailYes = function() {
  const errorBox = document.getElementById('confirm-error');
  const btn = document.getElementById('confirm-yes-btn');
  errorBox.textContent = '';
  if (!pendingSignupData) { errorBox.textContent = 'Session expired. Please try again.'; return; }
  showBtnLoading('confirm-yes-btn', 'Sending link...');
  const { email } = pendingSignupData;
  const actionCodeSettings = { url: window.location.origin + window.location.pathname, handleCodeInApp: true };
  sendSignInLinkToEmail(auth, email, actionCodeSettings)
    .then(() => {
      localStorage.setItem('pendingEmailLinkSignup', JSON.stringify(pendingSignupData));
      window.closeEmailConfirmModal();
      // Show success in auth modal
      document.getElementById('auth-modal').style.display = 'flex';
      document.getElementById('auth-modal-title').textContent = 'Sign Up';
      const errBox = document.getElementById('auth-error');
      errBox.style.color = 'var(--success-color)';
      errBox.innerHTML = 'Verification link sent! Check your inbox and click the link to finish.';
      resetSubmitBtn();
      pendingSignupData = null;
    })
    .catch(err => { errorBox.textContent = friendlyError(err); resetSubmitBtn('confirm-yes-btn', '✓ Yes, this is my email'); });
};

/* Password Strength */
function calcStrength(password) {
  let s = 0;
  if (password.length >= 6) s++;
  if (password.length >= 8) s++;
  if (password.length >= 12) s++;
  if (/[a-z]/.test(password)) s++;
  if (/[A-Z]/.test(password)) s++;
  if (/[0-9]/.test(password)) s++;
  if (/[^a-zA-Z0-9]/.test(password)) s++;
  return s;
}
function strengthFeedback(s) {
  if (s <= 2) return { text: 'Weak', color: '#e05a5a' };
  if (s <= 4) return { text: 'Fair', color: '#f0a500' };
  if (s <= 5) return { text: 'Good', color: '#d4af37' };
  return { text: 'Strong', color: '#4caf50' };
}
function updateStrengthBar(barId, textId, password) {
  const bar = document.getElementById(barId);
  const text = document.getElementById(textId);
  if (!bar || !text) return;
  if (!password) { bar.style.width = '0'; text.textContent = 'Password strength'; text.style.color = ''; return; }
  const s = calcStrength(password);
  const f = strengthFeedback(s);
  bar.style.width = Math.min((s / 7) * 100, 100) + '%';
  bar.style.background = f.color;
  text.textContent = f.text;
  text.style.color = f.color;
}
window.checkPasswordStrength = () => updateStrengthBar('new-strength-bar', 'new-strength-text', document.getElementById('new-password')?.value);
window.checkChangePasswordStrength = () => updateStrengthBar('change-strength-bar', 'change-strength-text', document.getElementById('change-new-password')?.value);

/* Password Setup */
window.openPasswordSetupModal = () => { document.getElementById('password-setup-modal').style.display = 'flex'; };
window.submitPasswordSetup = function() {
  const newP = document.getElementById('new-password')?.value;
  const confirmP = document.getElementById('confirm-password')?.value;
  const errorBox = document.getElementById('setup-error');
  errorBox.textContent = '';
  if (!newP || !confirmP) { errorBox.textContent = 'Please fill in both fields.'; return; }
  if (newP.length < 6) { errorBox.textContent = 'Password must be at least 6 characters.'; return; }
  if (newP !== confirmP) { errorBox.textContent = 'Passwords do not match.'; return; }
  if (!auth.currentUser) { errorBox.textContent = 'Session expired. Please sign up again.'; return; }
  showBtnLoading('setup-submit-btn', 'Setting Password...');
  updatePassword(auth.currentUser, newP)
    .then(() => { window.closePasswordSetupModal(); })
    .catch(err => { errorBox.textContent = friendlyError(err); resetSubmitBtn('setup-submit-btn', 'Create Account'); });
};

/* Change Password */
window.openChangePasswordModal = function() {
  ['change-old-password', 'change-new-password', 'change-confirm-password'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['change-password-error', 'change-password-success'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = '';
  });
  document.getElementById('change-strength-bar').style.width = '0';
  document.getElementById('change-strength-text').textContent = 'Password strength';
  document.getElementById('change-password-modal').style.display = 'flex';
};
window.openChangePasswordResetModal = function() {
  document.getElementById('change-password-modal').style.display = 'none';
  document.getElementById('reset-password-modal').style.display = 'flex';
};
window.submitChangePassword = function() {
  const oldP = document.getElementById('change-old-password')?.value;
  const newP = document.getElementById('change-new-password')?.value;
  const confirmP = document.getElementById('change-confirm-password')?.value;
  const errorBox = document.getElementById('change-password-error');
  const successBox = document.getElementById('change-password-success');
  errorBox.textContent = ''; successBox.textContent = '';
  if (!oldP) { errorBox.textContent = 'Please enter your current password.'; return; }
  if (!newP || !confirmP) { errorBox.textContent = 'Please fill in both new password fields.'; return; }
  if (newP.length < 6) { errorBox.textContent = 'Password must be at least 6 characters.'; return; }
  if (newP !== confirmP) { errorBox.textContent = 'Passwords do not match.'; return; }
  const user = auth.currentUser;
  if (!user) { errorBox.textContent = 'No user signed in.'; return; }
  showBtnLoading('change-password-submit-btn', 'Verifying...');
  const credential = EmailAuthProvider.credential(user.email, oldP);
  reauthenticateWithCredential(user, credential)
    .then(() => { showBtnLoading('change-password-submit-btn', 'Updating...'); return updatePassword(user, newP); })
    .then(() => {
      successBox.textContent = 'Password updated successfully!';
      resetSubmitBtn('change-password-submit-btn', 'Update Password');
      ['change-old-password', 'change-new-password', 'change-confirm-password'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
    })
    .catch(err => { errorBox.textContent = friendlyError(err); resetSubmitBtn('change-password-submit-btn', 'Update Password'); });
};

/* Reset Password */
window.openResetPasswordModal = function() {
  document.getElementById('auth-modal').style.display = 'none';
  document.getElementById('reset-email').value = '';
  document.getElementById('reset-error').textContent = '';
  document.getElementById('reset-success').textContent = '';
  document.getElementById('reset-password-modal').style.display = 'flex';
};
window.submitResetPassword = function() {
  const email = document.getElementById('reset-email')?.value.trim();
  const errorBox = document.getElementById('reset-error');
  const successBox = document.getElementById('reset-success');
  errorBox.textContent = ''; successBox.textContent = '';
  if (!email) { errorBox.textContent = 'Please enter your email address.'; return; }
  showBtnLoading('reset-submit-btn', 'Sending...');
  sendPasswordResetEmail(auth, email)
    .then(() => { successBox.textContent = 'Password reset email sent! Check your inbox.'; resetSubmitBtn('reset-submit-btn', 'Send Reset Link'); })
    .catch(err => { errorBox.textContent = friendlyError(err); resetSubmitBtn('reset-submit-btn', 'Send Reset Link'); });
};

window.logout = function() { signOut(auth); };

/* ═══════════════════════════════════════════════
   EMAIL LINK SIGN-IN COMPLETION
   ═══════════════════════════════════════════════ */
function completeEmailLinkSignIn() {
  if (!isSignInWithEmailLink(auth, window.location.href)) return;
  const pending = JSON.parse(localStorage.getItem('pendingEmailLinkSignup') || 'null');
  let email = pending?.email;
  if (!email) { email = window.prompt('Please confirm your email to finish signing up:'); }
  if (!email) return;
  signInWithEmailLink(auth, email, window.location.href)
    .then((cred) => {
      window.history.replaceState({}, document.title, window.location.pathname);
      const username = pending?.email === email ? pending?.username : (window.prompt('Choose a username:') || email.split('@')[0]);
      return updateProfile(cred.user, { displayName: username }).then(() => username);
    })
    .then((username) => {
      localStorage.removeItem('pendingEmailLinkSignup');
      openPasswordSetupModal();
    })
    .catch(err => { console.error('Email link sign-in failed:', err); localStorage.removeItem('pendingEmailLinkSignup'); });
}
completeEmailLinkSignIn();

/* ═══════════════════════════════════════════════
   AUTH STATE
   ═══════════════════════════════════════════════ */
onAuthStateChanged(auth, (user) => {
  const loginBtn = document.getElementById('login-btn');
  const userMenu = document.getElementById('user-menu');
  if (user) {
    user.reload().catch(() => {}).then(() => {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userMenu) userMenu.style.display = 'block';
      const name = user.displayName || user.email.split('@')[0];
      const initial = getInitial(name);
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('user-avatar', initial);
      set('dropdown-avatar', initial);
      set('dropdown-name', name);
      set('dropdown-email', user.email);
      // Update account page if visible
      if (currentPage === 'account') renderAccount();
    });
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (userMenu) userMenu.style.display = 'none';
    if (currentPage === 'account') renderAccount();
  }
});

/* ═══════════════════════════════════════════════
   ESC KEY CLOSES MODALS
   ═══════════════════════════════════════════════ */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  // Close mobile menu first
  const overlay = document.getElementById('mobile-nav-overlay');
  if (overlay?.classList.contains('open')) { closeMobileMenu(); return; }
  // Close modals
  const modals = ['auth-modal', 'email-confirm-modal', 'password-setup-modal', 'reset-password-modal', 'change-password-modal'];
  for (const id of modals) {
    const m = document.getElementById(id);
    if (m && m.style.display === 'flex') {
      e.preventDefault();
      closeModal(id);
      if (id === 'email-confirm-modal') pendingSignupData = null;
      break;
    }
  }
});

/* ═══════════════════════════════════════════════
   CUSTOM CURSOR — THEME MATCHED
   ═══════════════════════════════════════════════ */
function initCursorTrail() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.body.classList.add('has-custom-cursor');

  const mainDot = document.createElement('div');
  mainDot.className = 'cursor-main';
  document.body.appendChild(mainDot);

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(ring);

  let mouseX = 0, mouseY = 0;
  let mainX = 0, mainY = 0;
  let ringX = 0, ringY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, .constitution-btn, .nav-link, .member-card, .announcement-card, .stat-card, input, [role="button"]')) {
      mainDot.classList.add('hovering');
      ring.classList.add('hovering');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, .constitution-btn, .nav-link, .member-card, .announcement-card, .stat-card, input, [role="button"]')) {
      mainDot.classList.remove('hovering');
      ring.classList.remove('hovering');
    }
  });

  function animate() {
    mainDot.style.left = mouseX + 'px';
    mainDot.style.top = mouseY + 'px';
    ring.style.left = mouseX + 'px';
    ring.style.top = mouseY + 'px';

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}


/* ═══════════════════════════════════════════════
   MAGNETIC BUTTONS
   ═══════════════════════════════════════════════ */
function initMagneticButtons() {
  document.querySelectorAll('.constitution-btn, .hero-btn, .nav-link, #login-btn').forEach(btn => {
    btn.classList.add('magnetic-btn');
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ═══════════════════════════════════════════════
   SCROLL-TRIGGERED REVEALS
   ═══════════════════════════════════════════════ */
function initScrollReveals() {
  // Add reveal classes to elements
  document.querySelectorAll('.leadership-container, .constitution-btn').forEach(el => {
    el.classList.add('reveal-up');
  });
  document.querySelectorAll('.announcement-card').forEach((el, i) => {
    el.classList.add('reveal-scale');
    el.style.transitionDelay = (i * 0.1) + 's';
  });
  document.querySelectorAll('.stat-card').forEach((el, i) => {
    el.classList.add('reveal-up');
    el.style.transitionDelay = (i * 0.1) + 's';
  });
  document.querySelectorAll('.hierarchy-tier').forEach((el, i) => {
    el.classList.add(i % 2 === 0 ? 'reveal-left' : 'reveal-right');
  });
  document.querySelectorAll('.member-card').forEach((el, i) => {
    el.classList.add('reveal-scale');
    el.style.transitionDelay = (i * 0.05) + 's';
  });
  document.querySelectorAll('.update-item').forEach((el, i) => {
    el.classList.add('reveal-left');
    el.style.transitionDelay = (i * 0.08) + 's';
  });
  document.querySelectorAll('.account-card, .account-details, .account-actions').forEach(el => {
    el.classList.add('reveal-up');
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    observer.observe(el);
  });
}

/* ═══════════════════════════════════════════════
   CONSTITUTION SECTION REVEALS
   ═══════════════════════════════════════════════ */
function initConstitutionReveals() {
  const sections = document.querySelectorAll('#const-body .const-section');
  if (!sections.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible', 'in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  sections.forEach(s => {
    s.classList.add('reveal-section');
    observer.observe(s);
  });
}

/* ═══════════════════════════════════════════════
   COUNTER ANIMATION
   ═══════════════════════════════════════════════ */
function animateCounter(el, target, duration = 1500) {
  const start = 0;
  const startTime = performance.now();
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
function initCounterAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent.trim();
        const num = parseInt(text);
        if (!isNaN(num)) animateCounter(el, num);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-number').forEach(el => observer.observe(el));
}

/* ═══════════════════════════════════════════════
   TILT EFFECT ON CARDS
   ═══════════════════════════════════════════════ */
function initTiltEffect() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.announcement-card, .stat-card, .member-card').forEach(card => {
    card.classList.add('tilt-card');
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (y - 0.5) * -8;
      const rotateY = (x - 0.5) * 8;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ═══════════════════════════════════════════════
   RING PULSE ON BUTTONS
   ═══════════════════════════════════════════════ */
function initRingPulse() {
  document.querySelectorAll('.constitution-btn, .hero-btn').forEach(btn => {
    btn.classList.add('ring-pulse');
    btn.addEventListener('click', () => {
      btn.classList.remove('pulsing');
      void btn.offsetWidth; // reflow
      btn.classList.add('pulsing');
      setTimeout(() => btn.classList.remove('pulsing'), 600);
    });
  });
}

/* ═══════════════════════════════════════════════
   PARALLAX ON SCROLL
   ═══════════════════════════════════════════════ */
function initParallax() {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const particles = document.getElementById('particles');
        if (particles) particles.style.transform = `translateY(${scrollY * 0.3}px)`;
        const logo = document.querySelector('.logo');
        if (logo) logo.style.transform = `translateY(${Math.sin(scrollY * 0.01) * 2}px)`;
        ticking = false;
      });
      ticking = true;
    }
  });
}



/* ═══════════════════════════════════════════════
   GLITCH TEXT ON HOVER
   ═══════════════════════════════════════════════ */
function initGlitchText() {
  const title = document.querySelector('.arkenfold-con');
  if (!title) return;
  title.setAttribute('data-text', title.textContent);
  title.classList.add('glitch-text');
  // Glitch triggers on hover
  title.addEventListener('mouseenter', () => {
    title.style.animation = 'none';
    void title.offsetWidth;
    title.style.animation = '';
  });
}

/* ═══════════════════════════════════════════════
   ENHANCED MODAL TRANSITIONS
   ═══════════════════════════════════════════════ */
const origCloseModal = closeModal;
closeModal = function(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  const box = modal.querySelector('.modal-box');
  if (box) {
    box.style.animation = 'none';
    box.style.transition = 'all 0.25s ease';
    box.style.opacity = '0';
    box.style.transform = 'scale(0.95) translateY(10px)';
    setTimeout(() => {
      modal.style.display = 'none';
      box.style.animation = '';
      box.style.transition = '';
      box.style.opacity = '';
      box.style.transform = '';
      const err = modal.querySelector('.auth-error');
      if (err) err.textContent = '';
    }, 250);
  } else {
    modal.style.display = 'none';
  }
};

/* ═══════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════ */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function getInitial(name) {
  for (let i = 0; i < name.length; i++) {
    if (/[a-zA-Z]/.test(name[i])) return name[i].toUpperCase();
  }
  return '?';
}

// Footer year
const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ═══════════════════════════════════════════════
   NAV LINK CLICKS
   ═══════════════════════════════════════════════ */
document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(link.dataset.page);
  });
});


/* ═══════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initSplash();
  createParticles();
  initHeaderScroll();
  initScrollProgress();
  initBackToTop();
  initMobileMenu();
  initUserMenu();
  handleHash();

  // Animation systems
  initCursorTrail();
  initMagneticButtons();
  initScrollReveals();
  initTiltEffect();
  initRingPulse();
  initParallax();
  initGlitchText();
  initCounterAnimations();
});
