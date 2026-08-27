import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
	getAuth,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	updateProfile,
	onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

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

// Page navigation
window.showConstitution = function () {
	document.getElementById('home').classList.remove('active');
	document.getElementById('constitution').classList.add('active');
	window.scrollTo(0, 0);
	setTimeout(() => document.getElementById('const-content').classList.add('active'), 100);
};

window.showHome = function () {
	document.getElementById('constitution').classList.remove('active');
	document.getElementById('home').classList.add('active');
	document.getElementById('const-content').classList.remove('active');
};

// Auth modal
window.openAuthModal = function () {
	document.getElementById("auth-modal").style.display = "flex";
};

window.closeAuthModal = function () {
	document.getElementById("auth-modal").style.display = "none";
	document.getElementById("auth-error").textContent = "";
	document.getElementById("auth-username").value = "";
	document.getElementById("auth-email").value = "";
	document.getElementById("auth-password").value = "";
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
};

window.submitAuth = function () {
	const username = document.getElementById("auth-username").value.trim();
	const email = document.getElementById("auth-email").value.trim();
	const password = document.getElementById("auth-password").value;
	const errorBox = document.getElementById("auth-error");
	errorBox.textContent = "";

	if (!email || !password) {
		errorBox.textContent = "Please fill in both fields.";
		return;
	}
	if (mode === "signup" && !username) {
		errorBox.textContent = "Please choose a username.";
		return;
	}

	if (mode === "login") {
		signInWithEmailAndPassword(auth, email, password)
			.then(() => window.closeAuthModal())
			.catch((err) => { errorBox.textContent = err.message.replace("Firebase: ", ""); });
	} else {
		createUserWithEmailAndPassword(auth, email, password)
			.then((cred) => updateProfile(cred.user, { displayName: username }).then(() => cred.user))
			.then((user) => {
				document.getElementById("user-greeting").textContent = "Welcome, " + user.displayName;
				window.closeAuthModal();
			})
			.catch((err) => { errorBox.textContent = err.message.replace("Firebase: ", ""); });
	}
};

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
