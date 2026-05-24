# 🚀 GPOS Firebase Deployment Guide
## Complete Step-by-Step Instructions (Feb 2026)

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Phase 1: Firebase Console Setup](#phase-1-firebase-console-setup)
3. [Phase 2: Local Project Preparation](#phase-2-local-project-preparation)
4. [Phase 3: Building & Deployment](#phase-3-building--deployment)
5. [Phase 4: Firestore Security Setup](#phase-4-firestore-security-setup)
6. [Phase 5: First User Setup](#phase-5-first-user-setup)
7. [Verification Checklist](#verification-checklist)
8. [Troubleshooting](#troubleshooting)
9. [Post-Deployment Maintenance](#post-deployment-maintenance)

---

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js** v18+ installed ([download here](https://nodejs.org/))
- ✅ **npm** (comes with Node.js)
- ✅ **Git** installed
- ✅ **Google Account** (for Firebase)
- ✅ **GPOS repository** cloned locally
- ✅ **Code editor** (VS Code recommended)
- ✅ **Terminal/Command prompt** access
- ✅ Active internet connection

**Verify Prerequisites:**
```bash
node --version      # Should show v18+
npm --version       # Should show 8+
git --version       # Should show 2+
```

---

## Phase 1: Firebase Console Setup

### Step 1.1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a Project"** (blue button)
3. Enter project name: `gpos` (or your preferred name)
4. Accept the default settings
5. Click **"Create Project"**
6. Wait for project creation (1-2 minutes)

**Expected Result:** You'll see your Firebase project dashboard

---

### Step 1.2: Register Web App

1. In Firebase Console, click the **Web icon `</>`** (or if you see it, skip to step 2)
2. Click **"Add App"** → **"Web"**
3. Enter app nickname: `GPOS Web App`
4. Check "Also set up Firebase Hosting for this app" ✅
5. Click **"Register App"**

**You'll now see Firebase SDK setup code:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "gpos-abc123.firebaseapp.com",
  projectId: "gpos-abc123",
  storageBucket: "gpos-abc123.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

**⚠️ IMPORTANT:** Copy this entire object - you'll need it in Phase 2

---

### Step 1.3: Enable Authentication

1. In Firebase left sidebar, click **Build** → **Authentication**
2. Click **"Get Started"**
3. Click **"Email/Password"** option
4. Toggle **"Enable"** switch ✅
5. Click **"Save"**

**Result:** Email/Password authentication is now active

---

### Step 1.4: Create Firestore Database

1. In Firebase left sidebar, click **Build** → **Firestore Database**
2. Click **"Create Database"**
3. In the popup:
   - Select **"Production Mode"** (not test mode)
   - Click **"Next"**
4. Choose your region (closer to your target users is better)
   - Example: `us-east1` for USA, `europe-west1` for Europe
5. Click **"Enable"**

**Wait:** Database initialization takes 1-2 minutes

**Result:** Empty Firestore database is created

---

### Step 1.5: Generate Private Key (for admin tasks)

1. Click **⚙️ (Settings icon)** → **Project Settings**
2. Click **"Service Accounts"** tab
3. Click **"Generate New Private Key"** button
4. A JSON file will download - **keep it safe!**
5. (Optional) You can store this securely for future CLI use

**Note:** You don't need this for basic deployment, but it's useful for admin operations

---

## Phase 2: Local Project Preparation

### Step 2.1: Clone & Install GPOS

```bash
# Navigate to your projects folder
cd ~/projects  # or your preferred location

# Clone the repository
git clone https://github.com/Silverado313/gpos.git
cd gpos

# Verify you're in the right directory
pwd  # Should show: .../gpos
ls   # Should show: package.json, src/, public/, etc.

# Install all dependencies
npm install

# Wait for completion (2-5 minutes)
# You should see: "added X packages"
```

**Result:** All dependencies are installed in `node_modules/`

---

### Step 2.2: Create Environment File

1. Open the `gpos` folder in VS Code or your editor
2. Look for `env.example` file
3. Create a new file named `.env` in the same directory

**In `.env` file, paste your Firebase config:**

```env
# Firebase Configuration
# From your Firebase Console (Project Settings > Web App)

VITE_FIREBASE_API_KEY=AIzaSyD...your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=gpos-abc123.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gpos-abc123
VITE_FIREBASE_STORAGE_BUCKET=gpos-abc123.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

**⚠️ CRITICAL:** 
- Replace values with YOUR Firebase config from Step 1.2
- DO NOT commit this file to git!
- `.env` is already in `.gitignore`

**Verify file is created:**
```bash
cat .env  # Should display your config
```

---

### Step 2.3: Test Local Development (Optional)

```bash
# Start dev server
npm run dev

# You should see:
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help

# Open in browser: http://localhost:5173/
```

**Expected Result:** GPOS login page loads in browser

**To stop dev server:** Press `Ctrl + C` in terminal

---

## Phase 3: Building & Deployment

### Step 3.1: Install Firebase CLI

```bash
# Install globally (one-time only)
npm install -g firebase-tools

# Verify installation
firebase --version  # Should show version 12+
```

---

### Step 3.2: Login to Firebase

```bash
# Opens browser for authentication
firebase login

# Follow browser prompts:
# 1. Click "Allow" for Firebase CLI access
# 2. Close browser tab when complete
# 3. Return to terminal

# Verify login
firebase list  # Should show your Firebase project
```

---

### Step 3.3: Connect to Your Firebase Project

```bash
# Initialize Firebase in your project
firebase init hosting

# Prompts:
# ? What do you want to use as your public directory? dist
# ? Configure as a single-page app? Yes (y)
# ? Set up automatic builds and deploys? Use defaults (n)
# ? Overwrite dist/index.html? No (n)

# Result: firebase.json file is configured
```

---

### Step 3.4: Build for Production

```bash
# Create optimized production build
npm run build

# Wait for completion (1-2 minutes)
# You should see:
# ✓ 150 modules transformed
# dist/ directory now contains:
#   - index.html
#   - assets/ folder
#   - sw.js (service worker)
```

**Verify build:**
```bash
ls -la dist/  # Should show index.html and assets folder
```

---

### Step 3.5: Deploy to Firebase Hosting

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# You'll see:
# ...
# ✔  Deploy complete!
# Project Console: https://console.firebase.google.com/project/{projectId}
# Hosting URL: https://{projectId}.web.app
```

**⏱️ Time:** Deployment takes 1-3 minutes

**🎉 Your app is now live!** Open the Hosting URL in your browser

---

## Phase 4: Firestore Security Setup

### Step 4.1: Update Firestore Security Rules

1. Go to Firebase Console → **Firestore Database**
2. Click **"Rules"** tab
3. **Delete the default rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow authenticated users to read/write their own user doc
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Products: All authenticated users can read, only admins can write
    match /products/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Inventory: Similar to products
    match /inventory/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Sales: Authenticated users can read their own sales
    match /sales/{saleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager', 'cashier'];
    }
    
    // Customers: All authenticated can read/write
    match /customers/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Settings: Only admins can write
    match /settings/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Employees: Only admins
    match /employees/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Catch-all: Deny by default
    match /{documents=**} {
      allow read, write: if false;
    }
  }
}
```

4. Click **"Publish"** button

**Result:** Firestore is now secured with role-based rules

---

## Phase 5: First User Setup

### Step 5.1: Register First Admin Account

1. Open your deployed app: `https://{projectId}.web.app`
2. Click **"Sign Up"** button
3. Enter credentials:
   - Email: `admin@business.com`
   - Password: Create a strong password
   - Confirm Password
4. Click **"Sign Up"**
5. You'll see **"Pending Approval"** message

**⚠️ This is expected!** You need to approve yourself

---

### Step 5.2: Approve Your Account in Firestore

1. Go to Firebase Console → **Firestore Database**
2. Click **"Collections"** tab
3. Click **"users"** collection
4. Find your user (by email)
5. Click on the document
6. In the `role` field, change from `pending` to `admin`
7. Click **"Update"** button

**Result:** Refresh your app and you're now logged in as admin!

---

### Step 5.3: Configure Business Settings

1. Log in to your GPOS app
2. Click **"Settings"** (bottom of sidebar)
3. Fill in:
   - Business Name: Your business name
   - Tax Rate: Your tax percentage (e.g., 15)
   - Tax Label: GST, VAT, etc.
   - Currency: PKR, USD, etc.
   - Receipt Footer: Thank you message
4. Click **"Save"**

**Result:** Your business is configured!

---

## Verification Checklist

- [ ] Firebase project created
- [ ] Web app registered
- [ ] Authentication (Email/Password) enabled
- [ ] Firestore database created
- [ ] Environment file (.env) created with correct Firebase config
- [ ] Dependencies installed (`npm install`)
- [ ] Firebase CLI installed globally
- [ ] Logged into Firebase CLI (`firebase login`)
- [ ] Project built for production (`npm run build`)
- [ ] Deployed to Firebase (`firebase deploy --only hosting`)
- [ ] Firestore security rules published
- [ ] First admin account created
- [ ] Admin account role set to "admin" in Firestore
- [ ] Business settings configured
- [ ] Can log in with admin account
- [ ] Can access dashboard and all features

---

## Troubleshooting

### ❌ Error: "Cannot find module 'react'"
**Solution:**
```bash
npm install  # Re-install dependencies
```

---

### ❌ Error: "VITE_FIREBASE_API_KEY is undefined"
**Solution:**
1. Check `.env` file exists in root directory
2. Verify all Firebase config values are correct
3. Restart dev server: `npm run dev`

---

### ❌ Error: "firebase: command not found"
**Solution:**
```bash
npm install -g firebase-tools  # Install Firebase CLI globally
firebase --version             # Verify installation
```

---

### ❌ Error: "dist folder not found" during deployment
**Solution:**
```bash
npm run build  # Build first
firebase deploy --only hosting
```

---

### ❌ Deployed app crashes on load
**Solution:**
1. Check browser console for errors (F12 → Console tab)
2. Verify Firestore rules are correctly published
3. Verify Firebase config in `.env` is correct

---

### ❌ "Pending Approval" stuck even after setting role to admin
**Solution:**
```bash
# Restart the app completely
# 1. Close the browser tab
# 2. Clear browser cache (Ctrl+Shift+Delete)
# 3. Re-open the app URL
# 4. Log in again
```

---

### ❌ Sales/Products not saving
**Solution:**
1. Check Firestore security rules are published
2. In Firebase console, check for errors in the "Real-time Database" section
3. Ensure user role is 'admin' or 'manager'

---

## Post-Deployment Maintenance

### Weekly Checklist
- [ ] Monitor Firestore usage (Firebase Console → Usage)
- [ ] Check for any error logs (Firebase Console → Logs)
- [ ] Backup important data

### Monthly
- [ ] Review and update Firestore security rules
- [ ] Check if any dependencies need updates: `npm outdated`
- [ ] Review user access and roles

### Quarterly
- [ ] Performance review: Check Firestore reads/writes
- [ ] Consider optimization if hitting Free Tier limits
- [ ] Plan upgrades if needed

---

### Firebase Free Tier Limits (2026)

| Feature | Free Tier Limit |
|---------|-----------------|
| Firestore Storage | 1 GB |
| Firestore Reads | 50,000/day |
| Firestore Writes | 20,000/day |
| Firestore Deletes | 20,000/day |
| Realtime Database | 1 GB |
| Cloud Hosting | 1 GB/month |
| Concurrent Connections | 100 |

**Tip:** Most small businesses stay well within these limits. Monitor your usage in the Firebase Console to track.

---

### Upgrade to Paid Plan (if needed)

If exceeding Free Tier limits:

1. Go to Firebase Console → **Billing**
2. Click **"Upgrade to Blaze Plan"**
3. Add payment method
4. You'll only pay for usage beyond free tier limits

**Estimated costs:**
- Firestore: $0.06 per 100,000 reads
- Hosting: $0.15 GB/month (after 10GB free)

---

## Important Security Notes

### Never Commit API Keys ⚠️
- ✅ `.env` file is in `.gitignore` - safe
- ❌ DO NOT upload Firebase config to GitHub

### Firestore Security Rules are Critical
- Default rules are NOT secure
- Always update to role-based rules (provided above)
- Test rules thoroughly before deploying to production

### Regular Backups
```bash
# Export Firestore data
firebase firestore:export gs://your-bucket/backups/backup-date

# Restore from backup
firebase firestore:import gs://your-bucket/backups/backup-date
```

---

## Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server
npm run lint            # Check code quality

# Production
npm run build           # Build for production
firebase deploy --only hosting  # Deploy to Firebase

# Firebase CLI
firebase login          # Authenticate
firebase logout         # Sign out
firebase list           # List projects
firebase open           # Open in browser
firebase emulators:start # Start local emulator
```

---

## Need Help?

- 📖 **Firebase Docs:** https://firebase.google.com/docs
- 💬 **Firebase Community:** https://stackoverflow.com/questions/tagged/firebase
- 🐛 **Report Bugs:** Open an issue on GitHub
- 📧 **Email Support:** Your project's Firebase support

---

## Success! 🎉

Your GPOS system is now live on Firebase! Start:

1. Adding products in **Products** section
2. Creating inventory records
3. Adding staff in **Employees**
4. Processing sales with the **POS** screen
5. Viewing analytics in the **Dashboard**

**Welcome to GPOS Production!** 🚀

---

*Last Updated: February 24, 2026*
*Version: 1.0.0 Production Ready*
