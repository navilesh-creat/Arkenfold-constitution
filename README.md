# Dominion of Arkenfold — Community Portal

The official website and community portal of the Dominion of Arkenfold. Built with vanilla HTML, CSS, and JavaScript with Firebase Authentication.

## Features

- **Home** — Hero section, announcements, council hierarchy, community stats
- **Constitution** — Full text with table of contents, search, reading progress, copy-link-to-section, print support
- **Council & Members** — Searchable/filterable member directory with role badges
- **Updates** — Announcement timeline with categories and pinned posts
- **Account** — Profile page with auth state management
- **Auth** — Email/password login, email-link signup with verification, password reset, password change
- **Theme** — Dark and light mode with local storage persistence
- **Responsive** — Desktop, tablet, and mobile layouts with mobile navigation overlay
- **Accessible** — ARIA labels, keyboard navigation, focus management, `prefers-reduced-motion` support

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/navilesh-creat/Arkenfold-constitution.git
cd Arkenfold-constitution
```

### 2. Firebase Configuration

The project uses Firebase Authentication. The configuration is in `main.js`:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "dominion-of-arkenfold.firebaseapp.com",
  projectId: "dominion-of-arkenfold",
  storageBucket: "dominion-of-arkenfold.firebasestorage.app",
  messagingSenderId: "189228678030",
  appId: "1:189228678030:web:..."
};
```

To use your own Firebase project:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project or select an existing one
3. Enable **Authentication** → **Email/Password** sign-in method
4. In Project Settings, find your web app config and replace the values in `main.js`

> **Note:** Firebase API keys for client-side apps are public by design. Security is enforced through Firebase Security Rules and Authentication settings, not by hiding the key.

### 3. Local Development

This is a static site — no build step required. Open `index.html` in a browser, or use a local server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

### 4. Email Verification Flow

The signup flow uses Firebase Email Link authentication:
1. User enters username + email (no password yet)
2. Firebase sends a verification link to that email
3. User clicks the link → account is created → password setup modal opens
4. User sets a password to complete registration

This ensures no Firebase account is created without a verified email.

## Deployment to GitHub Pages

### Option 1: From the `main` branch

1. Push your changes to `main`
2. Go to your repository → **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Select `main` branch and `/ (root)` folder
5. Click **Save**

Your site will be available at:
```
https://navilesh-creat.github.io/Arkenfold-constitution/
```

### Option 2: Using GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Firebase Console Checklist

- [ ] Authentication → Sign-in method → **Email/Password** enabled
- [ ] Authentication → Settings → Authorized domains → add your GitHub Pages domain
- [ ] Project Settings → General → Your apps → Web app registered

## File Structure

```
├── index.html          # Single-page application with all sections
├── styles.css          # Complete stylesheet with dark/light themes
├── main.js             # Application logic, routing, auth, features
├── favicon.png         # Site icon
├── robots.txt          # Search engine directives
├── sitemap.xml         # Site map for crawlers
└── README.md           # This file
```

## Browser Support

- Chrome/Edge 80+
- Firefox 78+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome for Android)

## License

© Dominion of Arkenfold. Designed and Developed by Navi.
