# Setup Guide — Fabric POS

Yeh guide step-by-step batati hai system kaise setup karna hai.

---

## Prerequisites (Pehle Yeh Install Karo)

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18 ya newer | nodejs.org |
| Git | Latest | git-scm.com |
| VS Code | Latest | code.visualstudio.com |

---

## Step 1 — GPOS Clone Karo

```bash
git clone https://github.com/Silverado313/gpos.git fabric-pos
cd fabric-pos
```

---

## Step 2 — Dependencies Install Karo

```bash
# Base dependencies
npm install

# Barcode ke liye
npm install jsbarcode
npm install html5-qrcode

# Invoice print ke liye
npm install react-to-print

# PDF export ke liye
npm install jspdf html2canvas
```

---

## Step 3 — Firebase Setup

### 3a. Firebase Project Banao
1. [firebase.google.com](https://firebase.google.com) pe jao
2. "Add Project" click karo
3. Project naam: `fabric-pos-client`
4. Firestore Database enable karo
5. Authentication enable karo (Email/Password)
6. Hosting enable karo

### 3b. Firebase Config Copy Karo
Firebase console se yeh values milegi:

```
API Key
Auth Domain
Project ID
Storage Bucket
Messaging Sender ID
App ID
```

### 3c. Environment File Banao

```bash
# .env.local file banao (root folder mein)
```

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> ⚠️ `.env.local` file ko kabhi GitHub pe push mat karo!

---

## Step 4 — System Run Karo

```bash
npm run dev
```

Browser mein khulega: `http://localhost:5173`

---

## Step 5 — First Admin Account Banao

1. Firebase Console → Authentication → Add User
2. Email: `admin@fabricpos.com`
3. Password: (strong password)
4. Firestore mein user document banao:

```json
{
  "email": "admin@fabricpos.com",
  "role": "admin",
  "name": "Factory Owner",
  "createdAt": "2026-05-24"
}
```

---

## Step 6 — Production Deploy Karo

```bash
# Build banao
npm run build

# Firebase pe deploy karo
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

Live URL milega: `https://your-project.web.app`

---

## Firestore Database Structure

```
fabric-pos (Firestore)
├── users/
│   └── {userId}/          → name, email, role
├── products/
│   └── {productId}/       → name, category, color, price, stock, barcode
├── sales/
│   └── {saleId}/          → date, customer, items, total, invoiceId
├── invoices/
│   └── {invoiceId}/       → invoiceNo, customer, items, total, date
├── customers/
│   └── {customerId}/      → name, location, phone, totalPurchases
├── inventory/
│   └── {productId}/       → currentStock, lastUpdated, lowStockAlert
└── barcodes/
    └── {barcodeId}/       → barcode, productId, rollNo, history[]
```

---

## Trouble? Common Issues

| Problem | Solution |
|---------|----------|
| `npm install` fail ho | Node.js version check karo (v18+) |
| Firebase connect nahi | `.env.local` file check karo |
| Barcode scan nahi | Browser camera permission do |
| Print kaam nahi | Chrome use karo |
