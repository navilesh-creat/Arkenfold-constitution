import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
	getAuth,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	updateProfile,
	onAuthStateChanged,
	sendEmailVerification,
	sendPasswordResetEmail
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
let pendingSignupData = null; // temporarily holds {username, email} before confirmation
let skipAutoLogin = false; // prevents sign-in loop right after signup

/* ═══════════════════════════════════════════════
   PAGE NAVIGATION (with transitions)
   ═══════════════════════════════════════════════ */

window.showConstitution = function () {
	const home = document.getElementById('home');
	const constitution = document.getElementById('constitution');

	home.style.opacity = '0';
	home.style.transform = 'translateY(-20px)';

	setTimeout(() => {
		home.classList.remove('active');
		home.style.opacity = '';
		home.style.transform = '';

		constitution.classList.add('active');
		window.scrollTo({ top: 0, behavior: 'instant' });

		setTimeout(() => {
			document.getElementById('const-content').classList.add('active');
			initScrollReveals();
		}, 50);
	}, 400);
};

window.showHome = function () {
	const home = document.getElementById('home');
	const constitution = document.getElementById('constitution');
	const constContent = document.getElementById('const-content');

	constContent.classList.remove('active');
	constitution.style.opacity = '0';
	constitution.style.transform = 'translateY(20px)';

	setTimeout(() => {
		constitution.classList.remove('active');
		constitution.style.opacity = '';
		constitution.style.transform = '';

		home.classList.add('active');
		window.scrollTo({ top: 0, behavior: 'instant' });

		animateHomeElements();
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
		strengthText.textContent = "";
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
   UTILITY
   ═══════════════════════════════════════════════ */

function generateTempPassword() {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
	let password = '';
	for (let i = 0; i < 20; i++) {
		password += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return password;
}

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
		document.getElementById("auth-error").style.color = "#e05a5a";
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

	btnText.textContent = 'Creating account...';
	btnSpinner.style.display = 'inline-block';
	submitBtn.style.opacity = '0.7';
	submitBtn.style.pointerEvents = 'none';

	const { username, email } = pendingSignupData;
	const tempPassword = generateTempPassword();

	createUserWithEmailAndPassword(auth, email, tempPassword)
		.then((cred) => {
			return updateProfile(cred.user, { displayName: username }).then(() => cred.user);
		})
		.then((user) => {
			localStorage.setItem('pendingPasswordSetup', JSON.stringify({
				email: user.email,
				tempPassword: tempPassword
			}));

			return sendEmailVerification(user);
		})
		.then(() => {
			return signOut(auth);
		})
		.then(() => {
			// Close confirmation modal
			closeEmailConfirmModal();

			// Prevent the onAuthStateChanged auto-login loop
			skipAutoLogin = true;

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
			authError.innerHTML = 'Verification email sent! Please check your inbox, verify your email, then come back to set your password.';

			// Reset confirm button
			btnText.textContent = '✓ Yes, this is my email';
			btnSpinner.style.display = 'none';
			submitBtn.style.opacity = '1';
			submitBtn.style.pointerEvents = 'auto';

			pendingSignupData = null;
		})
		.catch((err) => {
			errorBox.textContent = err.message.replace('Firebase: ', '');
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
			errorBox.textContent = err.message.replace("Firebase: ", "");
			btnText.textContent = "Send Reset Link";
			btnSpinner.style.display = "none";
			submitBtn.style.opacity = "1";
			submitBtn.style.pointerEvents = "auto";
		});
};

/* ═══════════════════════════════════════════════
   SIGNUP - EMAIL FIRST FLOW
   
   How it works:
   1. User enters username + email (NO password shown)
   2. Account is created with a random temp password
   3. REAL verification email is sent via Firebase
   4. Temp password is saved in localStorage
   5. User is signed out
   6. User verifies email via the link in the email
   7. User comes back → auto signs in → sees password setup
   8. User sets real password → password is updated
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
	errorBox.style.color = "#e05a5a";

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
			.then((cred) => {
				if (!cred.user.emailVerified) {
					const unverifiedUser = cred.user;
					signOut(auth).then(() => {
						errorBox.style.color = "#e05a5a";
						errorBox.innerHTML = "Please verify your email first. Check your inbox for the verification link. <a href='#' id='resend-verification' style='color: #d4af37; text-decoration: underline; cursor: pointer;'>Resend verification email</a>";
						resetSubmitBtn();
						document.getElementById('resend-verification').addEventListener('click', (e) => {
							e.preventDefault();
							sendEmailVerification(unverifiedUser).then(() => {
								errorBox.style.color = "#4caf50";
								errorBox.textContent = "Verification email resent! Please check your inbox.";
							}).catch((err) => {
								errorBox.style.color = "#e05a5a";
								errorBox.textContent = "Failed to resend: " + err.message;
							});
						});
					});
					return;
				}
				window.closeAuthModal();
			})
			.catch((err) => {
				errorBox.textContent = err.message.replace("Firebase: ", "");
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

	// Get pending data from localStorage
	const pending = JSON.parse(localStorage.getItem('pendingPasswordSetup'));
	if (!pending) {
		errorBox.textContent = "Session expired. Please sign up again.";
		return;
	}

	btnText.textContent = "Setting Password...";
	btnSpinner.style.display = "inline-block";
	submitBtn.style.opacity = "0.7";
	submitBtn.style.pointerEvents = "none";

	// Sign in with temp password, then update to real password
	signInWithEmailAndPassword(auth, pending.email, pending.tempPassword)
		.then((cred) => {
			return cred.user.updatePassword(newPassword);
		})
		.then(() => {
			localStorage.removeItem('pendingPasswordSetup');
			closePasswordSetupModal();
			// User is now signed in with their real password
		})
		.catch((err) => {
			errorBox.textContent = err.message.replace("Firebase: ", "");
			btnText.textContent = "Set Password";
			btnSpinner.style.display = "none";
			submitBtn.style.opacity = "1";
			submitBtn.style.pointerEvents = "auto";
		});
};

window.logout = function () {
	signOut(auth);
};

/* ═══════════════════════════════════════════════
   AUTH STATE - Detect verified users who need
   to set their password after email verification
   ═══════════════════════════════════════════════ */

onAuthStateChanged(auth, (user) => {
	const loginBtn = document.getElementById("login-btn");
	const logoutBtn = document.getElementById("logout-btn");
	const greeting = document.getElementById("user-greeting");
	const membersSection = document.getElementById("members-only");

	if (user) {
		user.reload().catch(() => {}).then(() => {
		// Check if this user has a pending password setup
		const pending = JSON.parse(localStorage.getItem('pendingPasswordSetup'));
		if (pending && user.email === pending.email && user.emailVerified) {
			// Email verified and pending password setup → open password setup modal
			setTimeout(() => {
				openPasswordSetupModal();
			}, 500);
		} else if (pending && user.email === pending.email && !user.emailVerified) {
			// Not verified yet → sign out
			signOut(auth);
			return;
		}

		loginBtn.style.display = "none";
		logoutBtn.style.display = "inline-block";
		greeting.style.display = "inline-block";
		greeting.textContent = "Welcome, " + (user.displayName || user.email.split("@")[0]);
		if (membersSection) membersSection.style.display = "block";
		});
	} else {
		// Not signed in — check if there's a pending password setup that needs completing
		const pending = JSON.parse(localStorage.getItem('pendingPasswordSetup'));
		if (pending && !skipAutoLogin) {
			// Auto sign in with temp password so the auth state listener
			// can detect verification status and open password setup
			signInWithEmailAndPassword(auth, pending.email, pending.tempPassword)
				.then((cred) => {
					if (!cred.user.emailVerified) {
						// Not verified yet → sign back out
						signOut(auth);
					}
					// If verified, onAuthStateChanged fires again and opens password setup
				})
				.catch(() => {
					// Temp password expired or invalid — clear pending data
					localStorage.removeItem('pendingPasswordSetup');
				});
		} else {
			skipAutoLogin = false; // reset after one cycle so future page loads still auto-login
		}

		loginBtn.style.display = "inline-block";
		logoutBtn.style.display = "none";
		greeting.style.display = "none";
		if (membersSection) membersSection.style.display = "none";
	}
});

/* ═══════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
	createParticles();
	initHeaderScroll();
	initScrollReveals();
	animateHomeElements();
});
