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

/* ═══════════════════════════════════════════════
   PAGE NAVIGATION (with transitions)
   ═══════════════════════════════════════════════ */

window.showConstitution = function () {
	const home = document.getElementById('home');
	const constitution = document.getElementById('constitution');

	// Fade out home
	home.style.opacity = '0';
	home.style.transform = 'translateY(-20px)';

	setTimeout(() => {
		home.classList.remove('active');
		home.style.opacity = '';
		home.style.transform = '';

		constitution.classList.add('active');
		window.scrollTo({ top: 0, behavior: 'instant' });

		// Trigger constitution reveal
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

	// Fade out constitution
	constContent.classList.remove('active');
	constitution.style.opacity = '0';
	constitution.style.transform = 'translateY(20px)';

	setTimeout(() => {
		constitution.classList.remove('active');
		constitution.style.opacity = '';
		constitution.style.transform = '';

		home.classList.add('active');
		window.scrollTo({ top: 0, behavior: 'instant' });

		// Re-animate home elements
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
   AUTH MODAL
   ═══════════════════════════════════════════════ */

window.openAuthModal = function () {
	const modal = document.getElementById("auth-modal");
	modal.style.display = "flex";
};

window.closeAuthModal = function () {
	const modal = document.getElementById("auth-modal");
	const box = modal.querySelector('.auth-modal-box');

	// Animate out
	box.style.animation = 'modalBoxOut 0.25s ease forwards';
	setTimeout(() => {
		modal.style.display = "none";
		box.style.animation = '';
		document.getElementById("auth-error").textContent = "";
		document.getElementById("auth-error").style.color = "#e05a5a";
		document.getElementById("auth-username").value = "";
		document.getElementById("auth-email").value = "";
		document.getElementById("auth-password").value = "";
	}, 250);
};

window.toggleAuthMode = function (e) {
	e.preventDefault();
	mode = mode === "login" ? "signup" : "login";
	document.getElementById("auth-modal-title").textContent = mode === "login" ? "Login" : "Sign Up";
	document.getElementById("auth-submit-btn").textContent = mode === "login" ? "Login" : "Create Account";
	document.getElementById("auth-toggle-label").textContent = mode === "login" ? "Don't have an account?" : "Already have an account?";
	document.getElementById("auth-toggle-link").textContent = mode === "login" ? "Sign up" : "Login";
	document.getElementById("auth-username").style.display = mode === "signup" ? "block" : "none";
	document.getElementById("auth-error").textContent = "";

	// Show/hide forgot password link based on mode
	const forgotPasswordLink = document.getElementById("forgot-password-link");
	if (forgotPasswordLink) {
		forgotPasswordLink.style.display = mode === "login" ? "inline-block" : "none";
	}
};

window.openResetPasswordModal = function () {
	const authModal = document.getElementById("auth-modal");
	const resetModal = document.getElementById("reset-password-modal");

	// Close auth modal
	authModal.style.display = "none";

	// Open reset modal
	resetModal.style.display = "flex";
};

window.closeResetPasswordModal = function () {
	const modal = document.getElementById("reset-password-modal");
	const box = modal.querySelector('.auth-modal-box');

	// Animate out
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

	errorBox.textContent = "";
	successBox.textContent = "";

	if (!email) {
		errorBox.textContent = "Please enter your email address.";
		return;
	}

	// Loading state
	submitBtn.textContent = "Sending...";
	submitBtn.style.opacity = "0.7";
	submitBtn.style.pointerEvents = "none";

	sendPasswordResetEmail(auth, email)
		.then(() => {
			successBox.textContent = "Password reset email sent! Check your inbox.";
			submitBtn.textContent = "Send Reset Link";
			submitBtn.style.opacity = "1";
			submitBtn.style.pointerEvents = "auto";
		})
		.catch((err) => {
			errorBox.textContent = err.message.replace("Firebase: ", "");
			submitBtn.textContent = "Send Reset Link";
			submitBtn.style.opacity = "1";
			submitBtn.style.pointerEvents = "auto";
		});
};

window.submitAuth = function () {
	const username = document.getElementById("auth-username").value.trim();
	const email = document.getElementById("auth-email").value.trim();
	const password = document.getElementById("auth-password").value;
	const errorBox = document.getElementById("auth-error");
	const submitBtn = document.getElementById("auth-submit-btn");

	errorBox.textContent = "";

	if (!email || !password) {
		errorBox.textContent = "Please fill in both fields.";
		return;
	}
	if (mode === "signup" && !username) {
		errorBox.textContent = "Please choose a username.";
		return;
	}

	// Loading state
	submitBtn.textContent = mode === "login" ? "Logging in..." : "Creating...";
	submitBtn.style.opacity = "0.7";
	submitBtn.style.pointerEvents = "none";

	if (mode === "login") {
		signInWithEmailAndPassword(auth, email, password)
			.then((cred) => {
				// Check if email is verified
				if (!cred.user.emailVerified) {
					// Save user reference for resend
					const unverifiedUser = cred.user;
					// Sign out the user since email is not verified
					signOut(auth).then(() => {
						errorBox.style.color = "#e05a5a";
						errorBox.innerHTML = "Please verify your email first. Check your inbox for the verification link. <a href='#' id='resend-verification' style='color: #d4af37; text-decoration: underline; cursor: pointer;'>Resend verification email</a>";
						resetSubmitBtn();
						// Add resend functionality
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
		createUserWithEmailAndPassword(auth, email, password)
			.then((cred) => {
				// Set display name
				return updateProfile(cred.user, { displayName: username }).then(() => cred.user);
			})
			.then((user) => {
				// Send verification email
				return sendEmailVerification(user).then(() => user);
			})
			.then((user) => {				// Sign out and show verification message
			signOut(auth);
			const errorBox = document.getElementById("auth-error");
			errorBox.style.color = "#4caf50";
			errorBox.innerHTML = "Account created! A verification link has been sent to <strong>" + user.email + "</strong>. Please verify your email before logging in.";
			resetSubmitBtn();
			})
			.catch((err) => {
				errorBox.style.color = "#e05a5a";
				errorBox.textContent = err.message.replace("Firebase: ", "");
				resetSubmitBtn();
			});
	}
};

function resetSubmitBtn() {
	const submitBtn = document.getElementById("auth-submit-btn");
	submitBtn.textContent = mode === "login" ? "Login" : "Create Account";
	submitBtn.style.opacity = "1";
	submitBtn.style.pointerEvents = "auto";
}

window.logout = function () {
	signOut(auth);
};

onAuthStateChanged(auth, (user) => {
	const loginBtn = document.getElementById("login-btn");
	const logoutBtn = document.getElementById("logout-btn");
	const greeting = document.getElementById("user-greeting");
	const membersSection = document.getElementById("members-only");

	if (user) {
		loginBtn.style.display = "none";
		logoutBtn.style.display = "inline-block";
		greeting.style.display = "inline-block";
		greeting.textContent = "Welcome, " + (user.displayName || user.email.split("@")[0]);
		if (membersSection) membersSection.style.display = "block";
	} else {
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
