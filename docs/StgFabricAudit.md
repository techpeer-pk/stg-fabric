# STG Fabric — Codebase Audit Report
> **Repository:** `https://github.com/techpeer-pk/stg-fabric.git`
> **Audit Date:** 25 May 2026
> **Auditor:** Claude Code (AI-assisted review)
> **Commit Audited:** `b73338b` (HEAD / master)
> **Codebase Version:** v2.0.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Repository Snapshot](#3-repository-snapshot)
4. [Technology Stack](#4-technology-stack)
5. [Architecture Analysis](#5-architecture-analysis)
   - 5.1 [Firestore Data Model](#51-firestore-data-model)
   - 5.2 [State Management](#52-state-management)
   - 5.3 [Routing & Authorization](#53-routing--authorization)
   - 5.4 [Firebase Service Layer](#54-firebase-service-layer)
   - 5.5 [Component Architecture](#55-component-architecture)
6. [Module-by-Module Breakdown](#6-module-by-module-breakdown)
7. [Code Quality Analysis](#7-code-quality-analysis)
8. [Security Audit](#8-security-audit)
9. [Performance Considerations](#9-performance-considerations)
10. [Dependency Audit](#10-dependency-audit)
11. [Issues & Findings Register](#11-issues--findings-register)
12. [Recommendations Roadmap](#12-recommendations-roadmap)
13. [Scoring Scorecard](#13-scoring-scorecard)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

**STG Fabric** is a purpose-built Point-of-Sale and factory management web application for a fabric manufacturing business operating across Pakistan and Thailand. It is a customized fork of the open-source [GPOS](https://github.com/Silverado313/gpos) project, extended into a full multi-branch enterprise operations suite.

The codebase is in **good overall health** for a client project of its scope and timeline. The multi-branch Firestore architecture is well-conceived, the tech stack is modern, and the documentation quality is unusually thorough for a solo/small-team delivery.

The three most significant gaps are:

| # | Gap | Impact |
|---|---|---|
| 1 | **Zero automated tests** | Any regression is invisible; refactoring carries high risk |
| 2 | **Unverified Firestore Security Rules** | Client-side RBAC alone is not real security |
| 3 | **Dual authStore files (active conflict risk)** | Wrong import silently degrades auth system |

With these addressed, this codebase is production-grade.

---

## 2. Project Overview

| Attribute | Detail |
|---|---|
| **Product Name** | Fabric POS / GPOS v2.0 |
| **Client** | Fabric Factory, Karachi, Pakistan |
| **Operations** | Pakistan → Thailand (multi-country) |
| **Base Project** | GPOS by Silverado313 (MIT Licensed) |
| **Customization Level** | High — new modules, new data model, new architecture |
| **Deployment Target** | Firebase Hosting (PWA) |
| **Primary Users** | Owner, Managers, Cashiers, Warehouse Staff |

### What the System Does

The application covers the full operational lifecycle of a fabric factory:

```
Raw Material → Barcode Tagging → Inventory → Sales (POS) → Invoice → Accounts
                                                ↓
                                    Multi-Branch Reporting
```

**Core capabilities:**
- **POS (Point of Sale):** Cart-based sales with tax, discounts, loyalty points, payment methods, hold/suspend sales
- **Barcode Management:** Generate and scan barcodes for fabric rolls/products
- **Inventory:** Stock tracking per branch with purchase orders and supplier management
- **Invoicing:** Printable/shareable invoices with a public URL (`/invoice/:businessId/:branchId/:id`)
- **Accounts:** Cash flow, expenses, register reconciliation, accounts summary
- **Multi-Branch:** Branch switching, branch-specific data isolation, cross-branch reporting
- **Employees:** Staff management (owner-only)
- **Reports:** Sales analytics with charts (Recharts)
- **Push Notifications:** Firebase Cloud Messaging for real-time branch alerts
- **PWA:** Offline support via Service Worker + Firestore persistent cache

---

## 3. Repository Snapshot

### Git History

```
b73338b  feat: fabric-specific updates — seed data, charts, dashboard range filter, reports fix, branches UI cleanup
ce3312a  feat: Replace all emojis with Lucide React SVG icons
169d425  feat: Fabric POS v2.0 — Complete fabric factory customization
```

**Observations:**
- Only **3 commits** total — this is extremely sparse for a project of this complexity
- The entire multi-branch architecture appears to have been developed in a single commit (`169d425`)
- No conventional commit history makes it impossible to trace when specific bugs were introduced
- No branches visible beyond `master`

> **Recommendation:** Adopt a branching strategy (e.g., `main` + `feature/*` + `fix/*`) and make atomic commits going forward. Each feature/fix should be its own commit.

### File Statistics

| Metric | Count |
|---|---|
| Total JSX source files | 40 |
| Page-level components | 30 |
| JS utility/service files | 12 |
| Documentation `.md` files | 12 |
| Test files | **0** |
| Total Firestore collections | 15+ |

### Directory Structure

```
stg-fabric/
├── app/                          ← Main application
│   ├── src/
│   │   ├── assets/               ← Images + backup JSON
│   │   ├── components/
│   │   │   ├── common/           ← ErrorBoundary, SearchableDropdown, Skeleton, NotificationListener
│   │   │   └── layout/           ← Layout, Navbar, Sidebar
│   │   ├── firebase/             ← All Firebase interactions
│   │   │   ├── auth.js
│   │   │   ├── config.js
│   │   │   ├── firestore.js          ← ⚠️ Legacy (pre-multi-branch)
│   │   │   ├── firestore-multi-branch.js  ← ✅ Active
│   │   │   ├── messaging.js
│   │   │   ├── migration.js          ← ⚠️ Likely dead code
│   │   │   └── seedData.js           ← ⚠️ Dev tool, should not be in src/
│   │   ├── pages/                ← 30 page components across 12 feature areas
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── store/
│   │   │   ├── authStore.js          ← ⚠️ Legacy (dead code)
│   │   │   ├── authStore-multi-branch.js  ← ✅ Active
│   │   │   └── themeStore.js
│   │   └── utils/
│   │       ├── errorHandler.js
│   │       └── receiptHelper.js
│   ├── public/                   ← Static assets, PWA icons
│   ├── docs/                     ← App-level docs (BARCODE, INVOICE, MODULES, SETUP)
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
├── docs/                         ← Repo-level docs
└── README.md
```

---

## 4. Technology Stack

### Frontend

| Library | Version | Assessment |
|---|---|---|
| React | `^19.2.0` | ✅ Latest stable — Concurrent Mode, Server Components ready |
| React DOM | `^19.2.0` | ✅ Paired correctly |
| React Router DOM | `^7.13.0` | ✅ v7 with file-based routing support |
| Vite | `^7.3.1` | ✅ Fastest build tool available |
| Tailwind CSS | `^3.4.19` | ✅ Good fit; utility-first accelerates UI development |

### State & Data

| Library | Version | Assessment |
|---|---|---|
| Zustand | `^5.0.11` | ✅ Lightweight, no boilerplate, correct scale for this app |
| Firebase | `^12.9.0` | ✅ Latest SDK; modular tree-shakeable imports |
| firebase-admin | `^13.7.0` | 🔴 **Server SDK in frontend — wrong placement** |

### UI & Utilities

| Library | Version | Assessment |
|---|---|---|
| Lucide React | `^1.16.0` | ✅ Tree-shakeable SVG icons; replaces emoji (recent improvement) |
| Recharts | `^3.8.0` | ✅ React-native charting; appropriate choice |
| react-hot-toast | `^2.5.1` | ✅ Lightweight toasts; centralized via `errorHandler.js` |
| JsBarcode | `^3.12.3` | ✅ Correct library for barcode generation |
| html5-qrcode | `^2.3.8` | ✅ Correct for QR/barcode scanning |
| jsPDF | `^4.2.0` | ⚠️ Works but PDF generation from DOM is fragile |
| html2canvas | `^1.4.1` | ⚠️ Paired with jsPDF; screenshot-to-PDF approach has quality limits |
| qrcode.react | `^4.2.0` | ✅ QR code rendering in React |

### Build & Dev

| Tool | Version | Assessment |
|---|---|---|
| ESLint | `^10.0.1` | ✅ Latest; configured correctly |
| vite-plugin-pwa | `^0.19.8` | ✅ PWA manifest + Service Worker |
| autoprefixer | `^10.4.24` | ✅ CSS compatibility |
| @vitejs/plugin-react | `^5.1.1` | ✅ Official Vite React plugin |

**Stack Verdict:** Modern, cohesive, and well-matched to the problem domain. The only misplaced dependency is `firebase-admin` which is a Node.js server SDK and should not live in the browser app's `dependencies`.

---

## 5. Architecture Analysis

### 5.1 Firestore Data Model

The data model represents the most architecturally significant decision in this project. The multi-branch Firestore structure is well-designed:

```
businesses/{businessId}/
│
├── [SHARED — visible to all branches]
│   ├── products/{productId}
│   ├── categories/{categoryId}
│   ├── customers/{customerId}         ← Loyalty points flow across branches
│   ├── suppliers/{supplierId}
│   ├── employees/{employeeId}
│   └── branch_stock_transfers/{transferId}
│
└── branches/{branchId}/
    │
    └── [BRANCH-ISOLATED — each branch sees only its own]
        ├── sales/{saleId}
        ├── inventory/{productId_inv}
        ├── suspended_sales/{saleId}
        ├── cash_flow/{entryId}
        ├── purchase_orders/{poId}
        ├── expenses/{expenseId}
        └── reconciliations/{entryId}
```

**What's good:**
- The shared/branch-specific split is logically correct. Products and customers are business-wide concerns; sales and inventory are branch-specific. This mirrors real-world operations.
- `getCollectionPath()` helper in `firestore-multi-branch.js:25` declaratively enforces this split — the list of branch-specific collections is the single source of truth.
- `increment()` is used for inventory decrements (`decrementInventory`) and loyalty points (`incrementCustomerLoyalty`) — this is the correct atomic Firestore operation, avoiding race conditions.
- `writeBatch()` is used for `batchUpdateSalesWithCashFlow` — atomic writes that must succeed together.
- `serverTimestamp()` consistently used (not `new Date()`) — ensures server-side clock consistency across time zones (critical for Pakistan ↔ Thailand).

**Issues:**
- `getTotalSalesAcrossAllBranches()` fetches ALL documents from ALL branches in a sequential `for` loop. For a business with many branches and high sales volume, this will be **very slow** and costly (reads all documents). This needs aggregation counters or a Cloud Function.
- `expenses` uses `orderBy('date', 'desc')` with a `date` field, while `cash_flow` uses `orderBy('createdAt', 'desc')`. Inconsistent date field naming across collections.
- No Firestore indexes are documented (no `firestore.indexes.json`). Compound queries (`where` + `orderBy`) require composite indexes or they will silently fail in production.

---

### 5.2 State Management

The app uses **Zustand** for global state with two distinct stores.

#### `authStore-multi-branch.js` (Active)

```
State shape:
  user, isAuthenticated, userId, userEmail, userRole
  businessId, branchId, businessName, branchName, branchLocation
  assignedBranches[]
  isDarkMode, loading
```

**What's good:**
- `persist` middleware selectively persists only stable data (IDs, role, theme) — sensitive session data like `user` (Firebase Auth object) is not persisted
- Clean separation between auth state, business context, and UI state
- Helper methods (`hasRole`, `hasAnyRole`, `canAccessBranch`, `isOwner`) provide a single access point for RBAC decisions
- `switchBranch()` validates against `assignedBranches` before switching

**Critical design issue — `App.jsx` session sync:**
```jsx
// App.jsx:54 — session context re-synced from Firestore on every auth state change
const context = await getUserSessionContext(currentUser.uid)
useAuthStore.setState({
  businessId: context.businessId,
  userRole: context.role || 'cashier',
  assignedBranches: context.branches || []
})
```
This is the correct pattern — role from **server** always wins over persisted localStorage role. This is the "OWNER SAFETY NET" — it prevents a user from manipulating their localStorage role to escalate privileges. ✅

**However:** If `getUserSessionContext` fails (network error, Firestore down), the `catch` block only logs and falls through to `setLoading(false)`. The user will be authenticated but with potentially stale role from localStorage. A fallback to logout or a warning state would be safer.

#### `authStore.js` (Legacy — Dead Code)

```js
// Uses localStorage directly — not Zustand persist middleware
role: localStorage.getItem('gpos_user_role') || null
```

This file is imported nowhere in the active codebase. However, it still exists and will confuse future developers. If imported by mistake, the role is only client-controlled — there is no server-sync safety net.

#### `themeStore.js`

Dark mode state — simple and appropriate. Could be merged into `authStore-multi-branch.js` since it's already there as `isDarkMode`, but the separation is not harmful.

---

### 5.3 Routing & Authorization

**Route definitions** (`App.jsx`):

```
Public Routes (no auth):
  /                     → PublicDocumentation
  /pricing              → Pricing
  /purpose              → Purpose
  /docs                 → PublicDocumentation
  /login                → Login
  /register             → Redirects to /login (registration disabled)
  /invoice/:biz/:br/:id → Invoice (public shareable link)

Protected Routes (Firebase Auth required):
  /dashboard            → All roles
  /pos                  → All roles
  /sales                → All roles
  /customers            → All roles
  /barcode              → All roles
  /user-settings        → All roles
  /documentation        → All roles
  /help                 → All roles
  /products             → owner, manager
  /inventory            → owner, manager
  /suppliers            → owner, manager
  /purchase-orders      → owner, manager
  /accounts-summary     → owner, manager
  /expenses             → owner, manager
  /cash-flow            → owner, manager
  /register-reconciliation → owner, manager
  /po-invoice/:id       → owner, manager
  /employees            → owner only
  /branches             → owner only
  /reports              → owner only
  /settings             → owner only
  /import               → owner only
  /backup               → owner only
```

**`ProtectedRoute.jsx` implementation:**
```jsx
if (!user) return <Navigate to="/login" />
if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/dashboard" />
return children
```

This is clean and correct for UI-level access control. The loading state shows a spinner with "Verifying Access..." — good UX for the auth check race condition.

**Important limitation:** This is **presentation-layer security only**. A user who can intercept and modify the `auth-store` localStorage key could set `userRole: "owner"` and gain UI access. This is why the App.jsx session-sync-from-Firestore pattern is critical — and why Firestore Security Rules are essential.

**Sidebar role filtering:**
```js
const filteredMenu = menuItems.filter(item => !item.roles || item.roles.includes(userRole))
```
Menu items are filtered client-side based on role. This matches the route-level guards — consistent. ✅

---

### 5.4 Firebase Service Layer

**`firebase/auth.js`** — Thin wrapper over Firebase Auth:
```js
export const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
export const logout = () => signOut(auth)
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback)
```
Clean, minimal, no business logic.

**`firebase/firestore-multi-branch.js`** — The main data layer (~550 lines):

The file exposes:
- **CRUD** for: products, inventory, categories, customers, suppliers, sales, suspended sales, cash flow, reconciliations, purchase orders, expenses, branches, employees
- **Batch operations:** `batchAddInventoryItems`, `batchUpdateSalesWithCashFlow`
- **Aggregations:** `getTotalSalesAcrossAllBranches`, `getBranchWiseRevenue`
- **Session context:** `getUserSessionContext` (used for server-side role verification)

Pattern used throughout:
```js
export const addProduct = (businessId, data) => {
    return addDoc(collection(db, `businesses/${businessId}/products`), {
        ...data,
        createdAt: serverTimestamp()
    })
}
```

All functions return **Promises** (not `async/await` at the service layer). This is a valid pattern — callers handle async. Consistent across the file.

**`firebase/config.js`** — Firebase initialization:
```js
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    }),
    experimentalForceLongPolling: true,
})
```
The persistent multi-tab cache is excellent for a factory POS — multiple tabs/devices can stay in sync and work offline.

`experimentalForceLongPolling: true` is flagged as a concern — see [Issues Register](#11-issues--findings-register).

---

### 5.5 Component Architecture

**Layout system:**
- `Layout.jsx` wraps all authenticated pages
- `Navbar.jsx` — top bar with branch name, dark mode toggle
- `Sidebar.jsx` — role-filtered navigation with collapsible groups

**Common components:**
- `ErrorBoundary.jsx` — wraps the entire app; catches React render errors
- `SearchableDropdown.jsx` — reusable for customer/product search in POS
- `Skeleton.jsx` — loading skeleton UI including `SkeletonPOS` variant
- `NotificationListener.jsx` — Firebase Cloud Messaging foreground handler

**POS component notable decisions:**
```jsx
// CartPanel defined OUTSIDE POS — prevents remount on parent re-render
const CartPanel = memo(({ ...props }) => ( ... ))
```
Correct use of `memo` to prevent cart panel from unmounting/remounting as POS state changes. This avoids losing form input state mid-transaction. ✅

---

## 6. Module-by-Module Breakdown

| Module | Path | Status | Quality | Notes |
|---|---|---|---|---|
| Auth / Login | `pages/auth/Login.jsx` | ✅ Live | Good | Email+password only; registration disabled by design |
| Pending Approval | `pages/auth/PendingApproval.jsx` | ✅ Live | Good | Shown while owner hasn't approved new user |
| User Settings | `pages/auth/UserSettings.jsx` | ✅ Live | Good | Profile management per user |
| Dashboard | `pages/dashboard/Dashboard.jsx` | ✅ Live | Good | Date range filter, charts, multi-branch summary |
| POS | `pages/pos/POS.jsx` | ✅ Live | Good | Suspended sales, loyalty, tax toggle, WhatsApp share |
| Products | `pages/products/Products.jsx` | ✅ Live | Good | Owner/manager only |
| Barcode | `pages/barcode/Barcode.jsx` | ✅ Live | Medium | Generates + scans; fabric-specific tracking |
| Sales | `pages/sales/Sales.jsx` | ✅ Live | Good | Sale history with receipts |
| Invoice | `pages/sales/Invoice.jsx` | ✅ Live | Good | Public URL, printable, WhatsApp-shareable |
| Customers | `pages/customers/Customers.jsx` | ✅ Live | Good | Loyalty points integrated |
| Inventory | `pages/inventory/Inventory.jsx` | ✅ Live | Good | Branch-scoped stock levels |
| Suppliers | `pages/inventory/Suppliers.jsx` | ✅ Live | Good | Supplier directory |
| Purchase Orders | `pages/inventory/PurchaseOrders.jsx` | ✅ Live | Good | PO creation + tracking |
| PO Invoice | `pages/inventory/POInvoice.jsx` | ✅ Live | Good | Printable PO invoice |
| Employees | `pages/employees/Employees.jsx` | ✅ Live | Good | Owner-only staff management |
| Branches | `pages/settings/Branches.jsx` | ✅ Live | Good | Branch CRUD + switching |
| Reports | `pages/reports/Reports.jsx` | ✅ Live | Medium | Recharts-based; date range filtering |
| Accounts Summary | `pages/accounts/AccountsSummary.jsx` | ✅ Live | Medium | Cross-branch financial view |
| Expenses | `pages/accounts/Expenses.jsx` | ✅ Live | Good | Branch-scoped expense tracking |
| Cash Flow | `pages/accounts/CashFlow.jsx` | ✅ Live | Good | Inflows/outflows by branch |
| Register Reconciliation | `pages/accounts/RegisterReconciliation.jsx` | ✅ Live | Good | End-of-day register close |
| Settings | `pages/settings/Settings.jsx` | ✅ Live | Good | Business settings, currency, tax |
| Import | `pages/settings/Import.jsx` | ✅ Live | Medium | Data import utility |
| Backup | `pages/settings/Backup.jsx` | ✅ Live | Medium | Data export/backup |
| Documentation | `pages/settings/Documentation.jsx` | ✅ Live | Good | In-app docs |
| Help | `pages/settings/Help.jsx` | ✅ Live | Good | Support info |
| Pricing (Public) | `pages/public/Pricing.jsx` | ✅ Live | Good | SaaS pricing page |
| Purpose (Public) | `pages/public/Purpose.jsx` | ✅ Live | Good | Product purpose/marketing |
| Public Docs | `pages/public/PublicDocumentation.jsx` | ✅ Live | Good | Public-facing docs |

---

## 7. Code Quality Analysis

### Strengths

**1. Centralized error handling**
`utils/errorHandler.js` provides `handleError`, `showSuccess`, `showInfo`, `showLoading`, and `dismissToast`. These centralize toast notifications so error messaging is consistent across the app. A comment hints at future Sentry integration — good forward thinking.

```js
// Could send to external logging service (Sentry, Firebase, etc.)
// Example: logErrorToService(error, context)
```

**2. Consistent service layer signatures**
Every Firestore function in `firestore-multi-branch.js` follows the same parameter order: `(businessId, [branchId], entityId?, data?)`. This makes the API predictable and hard to misuse.

**3. `memo` used where it counts**
`CartPanel` in `POS.jsx` is wrapped in `memo` and defined outside the parent component — prevents unnecessary re-renders and DOM remounting during checkout flows.

**4. Skeleton loading states**
`Skeleton.jsx` includes `SkeletonPOS` — a POS-specific skeleton. This shows attention to perceived performance during data loading.

**5. Dark mode implementation**
Dark mode is implemented via Tailwind's `dark:` variant and persisted to localStorage via Zustand. Theme is initialized in `App.jsx` before first render — no flash of wrong theme.

**6. Receipt sharing**
`utils/receiptHelper.js` generates formatted receipt messages and WhatsApp/SMS links — practical feature for a Pakistan-based business where WhatsApp is the primary business communication channel.

### Weaknesses

**1. No tests whatsoever**
There are zero test files — no unit tests, no integration tests, no E2E tests. The ESLint configuration doesn't even include test-related plugins. Every change carries hidden regression risk.

**2. Large page components (suspected)**
With 30 page components and only 4 shared non-layout components, significant business logic is likely co-located in page files. `POS.jsx` alone appears to be a very large component (cart logic + product grid + checkout + receipt + sharing). This makes the code harder to test, reuse, or replace.

**3. Inconsistent async patterns**
Service layer functions return raw Promises. Some call sites use `async/await` with `try/catch`, others chain `.then().catch()`. Neither is wrong, but the inconsistency makes the code harder to scan.

**4. Raw `console.log` / `console.warn` scattered in App.jsx**
```js
console.log(`🔐 Session Synced: User=${currentUser.uid} ...`)
console.warn(`⚠️ No session context found for ${currentUser.uid}`)
console.error('❌ Session Sync Critical Error:', error)
```
Debug logging should use a structured logger (or at minimum be stripped in production builds) rather than raw `console.*` calls. This leaks internal user IDs and role information to the browser console.

**5. `seedData.js` and `migration.js` in `src/`**
These are development/one-time utilities. `seedData.js` likely populates test data; `migration.js` was probably used for a one-time schema migration. Neither belongs in `src/` — they should be in `scripts/` or removed entirely once their purpose is fulfilled.

**6. Backup JSON in `src/assets/`**
`src/assets/gpos-backup-20260306-135020.json` — a 6MB+ Firestore backup JSON is committed into the repository. This should never be in source control: it may contain real business/customer data, inflates bundle analysis (even if excluded from build), and belongs in a secure backup solution.

**7. ESLint `no-unused-vars` with broad ignore pattern**
```js
'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]
```
Variables starting with uppercase letters or underscores are exempt from unused-var detection. This is too broad — React component names start with uppercase, so imported but unused components are silently ignored.

---

## 8. Security Audit

### Finding Register

| ID | Finding | Severity | Status |
|---|---|---|---|
| SEC-01 | API keys previously in git history | 🔴 Critical | Documented — remediation required |
| SEC-02 | Firebase API key domain restrictions | 🟠 High | Documented — must verify applied |
| SEC-03 | Firestore Security Rules — unverified | 🟠 High | Documented — must verify deployed |
| SEC-04 | Client-side-only RBAC | 🟡 Medium | By design — needs server-side rules to back it |
| SEC-05 | `userRole` persisted to localStorage | 🟡 Medium | Mitigated by App.jsx session sync from Firestore |
| SEC-06 | Console logs expose internal user data | 🟡 Medium | Strip in production |
| SEC-07 | `firebase-admin` in client dependencies | 🟡 Low | Won't execute in browser; wrong placement |
| SEC-08 | Real backup data committed to repo | 🟠 High | `gpos-backup-20260306-135020.json` — PII risk |
| SEC-09 | `experimentalForceLongPolling` always on | 🟢 Low | Performance impact only |
| SEC-10 | Public invoice URL has no auth check | 🟡 Medium | Intentional design — assess if acceptable |

---

### SEC-01 — API Keys in Git History

**Severity:** 🔴 Critical  
**Finding:** `.env` file was committed into git history across multiple commits. Git history is permanent unless explicitly rewritten. `git log -p -- .env` would expose Firebase credentials to anyone with repo access.

**Mitigations documented in `SECURITY-AUDIT.md`:**
- API key domain restriction (fix applied or documented)
- Git history rewrite via `git-filter-repo` (documented)
- Credential rotation recommended if repo was ever public

**Action Required:** Verify that `git log --all -- .env` returns **empty**. If not, the history rewrite must be applied and credentials rotated.

---

### SEC-02 — Firebase API Key Domain Restrictions

**Severity:** 🟠 High  
**Finding:** Without domain restrictions, the Firebase Browser API key works from any origin. An attacker who finds the key could make unrestricted calls to Firebase services (read public data, exhaust quotas).

**Current State:** The `SECURITY-AUDIT.md` documents the remediation steps. It is unknown whether these restrictions have actually been applied in Google Cloud Console.

**Action Required:** Verify in Google Cloud Console → APIs & Services → Credentials that the Browser key has domain restrictions to:
- `https://your-app.web.app`
- `https://your-app.web.app/*`
- `http://localhost:5173` (dev only)

---

### SEC-03 — Firestore Security Rules

**Severity:** 🟠 High  
**Finding:** No Firestore Security Rules file exists in this repository (`firestore.rules` is absent). The `SECURITY-AUDIT.md` references minimum rules but these may not be deployed.

**Risk:** If Firestore is still in test mode (`allow read, write: if true`), **any authenticated or unauthenticated user can read and write all business data**.

**Minimum acceptable rules** (from the security audit doc):
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Ideal rules** for this architecture should enforce:
- Users can only read `businesses/{businessId}/...` where `businessId` matches their profile
- Branch data should be gated to users with `branchId` in their `assignedBranches`
- Owner operations (delete employee, delete branch) gated by `userRole == 'owner'` in the user's Firestore document

**Action Required:** Add `firestore.rules` to the repo and deploy it. Firebase Rules version-controlled is a security best practice.

---

### SEC-04 — Client-Side-Only RBAC

**Severity:** 🟡 Medium  
**Finding:** All role checks (`allowedRoles` in `ProtectedRoute`, `item.roles` in Sidebar) are client-side JavaScript. A sophisticated user could modify `auth-store` in localStorage or use the Firebase SDK directly from the browser console to write to unauthorized collections.

**Mitigation in place:** `App.jsx` re-fetches `userRole` from Firestore on every session start, overwriting localStorage. This prevents persistent role escalation via localStorage manipulation.

**Remaining gap:** Direct Firestore SDK calls from browser console are only blocked by Security Rules (SEC-03).

---

### SEC-05 — `userRole` Persisted to localStorage

**Severity:** 🟡 Medium  
**Finding:** Zustand's `persist` middleware writes `userRole` to localStorage:
```js
partialize: (state) => ({
    userRole: state.userRole,   // ← stored in localStorage
    ...
})
```
A user can open DevTools and manually set `userRole: "owner"` in localStorage `auth-store` key.

**Mitigation:** The App.jsx `onAuthChange` handler calls `getUserSessionContext()` and overwrites the stored role with the server value. This runs on every page load. ✅

**Residual risk:** Between page load (before session sync completes) and Firestore returning the context, `loading` is `true` and `ProtectedRoute` shows a spinner — so no unauthorized access window during sync. The pattern is safe. ✅

---

### SEC-08 — Backup Data in Repository

**Severity:** 🟠 High  
**Finding:** `app/src/assets/gpos-backup-20260306-135020.json` is a Firestore data backup committed directly to the repository.

**Risks:**
1. If this contains real customer names, phone numbers, transaction records — it's a **PII data exposure risk** under PDPA (Pakistan Personal Data Protection Act) and Thai PDPA
2. It inflates the repo and may be included in bundle analysis tools
3. Anyone with repository access (or if repo is ever made public) has the full dataset

**Action Required:**
- Remove this file from the repository: `git rm app/src/assets/gpos-backup-20260306-135020.json`
- Purge from git history with `git-filter-repo`
- Store backups in a private, encrypted location (Firebase Storage, Google Drive private folder, encrypted local storage)

---

### SEC-10 — Public Invoice URL

**Severity:** 🟡 Medium (by design)  
**Finding:** `/invoice/:businessId/:branchId/:id` is a fully public route with no authentication. Anyone with the URL can view the invoice.

**Assessment:** This appears intentional — the use case is sharing invoices with customers via WhatsApp. The URL is unguessable if `id` is a Firestore auto-generated ID (20 random chars). This is acceptable if:
- The business understands invoices are publicly accessible to anyone with the link
- Invoice data does not contain sensitive information beyond transaction details
- Firestore Rules allow reading of `/businesses/{biz}/branches/{br}/sales/{id}` without auth

---

## 9. Performance Considerations

### 9.1 Firestore Read Costs — Aggregation N+1

**Issue:** `getTotalSalesAcrossAllBranches` and `getBranchWiseRevenue` fetch all sale documents from each branch sequentially:
```js
for (const branchDoc of branchesSnap.docs) {
    const salesSnap = await getDocs(
        collection(db, `businesses/${businessId}/branches/${branchDoc.id}/sales`)
    )
    // reads EVERY sale document
}
```

For a business with 3 branches × 5,000 sales = **15,000 Firestore reads** every time the owner views the dashboard. At Firestore's pricing, this accumulates quickly.

**Solutions:**
1. Use Firestore **Aggregation Queries** (`count()`, `sum()`) — available since Firebase SDK v9.14
2. Maintain running totals in a dedicated `analytics` document, updated via Firestore triggers or Cloud Functions
3. Cache aggregation results in a Cloud Function with a scheduled refresh

### 9.2 `experimentalForceLongPolling: true` Always On

Long polling falls back from WebSockets to HTTP long-polling. This means:
- Every Firestore real-time listener uses HTTP polling instead of WebSocket multiplexing
- Higher latency, more connections, more battery drain on mobile devices

This flag should only be enabled for users on networks that block WebSockets (some corporate firewalls, certain VPNs). Consider making it conditional:
```js
experimentalForceLongPolling: import.meta.env.VITE_FORCE_LONG_POLLING === 'true'
```

### 9.3 PWA Icon Configuration

```js
// vite.config.js — icons are commented out
// {
//   src: '/pwa-192x192.png',
//   sizes: '192x192',
// ...
```

Only `vite.svg` is configured as the PWA icon. On Android/iOS, "Add to Home Screen" will show a generic Vite logo. The PNG assets (`pwa-192x192.png`, `pwa-512x512.png`) exist in `/public/` — they just need to be uncommented in the manifest config.

### 9.4 No Code Splitting

With 30+ page components all imported at the top of `App.jsx`, the initial bundle includes all pages. React Router v7 supports lazy loading:

```jsx
// Current (eager — all pages in initial bundle)
import Dashboard from './pages/dashboard/Dashboard'
import POS from './pages/pos/POS'

// Better (lazy — each page is a separate chunk)
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const POS = lazy(() => import('./pages/pos/POS'))
```

This would significantly reduce the initial load time, especially important as a PWA on potentially slow mobile connections in a factory setting.

---

## 10. Dependency Audit

### Misplaced Dependencies

| Package | Current | Should Be | Reason |
|---|---|---|---|
| `firebase-admin` | `dependencies` | Removed or `devDependencies` (scripts only) | Server SDK — not for browser; used only in `scripts/importFirestore.js` |

### Potentially Duplicate Functionality

| Packages | Overlap |
|---|---|
| `html5-qrcode` + `qrcode.react` | Both handle QR codes — one for scanning, one for generating. Not a duplicate, but worth documenting the distinction |
| `jsPDF` + `html2canvas` | Both needed for screenshot-to-PDF. Consider a more robust PDF solution for production invoices |

### Version Health Check

All packages are at current major versions as of May 2026. No obviously outdated or deprecated packages found.

### Missing Recommended Packages

| Package | Purpose | Priority |
|---|---|---|
| `vitest` | Unit testing framework (Vite-native) | 🔴 High |
| `@testing-library/react` | Component testing | 🔴 High |
| `@playwright/test` or `cypress` | E2E testing | 🟡 Medium |
| `sentry/browser` | Error monitoring in production | 🟡 Medium |

---

## 11. Issues & Findings Register

### Priority 1 — Critical / Blocking

| ID | Issue | File(s) | Impact |
|---|---|---|---|
| ISS-01 | **Zero test coverage** | Entire codebase | Any change risks silent regression; no safety net |
| ISS-02 | **Backup JSON with potential PII committed to repo** | `src/assets/gpos-backup-20260306-135020.json` | Data privacy violation risk |
| ISS-03 | **Firestore Security Rules not in repo / unverified deployed** | Missing `firestore.rules` | Database may be open to any authenticated user |

### Priority 2 — High

| ID | Issue | File(s) | Impact |
|---|---|---|---|
| ISS-04 | **`firebase-admin` in browser dependencies** | `package.json` | Wrong SDK; inflates install; wrong conceptual model |
| ISS-05 | **`authStore.js` legacy file still exists** | `src/store/authStore.js` | Import confusion; provides insecure role storage if used |
| ISS-06 | **API key git history exposure (unconfirmed fix)** | git history | Credential leak risk if not purged |
| ISS-07 | **N+1 Firestore reads in aggregation helpers** | `firestore-multi-branch.js:507` | High read cost; will become expensive at scale |

### Priority 3 — Medium

| ID | Issue | File(s) | Impact |
|---|---|---|---|
| ISS-08 | **`console.log` with user IDs in production** | `App.jsx:58-69` | Leaks internal data to browser console |
| ISS-09 | **`experimentalForceLongPolling` always on** | `firebase/config.js:28` | Degraded real-time performance for all users |
| ISS-10 | **PWA manifest icons commented out** | `vite.config.js:29-45` | App installs with generic Vite icon on mobile |
| ISS-11 | **No lazy loading / code splitting** | `App.jsx:1-39` | Larger initial bundle; slower first load |
| ISS-12 | **No Firestore indexes file** | Missing `firestore.indexes.json` | Compound queries may silently fail in production |
| ISS-13 | **`seedData.js` and `migration.js` in `src/`** | `src/firebase/` | Dev tools in production source; risk of accidental execution |

### Priority 4 — Low / Cleanup

| ID | Issue | File(s) | Impact |
|---|---|---|---|
| ISS-14 | **`firestore.js` legacy file (pre-multi-branch)** | `src/firebase/firestore.js` | Dead code; confusion for new developers |
| ISS-15 | **`themeStore.js` duplicates `isDarkMode` from authStore** | `src/store/themeStore.js` | State fragmentation |
| ISS-16 | **Inconsistent date field names** (`date` vs `createdAt`) across collections | `firestore-multi-branch.js` | Query inconsistency |
| ISS-17 | **Only 3 git commits** | git history | Cannot trace regression origin; poor change management |
| ISS-18 | **`VITE_APP_NAME` still `GPOS` in `env.example`** | `env.example:17` | Branding artifact from base project |

---

## 12. Recommendations Roadmap

### Immediate (This Sprint)

1. **Remove `gpos-backup-*.json` from git** *(ISS-02)*
   ```bash
   git rm app/src/assets/gpos-backup-20260306-135020.json
   git-filter-repo --path app/src/assets/gpos-backup-20260306-135020.json --invert-paths --force
   ```

2. **Verify and deploy Firestore Security Rules** *(ISS-03)*
   - Create `firestore.rules` file in the repo
   - Deploy via `firebase deploy --only firestore:rules`
   - Minimum: require `request.auth != null` for all reads/writes

3. **Delete `authStore.js`** *(ISS-05)*
   ```bash
   git rm app/src/store/authStore.js
   ```
   There is no reason to keep a dead, insecure version of the auth store.

4. **Fix PWA icons** *(ISS-10)*
   Uncomment the `pwa-192x192.png` and `pwa-512x512.png` entries in `vite.config.js`. The files already exist in `/public/`.

5. **Move `firebase-admin` to a `scripts/` package or remove** *(ISS-04)*
   ```json
   // Remove from app/package.json
   // Only needed for scripts/importFirestore.js — use a separate package.json in scripts/
   ```

### Short-Term (Next 2–4 Weeks)

6. **Set up testing infrastructure** *(ISS-01)*
   ```bash
   npm install -D vitest @testing-library/react @testing-library/user-event jsdom
   ```
   Start with:
   - Unit tests for `errorHandler.js` and `receiptHelper.js`
   - Component tests for `ProtectedRoute.jsx`
   - Integration tests for `authStore-multi-branch.js`

7. **Add lazy loading to routes** *(ISS-11)*
   Convert all page imports in `App.jsx` to `lazy()` + `<Suspense>`. This alone can cut initial bundle size by 60–70%.

8. **Fix N+1 aggregation reads** *(ISS-07)*
   Replace `getTotalSalesAcrossAllBranches` with Firestore aggregation queries:
   ```js
   import { getAggregateFromServer, sum, count } from 'firebase/firestore'
   const snapshot = await getAggregateFromServer(salesQuery, {
       totalCount: count(),
       totalAmount: sum('finalAmount')
   })
   ```

9. **Add `firestore.indexes.json`** *(ISS-12)*
   Run `firebase emulators:start` locally, exercise all queries, and collect the auto-suggested indexes. Commit `firestore.indexes.json` to the repo.

10. **Strip console logs in production** *(ISS-08)*
    Add to `vite.config.js`:
    ```js
    esbuild: {
        drop: ['console', 'debugger'],
    }
    ```
    Or convert to a structured logger that respects `import.meta.env.PROD`.

### Medium-Term (Next 1–2 Months)

11. **Error monitoring** — Integrate Sentry (already hinted at in `errorHandler.js`) for production error tracking

12. **Clean up dead code** — Remove `firestore.js` (legacy), `seedData.js`, `migration.js`, `themeStore.js` (merge into authStore)

13. **Adopt conventional commits** — Install `commitizen` or add a `CONTRIBUTING.md` with commit message conventions. This enables automated changelogs and better history navigation.

14. **Environment-specific long polling** *(ISS-09)*
    ```js
    experimentalForceLongPolling: import.meta.env.VITE_FORCE_LONG_POLLING === 'true'
    ```

15. **Rename `env.example` branding** *(ISS-18)*
    Update `VITE_APP_NAME=Fabric POS` and `VITE_APP_VERSION=2.0.0`.

---

## 13. Scoring Scorecard

| Dimension | Score | Max | Notes |
|---|---|---|---|
| **Architecture & Design** | 17 | 20 | Excellent Firestore model; clean service layer; penalized for N+1 aggregation |
| **Code Quality** | 13 | 20 | Consistent patterns, centralized error handling; penalized for large components, no tests |
| **Security** | 13 | 20 | Good awareness + documentation; penalized for unverified rules, committed backup data |
| **Documentation** | 16 | 20 | Unusually thorough for client project; 12 markdown docs; in-app docs page |
| **Maintainability** | 11 | 20 | Dead code, 3-commit history, no tests make future changes risky |
| **Performance** | 12 | 20 | Good offline config; PWA; penalized for no lazy loading, N+1 reads, long polling |
| **Dependency Management** | 14 | 20 | Modern stack; penalized for `firebase-admin` placement and missing test libs |
| **Production Readiness** | 13 | 20 | Core features complete; penalized for no tests, unverified security rules, dev artifacts |
| | | | |
| **TOTAL** | **109** | **160** | **68% — Good** |

### Grade: **B / Good**

> A solid foundation with real architectural thought. The primary gaps (testing, security verification, dead code cleanup) are all fixable without structural changes. This codebase can reach A-tier with 4–6 weeks of focused hardening work.

---

## 14. Appendix

### A. File Reference Index

| File | Role | Status |
|---|---|---|
| `app/src/App.jsx` | Root component; routing; session sync | ✅ Active |
| `app/src/main.jsx` | React DOM entry point | ✅ Active |
| `app/src/firebase/config.js` | Firebase initialization | ✅ Active |
| `app/src/firebase/auth.js` | Auth wrapper | ✅ Active |
| `app/src/firebase/firestore-multi-branch.js` | Main data layer | ✅ Active |
| `app/src/firebase/messaging.js` | FCM push notifications | ✅ Active |
| `app/src/firebase/firestore.js` | Legacy pre-multi-branch CRUD | ⚠️ Dead — remove |
| `app/src/firebase/seedData.js` | Dev seed data | ⚠️ Move to scripts/ |
| `app/src/firebase/migration.js` | One-time migration | ⚠️ Move to scripts/ or delete |
| `app/src/store/authStore-multi-branch.js` | Multi-branch auth state | ✅ Active |
| `app/src/store/authStore.js` | Legacy auth state | 🔴 Delete immediately |
| `app/src/store/themeStore.js` | Dark mode state | ⚠️ Consider merging into authStore |
| `app/src/routes/ProtectedRoute.jsx` | Auth + role guard | ✅ Active |
| `app/src/utils/errorHandler.js` | Centralized toast + logging | ✅ Active |
| `app/src/utils/receiptHelper.js` | WhatsApp/SMS receipt links | ✅ Active |
| `app/src/components/common/ErrorBoundary.jsx` | React error boundary | ✅ Active |
| `app/src/components/common/SearchableDropdown.jsx` | Reusable search input | ✅ Active |
| `app/src/components/common/skeleton/Skeleton.jsx` | Loading skeletons | ✅ Active |
| `app/src/components/common/NotificationListener.jsx` | FCM message handler | ✅ Active |
| `app/src/components/layout/Layout.jsx` | Page wrapper | ✅ Active |
| `app/src/components/layout/Navbar.jsx` | Top navigation | ✅ Active |
| `app/src/components/layout/Sidebar.jsx` | Role-filtered side nav | ✅ Active |

### B. Firestore Collections Reference

| Collection Path | Scope | Description |
|---|---|---|
| `businesses/{biz}` | Business | Root business document |
| `businesses/{biz}/products` | Shared | Product catalog |
| `businesses/{biz}/categories` | Shared | Product categories |
| `businesses/{biz}/customers` | Shared | Customer profiles + loyalty |
| `businesses/{biz}/suppliers` | Shared | Supplier directory |
| `businesses/{biz}/employees` | Shared | Staff records |
| `businesses/{biz}/branches` | Business | Branch definitions |
| `businesses/{biz}/branch_stock_transfers` | Business | Inter-branch stock moves |
| `businesses/{biz}/branches/{br}/sales` | Branch | Transaction records |
| `businesses/{biz}/branches/{br}/inventory` | Branch | Stock levels |
| `businesses/{biz}/branches/{br}/suspended_sales` | Branch | Held transactions |
| `businesses/{biz}/branches/{br}/cash_flow` | Branch | Cash in/out |
| `businesses/{biz}/branches/{br}/purchase_orders` | Branch | POs from suppliers |
| `businesses/{biz}/branches/{br}/expenses` | Branch | Operational expenses |
| `businesses/{biz}/branches/{br}/reconciliations` | Branch | End-of-day register closes |

### C. Role Permissions Matrix

| Feature | Owner | Manager | Cashier |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ |
| POS | ✅ | ✅ | ✅ |
| Sales History | ✅ | ✅ | ✅ |
| Customers | ✅ | ✅ | ✅ |
| Barcode | ✅ | ✅ | ✅ |
| Documentation | ✅ | ✅ | ✅ |
| Help | ✅ | ✅ | ✅ |
| User Profile | ✅ | ✅ | ✅ |
| Products | ✅ | ✅ | ❌ |
| Inventory | ✅ | ✅ | ❌ |
| Suppliers | ✅ | ✅ | ❌ |
| Purchase Orders | ✅ | ✅ | ❌ |
| Accounts Summary | ✅ | ✅ | ❌ |
| Expenses | ✅ | ✅ | ❌ |
| Cash Flow | ✅ | ✅ | ❌ |
| Register Close | ✅ | ✅ | ❌ |
| PO Invoice | ✅ | ✅ | ❌ |
| Employees | ✅ | ❌ | ❌ |
| Branches | ✅ | ❌ | ❌ |
| Reports | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ |
| Import Data | ✅ | ❌ | ❌ |
| Backup & Restore | ✅ | ❌ | ❌ |

### D. Development Roadmap Status (vs README)

| Phase | Description | Status |
|---|---|---|
| Phase 1 | GPOS clone + fabric customization | ✅ Complete |
| Phase 2 | Barcode module | ✅ Complete |
| Phase 3 | Invoice system | ✅ Complete |
| Phase 4 | Testing + Bug fixes | 🔴 Not started |
| **Multi-Branch (unplanned)** | Full multi-branch architecture | ✅ Shipped in v2.0 |
| **Accounts module (unplanned)** | Cash flow, expenses, reconciliation | ✅ Shipped in v2.0 |

> The codebase has significantly **exceeded the original scope** — multi-branch support and full accounts management were not in the original plan but have been delivered. This is impressive scope execution. Phase 4 (testing) is the remaining gap.

---

*Audit prepared by Claude Code — AI-assisted static analysis and architectural review.*
*This audit reflects the codebase state at commit `b73338b` on 25 May 2026.*
*Runtime behavior, deployed Firebase configuration, and Firestore Security Rules were not directly observable and are flagged accordingly.*
