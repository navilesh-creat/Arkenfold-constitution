import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
	getAuth,
	signInWithEmailAndPassword,
	signOut,
	updateProfile,
	updatePassword,
	onAuthStateChanged,
	sendPasswordResetEmail,
	sendSignInLinkToEmail,
	isSignInWithEmailLink,
	signInWithEmailLink,
	reauthenticateWithCredential,
	EmailAuthProvider
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

let mode = "login"; // or "signup"

/* ═══════════════════════════════════════════════
   SOUND ENGINE (Web Audio API)
   Generates subtle, themed sound effects —
   no external audio files needed.
   ═══════════════════════════════════════════════ */

let audioCtx = null;
let soundEnabled = localStorage.getItem('arkenfold-sound') !== 'off';

function getAudioCtx() {
	if (!audioCtx) {
		audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	}
	// Resume if suspended (browser autoplay policy)
	if (audioCtx.state === 'suspended') audioCtx.resume();
	return audioCtx;
}

/** Short, crisp "ting" for button clicks */
function playClickSound() {
	if (!soundEnabled) return;
	try {
		const ctx = getAudioCtx();
		const now = ctx.currentTime;

		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = 'sine';
		osc.frequency.setValueAtTime(880, now);
		osc.frequency.exponentialRampToValueAtTime(1320, now + 0.05);

		gain.gain.setValueAtTime(0.15, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.12);
	} catch (e) { /* silent fail */ }
}

/** Soft "whoosh" sweep for page transitions */
function playTransitionSound() {
	if (!soundEnabled) return;
	try {
		const ctx = getAudioCtx();
		const now = ctx.currentTime;

		// Filtered noise for whoosh
		const bufferSize = ctx.sampleRate * 0.35;
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			data[i] = (Math.random() * 2 - 1) * 0.5;
		}

		const noise = ctx.createBufferSource();
		noise.buffer = buffer;

		const filter = ctx.createBiquadFilter();
		filter.type = 'bandpass';
		filter.frequency.setValueAtTime(200, now);
		filter.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
		filter.frequency.exponentialRampToValueAtTime(300, now + 0.35);
		filter.Q.value = 1.5;

		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
		gain.gain.linearRampToValueAtTime(0, now + 0.35);

		noise.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		noise.start(now);
		noise.stop(now + 0.35);

		// Add a soft chime overlay
		const osc = ctx.createOscillator();
		const oscGain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(523, now); // C5
		osc.frequency.setValueAtTime(659, now + 0.1); // E5
		oscGain.gain.setValueAtTime(0, now);
		oscGain.gain.linearRampToValueAtTime(0.06, now + 0.08);
		oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
		osc.connect(oscGain);
		oscGain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.3);
	} catch (e) { /* silent fail */ }
}

/** Two-note ascending chime for success moments */
function playSuccessSound() {
	if (!soundEnabled) return;
	try {
		const ctx = getAudioCtx();
		const now = ctx.currentTime;

		[523, 784].forEach((freq, i) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, now + i * 0.12);
			gain.gain.linearRampToValueAtTime(0.1, now + i * 0.12 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + i * 0.12);
			osc.stop(now + i * 0.12 + 0.25);
		});
	} catch (e) { /* silent fail */ }
}

/** Soft low thud for modal open */
function playModalOpenSound() {
	if (!soundEnabled) return;
	try {
		const ctx = getAudioCtx();
		const now = ctx.currentTime;

		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(180, now);
		osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
		gain.gain.setValueAtTime(0.1, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.15);
	} catch (e) { /* silent fail */ }
}

/** Toggle sound on/off and persist preference */
window.toggleSound = function () {
	soundEnabled = !soundEnabled;
	localStorage.setItem('arkenfold-sound', soundEnabled ? 'on' : 'off');
	const btn = document.getElementById('sound-toggle');
	if (btn) {
		btn.textContent = soundEnabled ? '🔊' : '🔇';
		btn.title = soundEnabled ? 'Mute sounds' : 'Unmute sounds';
	}
	if (soundEnabled) playClickSound();
};
let pendingSignupData = null; // temporarily holds {username, email} before confirmation

/* ═══════════════════════════════════════════════
   PAGE NAVIGATION (with transitions)
   ═══════════════════════════════════════════════ */

window.showConstitution = function () {
	playTransitionSound();
	const home = document.getElementById('home');
	const constitution = document.getElementById('constitution');

	// Apply exit animation
	home.style.animation = 'pageSlideOut 0.4s ease forwards';

	setTimeout(() => {
		home.classList.remove('active');
		home.style.animation = '';

		constitution.classList.add('active');
		window.scrollTo({ top: 0, behavior: 'instant' });

		setTimeout(() => {
			document.getElementById('const-content').classList.add('active');
			initScrollReveals();
		}, 50);
	}, 400);
};

window.showHome = function () {
	playTransitionSound();
	const home = document.getElementById('home');
	const constitution = document.getElementById('constitution');
	const constContent = document.getElementById('const-content');

	constContent.classList.remove('active');
	constitution.style.animation = 'pageSlideOut 0.4s ease forwards';

	setTimeout(() => {
		constitution.classList.remove('active');
		constitution.style.animation = '';

		home.classList.add('active');
		window.scrollTo({ top: 0, behavior: 'instant' });

		animateHomeElements();
		animateMembersList();
	}, 400);
};

function animateHomeElements() {
	const elements = document.querySelectorAll('#home .reveal');
	elements.forEach((el, i) => {
		el.classList.remove('visible');
		setTimeout(() => el.classList.add('visible'), 100 + i * 80);
	});
}

/* ═══════════════════════════════════════════════
   FLOATING PARTICLES
   ═══════════════════════════════════════════════ */

function createParticles() {
	const container = document.getElementById('particles');
	if (!container) return;

	const particleCount = window.innerWidth < 768 ? 15 : 25;

	for (let i = 0; i < particleCount; i++) {
		const particle = document.createElement('div');
		particle.classList.add('particle');

		const size = Math.random() * 3 + 1;
		const left = Math.random() * 100;
		const duration = Math.random() * 15 + 10;
		const delay = Math.random() * 20;
		const opacity = Math.random() * 0.4 + 0.1;

		particle.style.cssText = `
			width: ${size}px;
			height: ${size}px;
			left: ${left}%;
			animation-duration: ${duration}s;
			animation-delay: -${delay}s;
			opacity: ${opacity};
		`;

		container.appendChild(particle);
	}
}

/* ═══════════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════════ */

function initScrollReveals() {
	const reveals = document.querySelectorAll('.reveal:not(.visible)');

	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('visible');
				observer.unobserve(entry.target);
			}
		});
	}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

	reveals.forEach(el => observer.observe(el));
}

/* ═══════════════════════════════════════════════
   HEADER SCROLL EFFECT
   ═══════════════════════════════════════════════ */

function initHeaderScroll() {
	const header = document.querySelector('header');
	if (!header) return;

	let ticking = false;
	window.addEventListener('scroll', () => {
		if (!ticking) {
			requestAnimationFrame(() => {
				if (window.scrollY > 50) {
					header.classList.add('scrolled');
				} else {
					header.classList.remove('scrolled');
				}
				ticking = false;
			});
			ticking = true;
		}
	});
}

/* ═══════════════════════════════════════════════
   PASSWORD STRENGTH INDICATOR
   ═══════════════════════════════════════════════ */

window.checkPasswordStrength = function () {
	const password = document.getElementById("new-password").value;
	const strengthBar = document.getElementById("new-strength-bar");
	const strengthText = document.getElementById("new-strength-text");

	if (!password) {
		strengthBar.style.width = "0";
		strengthBar.style.background = "";
		strengthText.textContent = "Password strength";
		strengthText.style.color = "";
		return;
	}

	let strength = 0;

	if (password.length >= 6) strength++;
	if (password.length >= 8) strength++;
	if (password.length >= 12) strength++;
	if (/[a-z]/.test(password)) strength++;
	if (/[A-Z]/.test(password)) strength++;
	if (/[0-9]/.test(password)) strength++;
	if (/[^a-zA-Z0-9]/.test(password)) strength++;

	let feedback = "";
	let color = "";

	if (strength <= 2) { feedback = "Weak"; color = "#e05a5a"; }
	else if (strength <= 4) { feedback = "Fair"; color = "#f0a500"; }
	else if (strength <= 5) { feedback = "Good"; color = "#d4af37"; }
	else { feedback = "Strong"; color = "#4caf50"; }

	const percentage = Math.min((strength / 7) * 100, 100);
	strengthBar.style.width = percentage + "%";
	strengthBar.style.background = color;
	strengthText.textContent = feedback;
	strengthText.style.color = color;
};

/* ═══════════════════════════════════════════════
   FRIENDLY ERROR MAPPING
   Converts raw Firebase errors into themed,
   human-readable messages.
   ═══════════════════════════════════════════════ */

const errorMap = {
	'auth/invalid-credential':          'Invalid email or password. Please check your credentials.',
	'auth/user-not-found':              'No account found with this email.',
	'auth/wrong-password':              'Incorrect password. Please try again.',
	'auth/email-already-in-use':        'This email is already registered. Try logging in instead.',
	'auth/invalid-email':               'Please enter a valid email address.',
	'auth/user-disabled':               'This account has been disabled.',
	'auth/too-many-requests':           'Too many attempts. Please wait a moment and try again.',
	'auth/network-request-failed':      'Network error. Please check your connection.',
	'auth/popup-closed-by-user':        'Popup was closed. Please try again.',
	'auth/operation-not-allowed':       'This sign-in method is not enabled.',
	'auth/weak-password':               'Password is too weak. Please choose a stronger one.',
	'auth/requires-recent-login':       'Please log out and log back in to perform this action.',
	'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
	'auth/credential-already-in-use':   'This credential is already associated with another account.',
	'auth/invalid-action-code':         'The verification link is invalid or has expired.',
	'auth/expired-action-code':         'The verification link has expired. Please request a new one.',
	'auth/email-already-verified':      'This email is already verified.',
};

function friendlyError(err) {
	const msg = (err && err.message) ? err.message.replace('Firebase: ', '') : '';

	// Try to extract the code from the standard Firebase format:
	// "auth/invalid-credential. (auth/invalid-credential)."
	const match = msg.match(/\(([^)]+)\)/) || msg.match(/^([a-z/-]+)\b/);
	const code = match ? match[1] : '';

	if (code && errorMap[code]) return errorMap[code];
	if (msg) return msg;
	return 'Something went wrong. Please try again.';
}

/* ═══════════════════════════════════════════════
   UTILITY
   ═══════════════════════════════════════════════ */

function resetSubmitBtn() {
	const submitBtn = document.getElementById("auth-submit-btn");
	const btnText = submitBtn.querySelector(".btn-text");
	const btnSpinner = submitBtn.querySelector(".btn-spinner");

	btnText.textContent = mode === "login" ? "Login" : "Sign Up";
	btnSpinner.style.display = "none";
	submitBtn.style.opacity = "1";
	submitBtn.style.pointerEvents = "auto";
}

/* ═══════════════════════════════════════════════
   AUTH MODAL
   ═══════════════════════════════════════════════ */

window.openAuthModal = function () {
	playModalOpenSound();
	// Always reset to login mode
	mode = "login";
	document.getElementById("auth-modal-title").textContent = "Login";
	document.getElementById("auth-submit-btn").querySelector(".btn-text").textContent = "Login";
	document.getElementById("auth-username").style.display = "none";
	document.getElementById("auth-password").style.display = "block";
	document.getElementById("auth-toggle-label").textContent = "Don't have an account?";
	document.getElementById("auth-toggle-link").textContent = "Sign up";
	document.getElementById("auth-error").textContent = "";
	const forgotLink = document.getElementById("forgot-password-link");
	if (forgotLink) forgotLink.style.display = "inline-block";

	document.getElementById("auth-modal").style.display = "flex";
};

window.closeAuthModal = function () {
	const modal = document.getElementById("auth-modal");
	const box = modal.querySelector('.auth-modal-box');

	box.style.animation = 'modalBoxOut 0.25s ease forwards';
	setTimeout(() => {
		modal.style.display = "none";
		box.style.animation = '';
		document.getElementById("auth-error").textContent = "";
		document.getElementById("auth-username").value = "";
		document.getElementById("auth-email").value = "";
	}, 250);
};

/* ═══════════════════════════════════════════════
   EMAIL CONFIRMATION MODAL
   Shows the entered email for user to confirm
   before account creation proceeds.
   ═══════════════════════════════════════════════ */

function openEmailConfirmModal(email) {
	document.getElementById('confirm-email-display').innerHTML =
		`<span class="confirm-label">Your email address</span>` +
		`<span class="confirm-email">${email}</span>`;
	document.getElementById('confirm-error').textContent = '';
	document.getElementById('email-confirm-modal').style.display = 'flex';
}

window.closeEmailConfirmModal = function () {
	const modal = document.getElementById('email-confirm-modal');
	const box = modal.querySelector('.auth-modal-box');
	box.style.animation = 'modalBoxOut 0.25s ease forwards';
	setTimeout(() => {
		modal.style.display = 'none';
		box.style.animation = '';
	}, 250);
	pendingSignupData = null;
};

window.confirmEmailYes = function () {
	const errorBox = document.getElementById('confirm-error');
	const submitBtn = document.getElementById('confirm-yes-btn');
	const btnText = submitBtn.querySelector('.btn-text');
	const btnSpinner = submitBtn.querySelector('.btn-spinner');

	errorBox.textContent = '';

	if (!pendingSignupData) {
		errorBox.textContent = 'Session expired. Please try again.';
		return;
	}

	btnText.textContent = 'Sending link...';
	btnSpinner.style.display = 'inline-block';
	submitBtn.style.opacity = '0.7';
	submitBtn.style.pointerEvents = 'none';

	const { username, email } = pendingSignupData;

	// Where Firebase should send the user back to once they click the
	// link in their email. handleCodeInApp keeps the whole flow on this
	// page instead of Firebase's hosted page.
	const actionCodeSettings = {
		url: window.location.origin + window.location.pathname,
		handleCodeInApp: true
	};

	// IMPORTANT: no Firebase account exists yet at this point — we're
	// only emailing a sign-in link. The account itself is only created
	// later, in completeEmailLinkSignIn(), once the user actually
	// clicks that link. This guarantees nobody ends up in Firebase
	// Authentication without a verified email.
	sendSignInLinkToEmail(auth, email, actionCodeSettings)
		.then(() => {
			// Remember username + email so we can finish signup once the
			// user comes back through the emailed link (possibly in a
			// new tab, so this needs to survive that).
			localStorage.setItem('pendingEmailLinkSignup', JSON.stringify({ username, email }));

			// Close confirmation modal
			closeEmailConfirmModal();

			// Re-open auth modal to show the success message
			document.getElementById('auth-modal').style.display = 'flex';
			document.getElementById('auth-modal-title').textContent = 'Sign Up';
			document.getElementById('auth-submit-btn').querySelector('.btn-text').textContent = 'Sign Up';
			document.getElementById('auth-username').style.display = 'block';
			document.getElementById('auth-password').style.display = 'none';
			document.getElementById('auth-toggle-label').textContent = 'Already have an account?';
			document.getElementById('auth-toggle-link').textContent = 'Login';
			document.getElementById('forgot-password-link').style.display = 'none';
			const authError = document.getElementById('auth-error');
			authError.style.color = '#4caf50';
			authError.innerHTML = 'Verification link sent! Please check your inbox and click the link to finish creating your account.';

			// Reset confirm button
			btnText.textContent = '✓ Yes, this is my email';
			btnSpinner.style.display = 'none';
			submitBtn.style.opacity = '1';
			submitBtn.style.pointerEvents = 'auto';

			pendingSignupData = null;
		})
		.catch((err) => {
			errorBox.textContent = friendlyError(err);
			btnText.textContent = '✓ Yes, this is my email';
			btnSpinner.style.display = 'none';
			submitBtn.style.opacity = '1';
			submitBtn.style.pointerEvents = 'auto';
		});
};

window.toggleAuthMode = function (e) {
	e.preventDefault();
	mode = mode === "login" ? "signup" : "login";
	document.getElementById("auth-modal-title").textContent = mode === "login" ? "Login" : "Sign Up";

	const submitBtn = document.getElementById("auth-submit-btn");
	submitBtn.querySelector(".btn-text").textContent = mode === "login" ? "Login" : "Sign Up";

	document.getElementById("auth-toggle-label").textContent = mode === "login" ? "Don't have an account?" : "Already have an account?";
	document.getElementById("auth-toggle-link").textContent = mode === "login" ? "Sign up" : "Login";
	document.getElementById("auth-username").style.display = mode === "signup" ? "block" : "none";
	document.getElementById("auth-password").style.display = mode === "login" ? "block" : "none";
	document.getElementById("auth-error").textContent = "";

	const forgotLink = document.getElementById("forgot-password-link");
	if (forgotLink) forgotLink.style.display = mode === "login" ? "inline-block" : "none";
};

/* ═══════════════════════════════════════════════
   RESET PASSWORD MODAL
   ═══════════════════════════════════════════════ */

window.openResetPasswordModal = function () {
	playModalOpenSound();
	document.getElementById("auth-modal").style.display = "none";
	document.getElementById("reset-password-modal").style.display = "flex";
};

window.closeResetPasswordModal = function () {
	const modal = document.getElementById("reset-password-modal");
	const box = modal.querySelector('.auth-modal-box');

	box.style.animation = 'modalBoxOut 0.25s ease forwards';
	setTimeout(() => {
		modal.style.display = "none";
		box.style.animation = '';
		document.getElementById("reset-error").textContent = "";
		document.getElementById("reset-success").textContent = "";
		document.getElementById("reset-email").value = "";
	}, 250);
};

window.submitResetPassword = function () {
	const email = document.getElementById("reset-email").value.trim();
	const errorBox = document.getElementById("reset-error");
	const successBox = document.getElementById("reset-success");
	const submitBtn = document.getElementById("reset-submit-btn");
	const btnText = submitBtn.querySelector(".btn-text");
	const btnSpinner = submitBtn.querySelector(".btn-spinner");

	errorBox.textContent = "";
	successBox.textContent = "";

	if (!email) {
		errorBox.textContent = "Please enter your email address.";
		return;
	}

	btnText.textContent = "Sending...";
	btnSpinner.style.display = "inline-block";
	submitBtn.style.opacity = "0.7";
	submitBtn.style.pointerEvents = "none";

	sendPasswordResetEmail(auth, email)
		.then(() => {
			successBox.textContent = "Password reset email sent! Check your inbox.";
			btnText.textContent = "Send Reset Link";
			btnSpinner.style.display = "none";
			submitBtn.style.opacity = "1";
			submitBtn.style.pointerEvents = "auto";
		})
		.catch((err) => {
			errorBox.textContent = friendlyError(err);
			btnText.textContent = "Send Reset Link";
			btnSpinner.style.display = "none";
			submitBtn.style.opacity = "1";
			submitBtn.style.pointerEvents = "auto";
		});
};

/* ═══════════════════════════════════════════════
   SIGNUP - VERIFY BEFORE ACCOUNT EXISTS
   
   How it works:
   1. User enters username + email (NO password shown)
   2. Firebase sends a sign-in link to that email —
      NO account exists in Firebase yet at this point
   3. Username + email are saved in localStorage so
      they survive the trip to the user's inbox
   4. User clicks the link in their email and lands
      back on this page
   5. completeEmailLinkSignIn() (below) detects the
      link and calls signInWithEmailLink() — THIS is
      the moment the Firebase account is actually
      created, and only because the email was verified
   6. The saved username is attached as displayName
   7. Password setup modal opens so the user can add
      a real password to their new account
   ═══════════════════════════════════════════════ */

window.submitAuth = function () {
	const username = document.getElementById("auth-username").value.trim();
	const email = document.getElementById("auth-email").value.trim();
	const password = document.getElementById("auth-password").value;
	const errorBox = document.getElementById("auth-error");
	const submitBtn = document.getElementById("auth-submit-btn");
	const btnText = submitBtn.querySelector(".btn-text");
	const btnSpinner = submitBtn.querySelector(".btn-spinner");

	errorBox.textContent = "";

	if (mode === "login") {
		// ── LOGIN ──
		if (!email || !password) {
			errorBox.textContent = "Please fill in both fields.";
			return;
		}

		btnText.textContent = "Logging in...";
		btnSpinner.style.display = "inline-block";
		submitBtn.style.opacity = "0.7";
		submitBtn.style.pointerEvents = "none";

		signInWithEmailAndPassword(auth, email, password)
		.then(() => {
			playSuccessSound();
			window.closeAuthModal();
		})
			.catch((err) => {
				errorBox.textContent = friendlyError(err);
				resetSubmitBtn();
			});
	} else {
		// ── SIGNUP (username + email only, NO password) ──
		if (!username || !email) {
			errorBox.textContent = "Please fill in username and email.";
			return;
		}

		// Store the data temporarily — account is NOT created yet
		pendingSignupData = { username, email };

		// Close auth modal and show confirmation modal with the email
		closeAuthModal();
		setTimeout(() => openEmailConfirmModal(email), 300);
	}
};

/* ═══════════════════════════════════════════════
   PASSWORD SETUP MODAL
   ═══════════════════════════════════════════════ */

window.openPasswordSetupModal = function () {
	playModalOpenSound();
	document.getElementById("password-setup-modal").style.display = "flex";
};

window.closePasswordSetupModal = function () {
	const modal = document.getElementById("password-setup-modal");
	const box = modal.querySelector('.auth-modal-box');

	box.style.animation = 'modalBoxOut 0.25s ease forwards';
	setTimeout(() => {
		modal.style.display = "none";
		box.style.animation = '';
		document.getElementById("setup-error").textContent = "";
		document.getElementById("new-password").value = "";
		document.getElementById("confirm-password").value = "";
	}, 250);
};

window.submitPasswordSetup = function () {
	const newPassword = document.getElementById("new-password").value;
	const confirmPassword = document.getElementById("confirm-password").value;
	const errorBox = document.getElementById("setup-error");
	const submitBtn = document.getElementById("setup-submit-btn");
	const btnText = submitBtn.querySelector(".btn-text");
	const btnSpinner = submitBtn.querySelector(".btn-spinner");

	errorBox.textContent = "";

	if (!newPassword || !confirmPassword) {
		errorBox.textContent = "Please fill in both fields.";
		return;
	}

	if (newPassword.length < 6) {
		errorBox.textContent = "Password must be at least 6 characters.";
		return;
	}

	if (newPassword !== confirmPassword) {
		errorBox.textContent = "Passwords do not match.";
		return;
	}

	// At this point the user is already signed in — completeEmailLinkSignIn()
	// authenticated them the moment they clicked the emailed link. We just
	// need to attach a real password to that account.
	if (!auth.currentUser) {
		errorBox.textContent = "Session expired. Please sign up again.";
		return;
	}

	btnText.textContent = "Setting Password...";
	btnSpinner.style.display = "inline-block";
	submitBtn.style.opacity = "0.7";
	submitBtn.style.pointerEvents = "none";

	updatePassword(auth.currentUser, newPassword)
		.then(() => {
			playSuccessSound();
			closePasswordSetupModal();
			// User is now signed in with their real password
		})
		.catch((err) => {
			errorBox.textContent = friendlyError(err);
			btnText.textContent = "Set Password";
			btnSpinner.style.display = "none";
			submitBtn.style.opacity = "1";
			submitBtn.style.pointerEvents = "auto";
		});
};

/* ═══════════════════════════════════════════════
   CHANGE PASSWORD MODAL
   Allows logged-in users to update their password.
   ═══════════════════════════════════════════════ */

window.openChangePasswordModal = function () {
	playModalOpenSound();
	playClickSound();
	document.getElementById('change-old-password').value = '';
	document.getElementById('change-new-password').value = '';
	document.getElementById('change-confirm-password').value = '';
	document.getElementById('change-password-error').textContent = '';
	document.getElementById('change-password-success').textContent = '';
	document.getElementById('change-strength-bar').style.width = '0';
	document.getElementById('change-strength-text').textContent = 'Password strength';
	document.getElementById('change-strength-text').style.color = '';
	document.getElementById('change-password-modal').style.display = 'flex';
};

window.closeChangePasswordModal = function () {
	const modal = document.getElementById('change-password-modal');
	const box = modal.querySelector('.auth-modal-box');
	box.style.animation = 'modalBoxOut 0.25s ease forwards';
	setTimeout(() => {
		modal.style.display = 'none';
		box.style.animation = '';
	}, 250);
};

window.checkChangePasswordStrength = function () {
	const password = document.getElementById('change-new-password').value;
	const bar = document.getElementById('change-strength-bar');
	const text = document.getElementById('change-strength-text');

	if (!password) {
		bar.style.width = '0';
		bar.style.background = '';
		text.textContent = 'Password strength';
		text.style.color = '';
		return;
	}

	let strength = 0;
	if (password.length >= 6) strength++;
	if (password.length >= 8) strength++;
	if (password.length >= 12) strength++;
	if (/[a-z]/.test(password)) strength++;
	if (/[A-Z]/.test(password)) strength++;
	if (/[0-9]/.test(password)) strength++;
	if (/[^a-zA-Z0-9]/.test(password)) strength++;

	let feedback = '', color = '';
	if (strength <= 2) { feedback = 'Weak'; color = '#e05a5a'; }
	else if (strength <= 4) { feedback = 'Fair'; color = '#f0a500'; }
	else if (strength <= 5) { feedback = 'Good'; color = '#d4af37'; }
	else { feedback = 'Strong'; color = '#4caf50'; }

	bar.style.width = Math.min((strength / 7) * 100, 100) + '%';
	bar.style.background = color;
	text.textContent = feedback;
	text.style.color = color;
};window.openChangePasswordResetModal = function () {
	playModalOpenSound();
	// Close change-password modal, open reset-password modal
	document.getElementById('change-password-modal').style.display = 'none';
	document.getElementById('reset-password-modal').style.display = 'flex';
};

window.submitChangePassword = function () {
	const oldPass = document.getElementById('change-old-password').value;
	const newPass = document.getElementById('change-new-password').value;
	const confirmPass = document.getElementById('change-confirm-password').value;
	const errorBox = document.getElementById('change-password-error');
	const successBox = document.getElementById('change-password-success');
	const submitBtn = document.getElementById('change-password-submit-btn');
	const btnText = submitBtn.querySelector('.btn-text');
	const btnSpinner = submitBtn.querySelector('.btn-spinner');

	errorBox.textContent = '';
	successBox.textContent = '';

	if (!oldPass) {
		errorBox.textContent = 'Please enter your current password.';
		return;
	}

	if (!newPass || !confirmPass) {
		errorBox.textContent = 'Please fill in both new password fields.';
		return;
	}

	if (newPass.length < 6) {
		errorBox.textContent = 'Password must be at least 6 characters.';
		return;
	}

	if (newPass !== confirmPass) {
		errorBox.textContent = 'Passwords do not match.';
		return;
	}

	const user = auth.currentUser;
	if (!user) {
		errorBox.textContent = 'No user signed in.';
		return;
	}

	btnText.textContent = 'Verifying...';
	btnSpinner.style.display = 'inline-block';
	submitBtn.style.opacity = '0.7';
	submitBtn.style.pointerEvents = 'none';

	// Re-authenticate with the old password first
	const credential = EmailAuthProvider.credential(user.email, oldPass);
	reauthenticateWithCredential(user, credential)
		.then(() => {
			// Authentication succeeded — now update to the new password
			btnText.textContent = 'Updating...';
			return updatePassword(user, newPass);
		})
		.then(() => {
			playSuccessSound();
			successBox.textContent = 'Password updated successfully!';
			btnText.textContent = 'Update Password';
			btnSpinner.style.display = 'none';
			submitBtn.style.opacity = '1';
			submitBtn.style.pointerEvents = 'auto';
			document.getElementById('change-old-password').value = '';
			document.getElementById('change-new-password').value = '';
			document.getElementById('change-confirm-password').value = '';
		})
		.catch((err) => {
			errorBox.textContent = friendlyError(err);
			btnText.textContent = 'Update Password';
			btnSpinner.style.display = 'none';
			submitBtn.style.opacity = '1';
			submitBtn.style.pointerEvents = 'auto';
		});
};

window.logout = function () {
	signOut(auth);
};

/* ═══════════════════════════════════════════════
   EMAIL LINK SIGN-IN COMPLETION

   Runs once when the script loads. If the current
   page URL is a Firebase sign-in link (i.e. the user
   just clicked the link from their verification
   email), this is the ONLY place a Firebase account
   gets created — nothing exists in Firebase before
   the email is verified.
   ═══════════════════════════════════════════════ */

function showVerifyingOverlay() {
	const overlay = document.createElement('div');
	overlay.id = 'verifying-overlay';
	overlay.className = 'auth-modal-overlay';
	overlay.innerHTML =
		'<div class="auth-modal-box" style="text-align:center;">' +
			'<h2>Verifying your email…</h2>' +
			'<p class="reset-description" style="margin-bottom:0;">Just a moment, this only takes a second.</p>' +
			'<div style="width:32px;height:32px;margin:24px auto 0;border:3px solid rgba(212,175,55,0.2);border-top-color:#d4af37;border-radius:50%;animation:spin 0.8s linear infinite;"></div>' +
		'</div>';
	document.body.appendChild(overlay);
	return overlay;
}

function completeEmailLinkSignIn() {
	if (!isSignInWithEmailLink(auth, window.location.href)) return;

	const pending = JSON.parse(localStorage.getItem('pendingEmailLinkSignup') || 'null');
	let email = pending && pending.email;

	// Show feedback immediately — without this, the user just stares at
	// the bare homepage for however long the network calls below take,
	// which reads as the site being stuck or slow even when it isn't.
	const overlay = showVerifyingOverlay();

	if (!email) {
		// The link was opened on a different device/browser than the one
		// it was requested from, so we don't have the email saved locally.
		// Firebase requires re-confirming it as a safety check.
		overlay.remove();
		email = window.prompt('Please confirm your email address to finish signing up:');
	}

	if (!email) return; // user cancelled — nothing more we can do

	if (!document.getElementById('verifying-overlay')) {
		document.body.appendChild(overlay);
	}

	signInWithEmailLink(auth, email, window.location.href)
		.then((cred) => {
			// Drop the sign-in link params from the URL so refreshing the
			// page doesn't try to reprocess the same link.
			window.history.replaceState({}, document.title, window.location.pathname);

			const username = (pending && pending.email === email && pending.username)
				|| window.prompt('Choose a username:')
				|| email.split('@')[0];

			return updateProfile(cred.user, { displayName: username }).then(() => username);
		})
		.then((username) => {
			localStorage.removeItem('pendingEmailLinkSignup');

			// onAuthStateChanged fires the moment signInWithEmailLink()
			// resolves — before this updateProfile() call above has a
			// chance to finish — so it can't be relied on to show the
			// right name here. Set the greeting directly instead.
			const greeting = document.getElementById("user-greeting");
			if (greeting) {
				greeting.style.display = "inline-block";
				greeting.textContent = "Welcome, " + username;
			}

			overlay.remove();
			openPasswordSetupModal();
		})
		.catch((err) => {
			console.error('Email link sign-in failed:', err);
			localStorage.removeItem('pendingEmailLinkSignup');
			overlay.remove();
		});
}

completeEmailLinkSignIn();

/* ═══════════════════════════════════════════════
   AUTH STATE - keeps the header UI (login/logout
   buttons, greeting) in sync with the signed-in user
   ═══════════════════════════════════════════════ */

onAuthStateChanged(auth, (user) => {
	const loginBtn = document.getElementById("login-btn");
	const userMenu = document.getElementById("user-menu");
	const membersSection = document.getElementById("members-only");

	if (user) {
		user.reload().catch(() => {}).then(() => {
			loginBtn.style.display = "none";
			userMenu.style.display = "block";

			// Populate avatar and dropdown with user info
			const name = user.displayName || user.email.split("@")[0];
			const initial = name.charAt(0).toUpperCase();
			document.getElementById("user-avatar").textContent = initial;
			document.getElementById("dropdown-avatar").textContent = initial;
			document.getElementById("dropdown-name").textContent = name;
			document.getElementById("dropdown-email").textContent = user.email;

			if (membersSection) membersSection.style.display = "block";
		});
	} else {
		loginBtn.style.display = "inline-block";
		userMenu.style.display = "none";
		if (membersSection) membersSection.style.display = "none";
	}
});

/* ═══════════════════════════════════════════════
   SPLASH SCREEN
   ═══════════════════════════════════════════════ */

function initSplashScreen() {
	const splash = document.getElementById('splash-screen');
	if (!splash) return;

	document.body.classList.add('splash-active');

	// Hide splash after the loader bar finishes (~2.0s total)
	setTimeout(() => {
		splash.classList.add('hidden');
		document.body.classList.remove('splash-active');

		// Remove from DOM after fade-out completes
		setTimeout(() => splash.remove(), 600);
	}, 2100);
}

/* ═══════════════════════════════════════════════
   SCROLL PROGRESS BAR
   ═══════════════════════════════════════════════ */

function initScrollProgress() {
	const bar = document.getElementById('scroll-progress');
	if (!bar) return;

	let ticking = false;
	window.addEventListener('scroll', () => {
		if (!ticking) {
			requestAnimationFrame(() => {
				const scrollTop = window.scrollY;
				const docHeight = document.documentElement.scrollHeight - window.innerHeight;
				const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
				bar.style.width = pct + '%';
				ticking = false;
			});
			ticking = true;
		}
	});
}

/* ═══════════════════════════════════════════════
   BACK TO TOP BUTTON
   ═══════════════════════════════════════════════ */

function initBackToTop() {
	const btn = document.getElementById('back-to-top');
	if (!btn) return;

	let ticking = false;
	window.addEventListener('scroll', () => {
		if (!ticking) {
			requestAnimationFrame(() => {
				if (window.scrollY > 400) {
					btn.classList.add('visible');
				} else {
					btn.classList.remove('visible');
				}
				ticking = false;
			});
			ticking = true;
		}
	});

	btn.addEventListener('click', () => {
		playClickSound();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	});
}

/* ═══════════════════════════════════════════════
   BUTTON RIPPLE EFFECT
   ═══════════════════════════════════════════════ */

function addRipple(e) {
	playClickSound();
	const btn = e.currentTarget;
	const ripple = btn.querySelector('.btn-ripple');
	if (!ripple) return;

	const rect = btn.getBoundingClientRect();
	const size = Math.max(rect.width, rect.height);
	const x = e.clientX - rect.left - size / 2;
	const y = e.clientY - rect.top - size / 2;

	// Reset animation
	ripple.style.animation = 'none';
	ripple.offsetHeight; // force reflow
	ripple.style.width = size + 'px';
	ripple.style.height = size + 'px';
	ripple.style.left = x + 'px';
	ripple.style.top = y + 'px';
	ripple.style.animation = '';
}

function initRippleButtons() {
	document.querySelectorAll('.constitution-btn').forEach(btn => {
		btn.addEventListener('click', addRipple);
	});
}

/* ═══════════════════════════════════════════════
   STAGGERED MEMBERS LIST ANIMATION
   ═══════════════════════════════════════════════ */

function animateMembersList() {
	const list = document.querySelector('.members-list');
	if (!list) return;

	// Reset
	list.classList.remove('animate-in');
	const items = list.querySelectorAll('li');
	items.forEach(item => {
		item.style.animation = 'none';
		item.style.opacity = '0';
	});

	// Trigger staggered animation after a short delay
	requestAnimationFrame(() => {
		list.classList.add('animate-in');
		items.forEach((item, i) => {
			item.style.animation = `memberSlideIn 0.4s ease ${i * 0.06}s forwards`;
		});
	});
}

/* ═══════════════════════════════════════════════
   ESC KEY TO CLOSE MODALS
   ═══════════════════════════════════════════════ */

function initEscKey() {
	document.addEventListener('keydown', (e) => {
		if (e.key !== 'Escape') return;

		// Close whichever modal is open, in priority order
		const modals = [
			'auth-modal',
			'email-confirm-modal',
			'password-setup-modal',
			'reset-password-modal',
			'change-password-modal'
		];

		for (const id of modals) {
			const modal = document.getElementById(id);
			if (modal && modal.style.display === 'flex') {
				e.preventDefault();
				// Call the corresponding close function
				if (id === 'auth-modal') closeAuthModal();
				else if (id === 'email-confirm-modal') closeEmailConfirmModal();
				else if (id === 'password-setup-modal') closePasswordSetupModal();
				else if (id === 'reset-password-modal') closeResetPasswordModal();
				else if (id === 'change-password-modal') closeChangePasswordModal();
				break;
			}
		}
	});
}

/* ═══════════════════════════════════════════════
   GLOW PULSE ON CONSTITUTION BUTTON
   ═══════════════════════════════════════════════ */

function initGlowPulse() {
	const btn = document.querySelector('.constitution-btn');
	if (btn) btn.classList.add('glow-pulse');
}

/* ═══════════════════════════════════════════════
   SOUND TOGGLE INIT
   ═══════════════════════════════════════════════ */

function initSoundToggle() {
	const btn = document.getElementById('sound-toggle');
	if (!btn) return;
	btn.textContent = soundEnabled ? '🔊' : '🔇';
	btn.title = soundEnabled ? 'Mute sounds' : 'Unmute sounds';
}

/* ═══════════════════════════════════════════════
   USER DROPDOWN — close on outside click
   ═══════════════════════════════════════════════ */

function initUserMenu() {
	const menu = document.getElementById('user-menu');
	const avatar = document.getElementById('user-avatar');
	const dropdown = menu ? menu.querySelector('.user-dropdown') : null;
	if (!menu || !avatar || !dropdown) return;

	// Click on avatar toggles dropdown on mobile/touch
	avatar.addEventListener('click', (e) => {
		e.stopPropagation();
		const isOpen = dropdown.style.opacity === '1';
		if (isOpen) {
			dropdown.style.opacity = '';
			dropdown.style.visibility = '';
			dropdown.style.transform = '';
		} else {
			dropdown.style.opacity = '1';
			dropdown.style.visibility = 'visible';
			dropdown.style.transform = 'translateY(0) scale(1)';
		}
	});

	// Close when clicking outside
	document.addEventListener('click', (e) => {
		if (!menu.contains(e.target)) {
			dropdown.style.opacity = '';
			dropdown.style.visibility = '';
			dropdown.style.transform = '';
		}
	});

	// Close dropdown when any item inside is clicked
	dropdown.querySelectorAll('.dropdown-item').forEach(item => {
		item.addEventListener('click', () => {
			dropdown.style.opacity = '';
			dropdown.style.visibility = '';
			dropdown.style.transform = '';
		});
	});
}

/* ═══════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════ */	document.addEventListener('DOMContentLoaded', () => {
	initSplashScreen();
	createParticles();
	initSoundToggle();
	initUserMenu();
	initHeaderScroll();
	initScrollReveals();
	initScrollProgress();
	initBackToTop();
	initRippleButtons();
	initEscKey();
	initGlowPulse();

	// Animate members list after splash screen finishes
	setTimeout(() => animateMembersList(), 2300);
});
