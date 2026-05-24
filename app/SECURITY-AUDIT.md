# Security Audit — Firebase Web App
> Reusable checklist for any Firebase + GitHub project.

---

## Findings

### 1. API Key Exposed in Git History
**Severity:** High  
**Problem:** `.env` file was committed 30+ times across git history. Anyone could run `git log -p` and extract Firebase API keys.  
**Affected:** `VITE_FIREBASE_API_KEY` and other Firebase credentials.

### 2. API Key Unrestricted
**Severity:** High  
**Problem:** Firebase Browser API key had no domain restrictions — anyone with the key could use it from any website or tool.

### 3. `.env` in `.gitignore` (Already Good)
**Severity:** None  
**Finding:** `.env` was correctly listed in `.gitignore`, so future commits are safe. Issue was only with historical commits.

---

## Fixes Applied

### Fix 1 — Restrict API Key to Specific Domains
**Where:** Google Cloud Console → APIs & Services → Credentials → Browser key

**Steps:**
1. Go to `https://console.cloud.google.com/apis/credentials?project=YOUR_PROJECT_ID`
2. Click **"Browser key (auto created by Firebase)"**
3. Under **"Application restrictions"** → select **"Websites"**
4. Under **"Website restrictions"** → add:
   ```
   https://your-app.web.app
   https://your-app.web.app/*
   http://localhost:5173
   http://localhost:5173/*
   ```
5. Click **Save**

**Outcome:** API key only works from your production domain and local dev. Any misuse from external sources is blocked.

---

### Fix 2 — Remove `.env` from Git History
**Tool:** `git-filter-repo`

**Steps:**
```bash
# Step 1 — Install tool
pip install git-filter-repo

# Step 2 — Backup repo first (always!)
cp -r your-project your-project-backup

# Step 3 — Remove .env from entire history
git filter-repo --path .env --invert-paths --force

# Step 4 — Re-add remotes (filter-repo removes them)
git remote add origin https://github.com/USERNAME/REPO.git

# Step 5 — Force push cleaned history
git push origin YOUR_BRANCH --force
```

**Outcome:** `.env` completely erased from all commits. `git log --all -- .env` returns empty.

> **Note:** Force push to `main` may be blocked by branch protection rules.  
> Temporarily disable the rule in GitHub → Settings → Rules → main, push, then re-enable.

---

### Fix 3 — Rotate Exposed Credentials (If Key Was Public)
If the API key was exposed in a **public repo**, always rotate it:

1. **Firebase Console** → Project Settings → Your Apps → Regenerate API key  
   OR  
2. **Google Cloud Console** → Credentials → Delete old key → Create new key
3. Update `.env` locally with new key
4. Redeploy app

**Never rely on restriction alone if the key was already public — rotate it.**

---

## Prevention Checklist (For Every New Project)

- [ ] Add `.env`, `.env.local`, `.env.production` to `.gitignore` before first commit
- [ ] Use `VITE_` prefix for Vite projects (never hardcode keys in source files)
- [ ] Restrict Firebase API key to specific domains immediately after project setup
- [ ] Enable **Firestore Security Rules** — never leave in test mode
- [ ] Run `git log --all -- .env` before making repo public
- [ ] Store secrets in CI/CD environment variables (GitHub Actions Secrets etc.)
- [ ] Rotate keys if repo was ever public with exposed credentials

---

## Firestore Security Rules (Bonus)
Never leave Firestore in test mode (`allow read, write: if true`).  
Minimum recommended rules:

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

---

## Tools Used
| Tool | Purpose |
|---|---|
| `git-filter-repo` | Remove sensitive files from git history |
| Google Cloud Console | Restrict API key to specific domains |
| `git log --all -- .env` | Verify .env presence in history |

---

*Documented after security audit on GPOS project — April 2026*
