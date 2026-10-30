# Namma Kelasa (ನಮ್ಮ ಕೆಲಸ) - Direct Local Marketplace

[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v12-ffca28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Direct Hire • Fair Wages • Zero Commission**  
> An open, community-driven marketplace connecting skilled local trade workers (electricians, plumbers, carpenters, painters, drivers, house cleaners, mechanics) directly with customers across Karnataka & India. Available in **ಕನ್ನಡ (Kannada)** and **English**.

---

## 🌟 Key Features

- 🇮🇳 **Bilingual First**: Seamless 1-tap switching between **ಕನ್ನಡ (Kannada)** and **English** across all screens, forms, and alerts.
- 🤝 **Zero-Commission Direct Connect**: Customers contact workers directly via phone call or formatted WhatsApp messages—no cuts taken from hard-working tradespeople.
- 📍 **Interactive Map & Radius Search**: Leaflet + OpenStreetMap integration allowing customers to locate skilled trade pros near their live GPS coordinates.
- 📱 **PWA & Standalone Android APK**: 
  - Installable as a Progressive Web App directly from mobile browsers.
  - In-app direct download for the standalone Android APK (`/namma-kelasa.apk`) with QR code sharing and step-by-step install guide.
- 🔐 **Dual Authentication**:
  - **Phone OTP Authentication** via Firebase (ideal for Indian mobile users without active email).
  - **Google One-Tap Sign-In** for fast authentication.
- 👷 **Dual Role Support**:
  - **Customer Portal**: Search by skill, review work portfolios, compare hourly rates, request quotes, and submit verified ratings.
  - **Worker Dashboard**: Manage trade profiles, showcase prior project photos, track inquiries, and monitor client feedback.
- 🧾 **Client Invoicing & Estimates**: In-browser PDF generation powered by `jsPDF` for instant quotes, job estimations, and payment receipts.
- 📊 **Real-time Firestore Sync**: Instant updates for worker profiles, reviews, and verified status with offline-first caching.

---

## 🛠️ Tech Stack

| Domain | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/) |
| **Bundler & Tooling** | [Vite 6](https://vitejs.dev/) |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`) |
| **Icons & Animations** | [Lucide React](https://lucide.dev/), [Framer Motion](https://motion.dev/) |
| **Backend & Database** | [Firebase v12](https://firebase.google.com/) (Authentication & Cloud Firestore) |
| **Maps & Geolocation** | [Leaflet](https://leafletjs.com/) with OpenStreetMap tiles |
| **PDF & QR Utilities** | [jsPDF](https://github.com/parallax/jsPDF), [QRCode](https://github.com/soldair/node-qrcode) |
| **Mobile / PWA** | `vite-plugin-pwa`, Web App Manifest, Service Worker, Android TWA packaging |

---

## 📂 Project Structure

```text
├── public/
│   ├── favicon.ico
│   ├── icon.svg
│   ├── manifest.json              # Web App Manifest for mobile install
│   ├── namma-kelasa.apk           # Standalone Android APK for direct download
│   ├── namma-kelasa.apk.txt       # Instructions for placing signed APK builds
│   ├── pwa-192x192.png            # PWA icons
│   ├── pwa-512x512.png
│   └── service-worker.js          # Offline cache & asset worker
├── src/
│   ├── components/                # Modular UI components
│   │   ├── AuthModal.tsx          # Phone OTP & Google Login modal
│   │   ├── Header.tsx             # Navigation & language switcher
│   │   ├── Hero.tsx               # Banner with search & direct APK download
│   │   ├── InvoiceModal.tsx       # jsPDF invoice/receipt generator
│   │   ├── MapView.tsx            # Leaflet interactive map with pro pins
│   │   ├── PWAInstallButton.tsx   # PWA prompt & Android APK modal with QR code
│   │   ├── WorkerCard.tsx         # Pro showcase card with direct call/WhatsApp
│   │   └── WorkerProfileModal.tsx # Full portfolio & booking modal
│   ├── context/                   # React Contexts (Language, Auth)
│   ├── firebase.ts                # Firebase Auth & Firestore client with error handling
│   ├── types.ts                   # TypeScript interfaces (Worker, Review, Category)
│   ├── App.tsx                    # Main app container
│   ├── index.css                  # Tailwind CSS v4 entry point
│   └── main.tsx                   # React root entry point
├── firebase-applet-config.json    # Firebase project credentials
├── firestore.rules                # Production security rules for Firestore
├── vercel.json                    # SPA rewrite configuration for Vercel deployment
├── vite.config.ts                 # Vite bundler & PWA plugin config
└── package.json                   # Scripts and project dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js 18 or higher installed:
```bash
node -v   # v18.0.0 or higher
npm -v    # v9.0.0 or higher
```

### 2. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/namma-kelasa.git
cd namma-kelasa
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Firebase
The app connects to Firebase via `firebase-applet-config.json` in the root folder. You can use your own Firebase project credentials:

```json
{
  "projectId": "your-project-id",
  "appId": "your-app-id",
  "apiKey": "your-api-key",
  "authDomain": "your-project-id.firebaseapp.com",
  "firestoreDatabaseId": "(default)",
  "storageBucket": "your-project-id.firebasestorage.app",
  "messagingSenderId": "your-sender-id"
}
```

> **Important**: Never commit real secret production admin keys. The Web SDK credentials above are client-safe public identifiers.

### 5. Run the Local Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 6. Build for Production
```bash
npm run build
```
This produces optimized production assets inside the `dist/` directory.

---

## 🔑 Crucial Firebase Configuration: Authorized Domains

When deploying to Vercel or testing on mobile devices, if you encounter:
```text
Firebase: Error (auth/unauthorized-domain)
```
This means your deployment URL has not yet been whitelisted in Firebase Authentication.

### How to Fix:
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project and go to **Build** > **Authentication** > **Settings** tab.
3. Click on **Authorized domains**.
4. Click **Add domain** and enter your production and staging domains:
   - `localhost`
   - `nma-kelsa.vercel.app` (or your custom domain)
5. Save changes. Phone OTP and Google Sign-In will now work seamlessly across both web and mobile APK!

---

## 🌐 Deployment

### Option 1: Vercel (Recommended & Easiest)
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Vercel automatically detects **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. The included `vercel.json` ensures client-side routing works without 404 errors on reload.

### Option 2: Firebase Hosting
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in and initialize:
   ```bash
   firebase login
   firebase init hosting
   ```
   - Select `dist` as public directory.
   - Configure as single-page app: `Yes`.
3. Build and deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## 📱 Android APK & TWA Packaging

Namma Kelasa is configured for standalone Android distribution via **Trusted Web Activity (TWA)**:
1. Generate an Android package using [PWABuilder](https://www.pwabuilder.com/) or Bubblewrap CLI pointing to your live URL (e.g., `https://nma-kelsa.vercel.app`).
2. After downloading the signed release `.apk`, copy it into the `public/` directory:
   ```bash
   cp /path/to/signed-release.apk public/namma-kelasa.apk
   ```
3. Users can now tap **"Download Android APK"** on the website to download and install the app directly on their phones.

---

## 📤 Pushing to GitHub (Step-by-Step)

Run the following commands in your project terminal:

```bash
# 1. Initialize git if not already initialized
git init

# 2. Stage all project files
git add .

# 3. Create your initial commit
git commit -m "feat: initial commit of Namma Kelasa marketplace"

# 4. Set main as default branch
git branch -M main

# 5. Connect to your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>.git

# 6. Push to GitHub
git push -u origin main
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ for skilled local workers and communities across Karnataka & India.
</p>
