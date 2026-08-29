// DOMINION OF ARKENFOLD — COMMUNITY PORTAL SCRIPT
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, updateProfile,
  updatePassword, onAuthStateChanged, sendPasswordResetEmail,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
  reauthenticateWithCredential, EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDoc, getDocs, onSnapshot, query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

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
const db = getFirestore(app);

/* ═══════════════════════════════════════════════
   DATA — Members & Updates now live in Firestore.
   These arrays are populated in real time by
   initFirestoreListeners() below, and re-render
   the Council/Updates pages whenever they change —
   including instantly when an admin edits something.
   ═══════════════════════════════════════════════ */
let MEMBERS = [];
let UPDATES = [];

// One-time import data — only used by the admin panel's
// "Import existing roster" button, which only appears
// when the members collection in Firestore is still empty.
// This is what your original hardcoded list looked like.
const DEFAULT_SEED_MEMBERS = [
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

const DEFAULT_SEED_UPDATES = [
  { title: "Constitution Ratified", body: "The foundational Constitution of the Dominion has been formally ratified and enacted by the Supreme Archon. All nine articles are now in effect.", category: "governance", pinned: true },
  { title: "Council Formed", body: "The High Command Council has been established. Two founding members have been appointed to advise and assist the Supreme Archon.", category: "governance", pinned: false },
  { title: "Arkenfold Opens", body: "The Dominion of Arkenfold officially opens its doors to citizens. All loyal subjects are welcome to join the ranks.", category: "community", pinned: false },
  { title: "Community Portal Launched", body: "The official website and community portal of the Dominion is now live. Citizens can explore the Constitution, meet the Council, and stay updated.", category: "community", pinned: false },
  { title: "Founding Era Declared", body: "The Supreme Archon has declared the beginning of the Founding Era — the first chapter in the history of the Dominion of Arkenfold.", category: "general", pinned: false }
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
const PAGES = ['home', 'constitution', 'council', 'updates', 'account', 'admin'];
let currentPage = 'home';
let isAdminUser = false;

// Applications / notifications state
let myApplication = null;          // the current user's own application doc (or null)
let pendingApplications = [];      // admin-only: all pending applications
let resolvedApplications = [];     // admin-only: approved/declined applications
let myNotifications = [];          // current user's own notifications
let unsubMyApplication = null;
let unsubAllApplications = null;
let unsubMyNotifications = null;

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
  if (page === 'admin') renderAdminPage();
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
    <div class="member-card-role">${m.title ? escapeHtml(m.title) : capitalize(m.role)}</div>
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
   FIRESTORE — LIVE DATA LISTENERS
   Keeps MEMBERS/UPDATES in sync with Firestore in
   real time. Any admin edit shows up for everyone
   viewing the site within moments, no refresh needed.
   ═══════════════════════════════════════════════ */
function initFirestoreListeners() {
  onSnapshot(query(collection(db, 'members'), orderBy('name')), (snap) => {
    MEMBERS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (currentPage === 'council') renderCouncilCards();
    if (currentPage === 'account') renderAccount();
    if (currentPage === 'admin') { renderAdminMembersList(); updateAdminStats(); }
  }, (err) => {
    console.error('Members listener failed:', err);
  });

  onSnapshot(query(collection(db, 'updates'), orderBy('createdAt', 'desc')), (snap) => {
    UPDATES = snap.docs.map(d => {
      const data = d.data();
      const ts = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      return { id: d.id, ...data, date: ts.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) };
    });
    if (currentPage === 'updates') renderUpdateTimeline();
    if (currentPage === 'admin') { renderAdminUpdatesList(); updateAdminStats(); }
  }, (err) => {
    console.error('Updates listener failed:', err);
  });
}

/* ═══════════════════════════════════════════════
   MEMBERSHIP APPLICATIONS
   One application document per user, keyed by their
   UID (applications/{uid}) — this naturally prevents
   duplicate applications and makes "my application"
   a single direct lookup instead of a query.

   Username uniqueness is enforced by Firestore itself,
   not just client-side: reserving a name means creating
   usernames/{lowercasedName}, and the security rules only
   allow *creating* that document, never overwriting an
   existing one — so two people can't grab the same name
   even if they submit at the same moment.
   ═══════════════════════════════════════════════ */
function usernameKey(str) {
  return (str || '').trim().toLowerCase();
}

function nameTakenByExistingMember(name) {
  const key = usernameKey(name);
  return MEMBERS.some(m => usernameKey(m.name) === key);
}

window.openJoinModal = function() {
  const user = auth.currentUser;
  if (!user) { openAuthModal(); return; }

  document.getElementById('join-modal').style.display = 'flex';
  const formEl = document.getElementById('join-state-form');
  const pendingEl = document.getElementById('join-state-pending');
  const approvedEl = document.getElementById('join-state-approved');
  const declinedEl = document.getElementById('join-state-declined');
  [formEl, pendingEl, approvedEl, declinedEl].forEach(el => el.style.display = 'none');

  if (myApplication && myApplication.status === 'pending') {
    pendingEl.style.display = 'block';
  } else if (myApplication && myApplication.status === 'approved') {
    document.getElementById('join-approved-detail').textContent =
      `You hold the role of ${capitalize(myApplication.resolvedRole || 'citizen')}.`;
    approvedEl.style.display = 'block';
  } else if (myApplication && myApplication.status === 'declined') {
    document.getElementById('join-declined-reason').textContent =
      'Reason: ' + (myApplication.declineReason || '—');
    declinedEl.style.display = 'block';
  } else {
    document.getElementById('join-name').value = user.displayName || '';
    document.getElementById('join-message').value = '';
    document.getElementById('join-error').textContent = '';
    formEl.style.display = 'block';
  }
};

window.closeJoinModal = function() {
  document.getElementById('join-modal').style.display = 'none';
};

window.resetJoinApplication = function() {
  document.getElementById('join-state-declined').style.display = 'none';
  document.getElementById('join-name').value = auth.currentUser?.displayName || '';
  document.getElementById('join-message').value = '';
  document.getElementById('join-error').textContent = '';
  document.getElementById('join-state-form').style.display = 'block';
};

window.submitJoinApplication = function() {
  const user = auth.currentUser;
  if (!user) return;
  const nameEl = document.getElementById('join-name');
  const messageEl = document.getElementById('join-message');
  const errorEl = document.getElementById('join-error');
  const btn = document.getElementById('join-submit-btn');
  const name = nameEl.value.trim();

  if (!name) { errorEl.textContent = 'Please enter your in-game username.'; return; }
  if (nameTakenByExistingMember(name)) {
    errorEl.textContent = 'That username is already used by an existing member.';
    return;
  }
  errorEl.textContent = '';
  btn.querySelector('.btn-text').textContent = 'Submitting...';
  btn.querySelector('.btn-spinner').style.display = 'inline-block';
  btn.style.pointerEvents = 'none';

  const key = usernameKey(name);
  const previousKey = myApplication ? usernameKey(myApplication.name) : null;

  // Reserve the username first — this is the step Firestore actually
  // enforces uniqueness on. If someone else grabbed this exact name a
  // moment ago, this fails and nothing else happens.
  const reserve = (previousKey && previousKey === key)
    ? Promise.resolve() // re-applying with the same name — already reserved
    : setDoc(doc(db, 'usernames', key), { uid: user.uid, status: 'pending' });

  reserve
    .then(() => {
      // If they changed their desired name on a re-application, free the old one
      const cleanup = (previousKey && previousKey !== key)
        ? deleteDoc(doc(db, 'usernames', previousKey)).catch(() => {})
        : Promise.resolve();
      return cleanup;
    })
    .then(() => setDoc(doc(db, 'applications', user.uid), {
      uid: user.uid,
      email: user.email,
      name,
      message: messageEl.value.trim(),
      status: 'pending',
      declineReason: null,
      resolvedRole: null,
      createdAt: serverTimestamp()
    }))
    .then(() => {
      closeJoinModal();
    })
    .catch(err => {
      errorEl.textContent = err.code === 'permission-denied'
        ? 'That username was just taken — please choose another.'
        : err.message;
    })
    .finally(() => {
      btn.querySelector('.btn-text').textContent = 'Submit Application';
      btn.querySelector('.btn-spinner').style.display = 'none';
      btn.style.pointerEvents = 'auto';
    });
};

/* ═══════════════════════════════════════════════
   NOTIFICATIONS
   ═══════════════════════════════════════════════ */
window.toggleNotifDropdown = function() {
  const dropdown = document.getElementById('notif-dropdown');
  const opening = dropdown.style.display === 'none';
  dropdown.style.display = opening ? 'block' : 'none';

  if (isAdminUser) {
    // For admins the bell is a direct shortcut to the Applicants tab,
    // not a dropdown of their own notifications.
    dropdown.style.display = 'none';
    navigateTo('admin');
    setTimeout(() => {
      const tabBtn = document.querySelector('.admin-tab-btn[data-tab="applicants"]');
      if (tabBtn) tabBtn.click();
    }, 50);
    return;
  }

  if (opening) renderNotifDropdown();
};

function renderNotifDropdown() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  if (myNotifications.length === 0) {
    list.innerHTML = '<p class="admin-empty">No notifications yet.</p>';
    return;
  }
  list.innerHTML = myNotifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
      <span class="notif-item-icon">${n.type === 'approved' ? '✦' : '✕'}</span>
      <span class="notif-item-text">${escapeHtml(n.message)}</span>
    </div>
  `).join('');

  // Mark all as read once opened
  myNotifications.filter(n => !n.read).forEach(n => {
    updateDoc(doc(db, 'notifications', n.id), { read: true }).catch(() => {});
  });
}

function updateNotifBadge() {
  const wrap = document.getElementById('notif-bell-wrap');
  const badge = document.getElementById('notif-badge');
  if (!wrap || !badge) return;
  const count = isAdminUser ? pendingApplications.length : myNotifications.filter(n => !n.read).length;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

/* ═══════════════════════════════════════════════
   ADMIN PANEL
   ═══════════════════════════════════════════════ */
const ADMIN_PASS_HASH = 'dd2882509f0f18099407b3cb8bdeca3befff329963e6e758fd48336df0db3c6c';
let adminPasswordVerified = false;

async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

window.verifyAdminPassword = async function() {
  const input = document.getElementById('admin-password-input');
  const errorEl = document.getElementById('admin-password-error');
  if (!input || !errorEl) return;
  const entered = input.value;
  if (!entered) { errorEl.textContent = 'Please enter the passphrase.'; return; }
  errorEl.textContent = '';
  const hash = await hashString(entered);
  if (hash === ADMIN_PASS_HASH) {
    adminPasswordVerified = true;
    sessionStorage.setItem('arkenfold-admin-ok', '1');
    document.getElementById('admin-password-gate').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    renderAdminMembersList();
    renderAdminUpdatesList();
    renderAdminApplicantsList();
    updateAdminStats();
    initAdminTabs();
  } else {
    errorEl.textContent = 'Incorrect passphrase. Access denied.';
    input.value = '';
    input.focus();
  }
};

function renderAdminPage() {
  const gate = document.getElementById('admin-gate');
  const panel = document.getElementById('admin-panel');
  const pwGate = document.getElementById('admin-password-gate');
  if (!gate || !panel) return;

  if (!auth.currentUser) {
    gate.style.display = 'block';
    gate.textContent = 'Please log in to access the Admin Panel.';
    panel.style.display = 'none';
    if (pwGate) pwGate.style.display = 'none';
    return;
  }
  if (!isAdminUser) {
    gate.style.display = 'block';
    gate.textContent = 'Your account does not have Admin Panel access.';
    panel.style.display = 'none';
    if (pwGate) pwGate.style.display = 'none';
    return;
  }

  gate.style.display = 'none';

  // Check if password was already verified this session
  if (adminPasswordVerified || sessionStorage.getItem('arkenfold-admin-ok') === '1') {
    adminPasswordVerified = true;
    if (pwGate) pwGate.style.display = 'none';
    panel.style.display = 'block';

    const seedBtn = document.getElementById('admin-seed-btn');
    if (seedBtn) seedBtn.style.display = MEMBERS.length === 0 && UPDATES.length === 0 ? 'inline-block' : 'none';

    renderAdminMembersList();
    renderAdminUpdatesList();
    renderAdminApplicantsList();
    updateAdminStats();
    initAdminTabs();
  } else {
    panel.style.display = 'none';
    if (pwGate) {
      pwGate.style.display = 'flex';
      const pwInput = document.getElementById('admin-password-input');
      if (pwInput) {
        pwInput.focus();
        pwInput.onkeydown = (e) => { if (e.key === 'Enter') verifyAdminPassword(); };
        pwInput.oninput = () => { const err = document.getElementById('admin-password-error'); if (err) err.textContent = ''; };
      }
    }
  }
}

function updateAdminStats() {
  const membersEl = document.getElementById('admin-stat-members');
  const updatesEl = document.getElementById('admin-stat-updates');
  const rolesEl = document.getElementById('admin-stat-roles');
  if (membersEl) membersEl.textContent = MEMBERS.length || '0';
  if (updatesEl) updatesEl.textContent = UPDATES.length || '0';
  if (rolesEl) rolesEl.textContent = MEMBERS.filter(m => m.role === 'council' || m.role === 'archon').length || '0';
}

function initAdminTabs() {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.toggle('active', p.id === 'admin-tab-' + btn.dataset.tab));
    };
  });
}

function renderAdminMembersList() {
  const list = document.getElementById('admin-members-list');
  if (!list) return;
  const roleOrder = { archon: 0, council: 1, citizen: 2 };
  const sorted = [...MEMBERS].sort((a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3) || a.name.localeCompare(b.name));

  list.innerHTML = sorted.map(m => `
    <div class="admin-row" data-id="${m.id}">
      <div class="admin-row-view">
        <div class="admin-row-main">
          <span class="admin-row-name">${escapeHtml(m.name)}</span>
          <span class="admin-row-role-badge role-${m.role}">${capitalize(m.role)}</span>
          ${m.title ? `<span class="admin-row-pin">${escapeHtml(m.title)}</span>` : ''}
        </div>
        <div class="admin-row-actions">
          <select class="admin-role-select" data-id="${m.id}">
            <option value="citizen"${m.role === 'citizen' ? ' selected' : ''}>Citizen</option>
            <option value="council"${m.role === 'council' ? ' selected' : ''}>Council</option>
            <option value="archon"${m.role === 'archon' ? ' selected' : ''}>Archon</option>
          </select>
          <button class="admin-btn-small" data-action="edit-member" data-id="${m.id}">Edit</button>
          <button class="admin-btn-small admin-btn-delete" data-id="${m.id}" data-action="delete-member">Delete</button>
        </div>
      </div>
      <div class="admin-row-edit" id="edit-member-${m.id}" style="display:none;">
        <div class="admin-form-grid">
          <div class="admin-field">
            <label class="admin-field-label">Username</label>
            <input type="text" class="edit-member-name" value="${escapeHtml(m.name)}" />
          </div>
          <div class="admin-field">
            <label class="admin-field-label">Title</label>
            <input type="text" class="edit-member-title" value="${escapeHtml(m.title || '')}" />
          </div>
        </div>
        <div class="admin-field">
          <label class="admin-field-label">Description</label>
          <textarea class="edit-member-desc" rows="2">${escapeHtml(m.desc || '')}</textarea>
        </div>
        <div class="admin-row-actions">
          <button class="admin-btn-small" data-action="save-member" data-id="${m.id}">Save</button>
          <button class="admin-btn-small" data-action="cancel-edit-member" data-id="${m.id}">Cancel</button>
        </div>
      </div>
    </div>
  `).join('') || '<p class="admin-empty">No members yet. Use "Import existing roster" or add one below.</p>';

  list.querySelectorAll('.admin-role-select').forEach(sel => {
    sel.addEventListener('change', () => adminUpdateMemberRole(sel.dataset.id, sel.value));
  });
  list.querySelectorAll('[data-action="delete-member"]').forEach(btn => {
    btn.addEventListener('click', () => adminDeleteMember(btn.dataset.id, btn.closest('.admin-row').querySelector('.admin-row-name').textContent));
  });
  list.querySelectorAll('[data-action="edit-member"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('edit-member-' + btn.dataset.id).style.display = 'block';
      btn.closest('.admin-row').querySelector('.admin-row-view').style.display = 'none';
    });
  });
  list.querySelectorAll('[data-action="cancel-edit-member"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('edit-member-' + btn.dataset.id).style.display = 'none';
      btn.closest('.admin-row').querySelector('.admin-row-view').style.display = 'flex';
    });
  });
  list.querySelectorAll('[data-action="save-member"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.admin-row');
      const newName = row.querySelector('.edit-member-name').value.trim();
      const newTitle = row.querySelector('.edit-member-title').value.trim();
      const newDesc = row.querySelector('.edit-member-desc').value.trim();
      if (!newName) return;
      updateDoc(doc(db, 'members', btn.dataset.id), { name: newName, title: newTitle, desc: newDesc })
        .catch(err => console.error('Failed to save member:', err));
    });
  });
}

function renderAdminUpdatesList() {
  const list = document.getElementById('admin-updates-list');
  if (!list) return;

  list.innerHTML = UPDATES.map(u => `
    <div class="admin-row admin-row-update" data-id="${u.id}">
      <div class="admin-row-main">
        <span class="admin-row-name">${escapeHtml(u.title)}</span>
        <span class="admin-row-role-badge role-${u.category}">${escapeHtml(u.category)}</span>
        ${u.pinned ? '<span class="admin-row-pin">📌 Pinned</span>' : ''}
      </div>
      <div class="admin-row-actions">
        <button class="admin-btn-small" data-action="toggle-pin" data-id="${u.id}" data-pinned="${u.pinned}">${u.pinned ? 'Unpin' : 'Pin'}</button>
        <button class="admin-btn-small admin-btn-delete" data-action="delete-update" data-id="${u.id}">Delete</button>
      </div>
    </div>
  `).join('') || '<p class="admin-empty">No updates yet. Use "Import existing roster" or add one below.</p>';

  list.querySelectorAll('[data-action="toggle-pin"]').forEach(btn => {
    btn.addEventListener('click', () => adminTogglePinned(btn.dataset.id, btn.dataset.pinned === 'true'));
  });
  list.querySelectorAll('[data-action="delete-update"]').forEach(btn => {
    btn.addEventListener('click', () => adminDeleteUpdate(btn.dataset.id));
  });
}

window.adminAddMember = function() {
  const nameEl = document.getElementById('admin-new-member-name');
  const roleEl = document.getElementById('admin-new-member-role');
  const titleEl = document.getElementById('admin-new-member-title');
  const descEl = document.getElementById('admin-new-member-desc');
  const errorEl = document.getElementById('admin-member-error');
  const name = nameEl.value.trim();
  if (!name) { errorEl.textContent = 'Please enter a name.'; return; }
  if (nameTakenByExistingMember(name)) {
    errorEl.textContent = 'That name is already used by an existing member.';
    return;
  }
  errorEl.textContent = '';

  setDoc(doc(db, 'usernames', usernameKey(name)), { uid: null, status: 'approved' })
    .then(() => addDoc(collection(db, 'members'), {
      name,
      role: roleEl.value,
      title: titleEl.value.trim(),
      desc: descEl.value.trim()
    }))
    .then(() => {
      nameEl.value = ''; titleEl.value = ''; descEl.value = ''; roleEl.value = 'citizen';
    })
    .catch(err => {
      errorEl.textContent = err.code === 'permission-denied'
        ? 'That username is already reserved.'
        : err.message;
    });
};

function adminUpdateMemberRole(id, role) {
  updateDoc(doc(db, 'members', id), { role }).catch(err => console.error('Failed to update role:', err));
}

function adminDeleteMember(id, name) {
  if (!confirm(`Remove ${name} from the roster?`)) return;
  deleteDoc(doc(db, 'members', id)).catch(err => console.error('Failed to delete member:', err));
}

window.adminAddUpdate = function() {
  const titleEl = document.getElementById('admin-new-update-title');
  const bodyEl = document.getElementById('admin-new-update-body');
  const catEl = document.getElementById('admin-new-update-category');
  const pinEl = document.getElementById('admin-new-update-pinned');
  const errorEl = document.getElementById('admin-update-error');
  const title = titleEl.value.trim();
  const body = bodyEl.value.trim();
  if (!title || !body) { errorEl.textContent = 'Please fill in both title and body.'; return; }
  errorEl.textContent = '';

  addDoc(collection(db, 'updates'), {
    title, body,
    category: catEl.value,
    pinned: pinEl.checked,
    createdAt: serverTimestamp()
  }).then(() => {
    titleEl.value = ''; bodyEl.value = ''; catEl.value = 'general'; pinEl.checked = false;
  }).catch(err => { errorEl.textContent = err.message; });
};

function adminTogglePinned(id, current) {
  updateDoc(doc(db, 'updates', id), { pinned: !current }).catch(err => console.error('Failed to toggle pin:', err));
}

function adminDeleteUpdate(id) {
  if (!confirm('Delete this update?')) return;
  deleteDoc(doc(db, 'updates', id)).catch(err => console.error('Failed to delete update:', err));
}

/* ── Applicants ── */
function renderAdminApplicantsList() {
  const pendingList = document.getElementById('admin-applicants-list');
  const resolvedList = document.getElementById('admin-applicants-resolved-list');
  const badge = document.getElementById('admin-applicants-badge');
  if (badge) {
    badge.textContent = pendingApplications.length;
    badge.style.display = pendingApplications.length > 0 ? 'inline-flex' : 'none';
  }
  if (!pendingList || !resolvedList) return;

  pendingList.innerHTML = pendingApplications.map(a => `
    <div class="admin-row admin-applicant-row" data-id="${a.uid}">
      <div class="admin-applicant-body">
        <div class="admin-applicant-meta">
          <span class="admin-row-name">${escapeHtml(a.email)}</span>
          ${a.message ? `<p class="admin-applicant-message">"${escapeHtml(a.message)}"</p>` : ''}
        </div>
        <div class="admin-form-grid">
          <div class="admin-field">
            <label class="admin-field-label">In-Game Username</label>
            <input type="text" class="admin-applicant-name" data-uid="${a.uid}" value="${escapeHtml(a.name)}" />
          </div>
          <div class="admin-field">
            <label class="admin-field-label">Role</label>
            <select class="admin-applicant-role" data-uid="${a.uid}">
              <option value="citizen" selected>Citizen</option>
              <option value="council">Council</option>
              <option value="archon">Archon</option>
            </select>
          </div>
        </div>
        <div class="admin-field">
          <label class="admin-field-label">Title <span class="admin-optional">(optional)</span></label>
          <input type="text" class="admin-applicant-title" data-uid="${a.uid}" placeholder="e.g. Grand Marshal" />
        </div>
        <div class="admin-field admin-applicant-decline-field" id="decline-field-${a.uid}" style="display:none;">
          <label class="admin-field-label">Reason for declining <span class="admin-optional">(required)</span></label>
          <textarea class="admin-applicant-decline-reason" data-uid="${a.uid}" rows="2" placeholder="Let them know why..."></textarea>
        </div>
        <div class="admin-applicant-error" id="applicant-error-${a.uid}"></div>
        <div class="admin-row-actions">
          <button class="admin-submit-btn" data-action="approve" data-uid="${a.uid}">✓ Approve</button>
          <button class="admin-btn-small admin-btn-delete" data-action="decline" data-uid="${a.uid}">Decline</button>
        </div>
      </div>
    </div>
  `).join('') || '<p class="admin-empty">No pending applications.</p>';

  resolvedList.innerHTML = resolvedApplications.slice(0, 20).map(a => `
    <div class="admin-row">
      <div class="admin-row-main">
        <span class="admin-row-name">${escapeHtml(a.name)}</span>
        <span class="admin-row-role-badge ${a.status === 'approved' ? 'role-archon' : ''}">${capitalize(a.status)}</span>
      </div>
      ${a.status === 'declined' && a.declineReason ? `<p class="admin-applicant-message">Reason: ${escapeHtml(a.declineReason)}</p>` : ''}
    </div>
  `).join('') || '<p class="admin-empty">No resolved applications yet.</p>';

  pendingList.querySelectorAll('[data-action="approve"]').forEach(btn => {
    btn.addEventListener('click', () => adminApproveApplication(btn.dataset.uid));
  });
  pendingList.querySelectorAll('[data-action="decline"]').forEach(btn => {
    btn.addEventListener('click', () => adminDeclineApplication(btn.dataset.uid));
  });
}

function adminApproveApplication(uid) {
  const app = pendingApplications.find(a => a.uid === uid);
  const errorEl = document.getElementById(`applicant-error-${uid}`);
  if (!app) return;

  const nameInput = document.querySelector(`.admin-applicant-name[data-uid="${uid}"]`);
  const roleSelect = document.querySelector(`.admin-applicant-role[data-uid="${uid}"]`);
  const titleInput = document.querySelector(`.admin-applicant-title[data-uid="${uid}"]`);
  const finalName = nameInput.value.trim();
  const finalRole = roleSelect.value;
  const finalTitle = titleInput.value.trim();

  if (!finalName) { errorEl.textContent = 'Name cannot be empty.'; return; }
  if (nameTakenByExistingMember(finalName)) {
    errorEl.textContent = 'That name is already used by an existing member.';
    return;
  }
  errorEl.textContent = '';

  const oldKey = usernameKey(app.name);
  const newKey = usernameKey(finalName);
  const reservationStep = (oldKey === newKey)
    ? updateDoc(doc(db, 'usernames', oldKey), { status: 'approved' })
    : deleteDoc(doc(db, 'usernames', oldKey)).catch(() => {})
        .then(() => setDoc(doc(db, 'usernames', newKey), { uid, status: 'approved' }));

  reservationStep
    .then(() => addDoc(collection(db, 'members'), {
      name: finalName, role: finalRole, title: finalTitle, desc: '', uid
    }))
    .then(() => updateDoc(doc(db, 'applications', uid), {
      status: 'approved', resolvedRole: finalRole, resolvedAt: serverTimestamp()
    }))
    .then(() => addDoc(collection(db, 'notifications'), {
      toUid: uid, type: 'approved',
      message: `Your application has been approved! You've been granted the role of ${capitalize(finalRole)}.`,
      read: false, createdAt: serverTimestamp()
    }))
    .catch(err => { errorEl.textContent = err.message; });
}

function adminDeclineApplication(uid) {
  const field = document.getElementById(`decline-field-${uid}`);
  const reasonInput = document.querySelector(`.admin-applicant-decline-reason[data-uid="${uid}"]`);
  const errorEl = document.getElementById(`applicant-error-${uid}`);
  const app = pendingApplications.find(a => a.uid === uid);
  if (!app) return;

  // First click just reveals the reason field — the application stays
  // open until an actual reason is provided, as required.
  if (field.style.display === 'none') {
    field.style.display = 'block';
    reasonInput.focus();
    return;
  }

  const reason = reasonInput.value.trim();
  if (!reason) {
    errorEl.textContent = 'A reason is required before declining.';
    return;
  }
  errorEl.textContent = '';

  updateDoc(doc(db, 'applications', uid), {
    status: 'declined', declineReason: reason, resolvedAt: serverTimestamp()
  })
    .then(() => deleteDoc(doc(db, 'usernames', usernameKey(app.name))).catch(() => {}))
    .then(() => addDoc(collection(db, 'notifications'), {
      toUid: uid, type: 'declined', message: reason, read: false, createdAt: serverTimestamp()
    }))
    .catch(err => { errorEl.textContent = err.message; });
}

window.adminSeedData = function() {
  if (MEMBERS.length > 0 || UPDATES.length > 0) return; // guard against double-seeding
  if (!confirm('Import the original 23 members and 5 updates into Firestore? This only needs to run once.')) return;

  const memberWrites = DEFAULT_SEED_MEMBERS.map(m =>
    setDoc(doc(db, 'usernames', usernameKey(m.name)), { uid: null, status: 'approved' })
      .catch(() => {}) // already reserved somehow — don't block the import over it
      .then(() => addDoc(collection(db, 'members'), m))
  );
  const updateWrites = DEFAULT_SEED_UPDATES.map(u => addDoc(collection(db, 'updates'), { ...u, createdAt: serverTimestamp() }));

  Promise.all([...memberWrites, ...updateWrites])
    .then(() => { alert('Import complete!'); })
    .catch(err => { alert('Import failed: ' + err.message); });
};

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
    // Determine role — prefer a direct account link (set when a member
    // was created via an approved application), fall back to name match
    // for members added manually by an admin with no linked account.
    const member = MEMBERS.find(m => m.uid === user.uid) || MEMBERS.find(m => m.name.toLowerCase() === name.toLowerCase());
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

window.logout = function() {
  adminPasswordVerified = false;
  sessionStorage.removeItem('arkenfold-admin-ok');
  signOut(auth);
};

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
  const notifWrap = document.getElementById('notif-bell-wrap');

  // Always tear down previous listeners first — avoids leaks/duplicates
  // across login/logout cycles or account switches.
  if (unsubMyApplication) { unsubMyApplication(); unsubMyApplication = null; }
  if (unsubAllApplications) { unsubAllApplications(); unsubAllApplications = null; }
  if (unsubMyNotifications) { unsubMyNotifications(); unsubMyNotifications = null; }
  myApplication = null;
  pendingApplications = [];
  resolvedApplications = [];
  myNotifications = [];

  if (user) {
    user.reload().catch(() => {}).then(() => {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userMenu) userMenu.style.display = 'block';
      if (notifWrap) notifWrap.style.display = 'block';
      const name = user.displayName || user.email.split('@')[0];
      const initial = getInitial(name);
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('user-avatar', initial);
      set('dropdown-avatar', initial);
      set('dropdown-name', name);
      set('dropdown-email', user.email);

      // Track this user's own application (works for admins too, in case
      // they ever have one, though the bell itself prioritizes admin duties)
      unsubMyApplication = onSnapshot(doc(db, 'applications', user.uid), (snap) => {
        myApplication = snap.exists() ? { uid: user.uid, ...snap.data() } : null;
      }, () => {});

      // Track this user's own notifications
      unsubMyNotifications = onSnapshot(
        query(collection(db, 'notifications'), where('toUid', '==', user.uid)),
        (snap) => {
          myNotifications = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
          updateNotifBadge();
          const dropdown = document.getElementById('notif-dropdown');
          if (dropdown && dropdown.style.display !== 'none') renderNotifDropdown();
        }, () => {}
      );

      getDoc(doc(db, 'admins', user.uid))
        .then(snap => {
          isAdminUser = snap.exists();
          document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = isAdminUser ? '' : 'none';
          });

          // Admins additionally watch ALL applications, to power the
          // Applicants tab and the bell's pending-count badge.
          if (isAdminUser) {
            unsubAllApplications = onSnapshot(collection(db, 'applications'), (snap) => {
              const all = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
              pendingApplications = all.filter(a => a.status === 'pending')
                .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
              resolvedApplications = all.filter(a => a.status !== 'pending')
                .sort((a, b) => (b.resolvedAt?.toMillis?.() || 0) - (a.resolvedAt?.toMillis?.() || 0));
              updateNotifBadge();
              if (currentPage === 'admin') renderAdminApplicantsList();
            }, () => {});
          }

          if (currentPage === 'admin') renderAdminPage();
        })
        .catch(() => { isAdminUser = false; });

      // Update account page if visible
      if (currentPage === 'account') renderAccount();
    });
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (userMenu) userMenu.style.display = 'none';
    if (notifWrap) notifWrap.style.display = 'none';
    isAdminUser = false;
    document.querySelectorAll('.admin-only').forEach(el => { el.style.display = 'none'; });
    if (currentPage === 'account') renderAccount();
    if (currentPage === 'admin') renderAdminPage();
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
  const modals = ['auth-modal', 'email-confirm-modal', 'password-setup-modal', 'reset-password-modal', 'change-password-modal', 'join-modal'];
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

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mainDot.style.left = mouseX + 'px';
    mainDot.style.top = mouseY + 'px';
    ring.style.left = mouseX + 'px';
    ring.style.top = mouseY + 'px';
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

  // Trail particles — instant, no lag
  let trailCount = 0;
  document.addEventListener('mousemove', (e) => {
    trailCount++;
    if (trailCount % 2 !== 0) return;
    const p = document.createElement('div');
    p.className = 'cursor-trail';
    p.style.left = e.clientX + 'px';
    p.style.top = e.clientY + 'px';
    document.body.appendChild(p);
    p.animate([
      { opacity: 0.7, transform: 'translate(-50%, -50%) scale(1)' },
      { opacity: 0, transform: 'translate(-50%, -50%) scale(0)' }
    ], { duration: 400, easing: 'ease-out', fill: 'forwards' }).onfinish = () => p.remove();
  });

  // Click burst — instant
  document.addEventListener('click', (e) => {
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'cursor-burst';
      p.style.left = e.clientX + 'px';
      p.style.top = e.clientY + 'px';
      const angle = (Math.PI * 2 * i) / 8;
      const dist = 25 + Math.random() * 25;
      p.animate([
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
        { opacity: 0, transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(0)` }
      ], { duration: 350, easing: 'ease-out', fill: 'forwards' }).onfinish = () => p.remove();
      document.body.appendChild(p);
    }
  });
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
function initNotifDropdown() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#notif-bell-wrap')) {
      const dropdown = document.getElementById('notif-dropdown');
      if (dropdown) dropdown.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSplash();
  createParticles();
  initHeaderScroll();
  initScrollProgress();
  initBackToTop();
  initMobileMenu();
  initUserMenu();
  initNotifDropdown();
  handleHash();
  initFirestoreListeners();

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
