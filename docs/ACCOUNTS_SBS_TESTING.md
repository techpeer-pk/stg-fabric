# Accounts & Sales — Step-By-Step (SBS) Test Plan

Manual end-to-end test plan for the accounts/sales/cash-ledger changes on the
`fix/accounts-financial-audit` branch. Every step lists **exact expected values**
so each fix can be verified precisely.

- **Currency assumed:** THB
- **Environment:** https://stg-fabric.web.app (or `localhost` dev server)
- **Login:** Owner account (some features are owner-only)

## What this verifies (the fixes under test)

| Area | Fix |
|---|---|
| Sales revenue | Uses `finalAmount` (was `s.total` → always 0) |
| Currency | Read from nested business `settings.currency` (was always PKR) |
| Cash ledger (IFRS) | Cash sales post `cash_flow` inflows; **cash-settled expenses** post outflows; bank/card expenses hit P&L only |
| Reconciliation | Outflow **sign fix** in `expectedCash` (was adding outflow) |
| Outstanding credit | Credit sales keep their unpaid balance (receivable) |
| Consistency | Vault Liquidity == Cash Flow balance == Reconciliation target |

## Progress

- [x] **Phase 0** — Clean slate
- [x] **Phase 1** — Create dummy data
- [x] **Phase 2** — Verify pages (Sales / Cash Flow / Accounts Summary / Reconciliation)
- [ ] **Phase 3** — Sync tests (expense ↔ cash ledger) — _pending_
- [ ] **Phase 4** — Reconciliation cycle (close & re-open) — _pending_

---

## Phase 0 — Clean slate _(optional; also tests the Delete feature)_

`/backup` → **Delete Data** → select **Sales, Cash Flow, Expenses, Reconciliations**
→ **Delete Selected** → type `DELETE` in the prompt.

- [ ] Progress bar + operation log run
- [ ] Those pages now show 0 records

---

## Phase 1 — Create dummy data

### A) 4 Sales (`/pos` — add any item to the cart for each)

| # | Payment | finalAmount | Notes |
|---|---|---|---|
| 1 | **Cash**   | THB 1,000 | Amount Paid = 1000 |
| 2 | **Cash**   | THB 500   | Amount Paid = 500 |
| 3 | **Card**   | THB 2,000 | — |
| 4 | **Credit** | THB 3,000 | pay nothing (udhaar) |

> To exercise COGS, the sold product must have a **costPrice** (Products page). Otherwise COGS = 0.

### B) 2 Expenses (`/expenses` → Initialize Expense Record)

| Title | Amount | Payment Method |
|---|---|---|
| Rent | THB 800 | **Cash** |
| Internet | THB 200 | **Bank / Card** |

### C) 2 Manual cash movements (`/cash-flow`)

| Type | Amount | Reason |
|---|---|---|
| **Inflow**  | THB 5,000 | Float injection |
| **Outflow** | THB 300   | Petty cash |

---

## Phase 2 — Verify pages

### Sales `/sales`

| Field | Expected | Verifies |
|---|---|---|
| Total Transactions | **4** | |
| Total Revenue | **THB 6,500** | `finalAmount` fix |
| **Outstanding Credit** | **THB 3,000** | receivable indicator |
| Credit row (#4) | "Due: THB 3,000" badge | `amountPaid` fix |
| Cash/Card rows | no "Due" | |

- [ ] Verified

### Cash Flow `/cash-flow`

- **Register Balance = THB 5,400**  →  `1000 + 500 − 800 (Rent) + 5000 − 300`
- List shows **5 entries**, including **Rent (−800)** auto-synced from the expense
- Card sale, Credit sale, and Internet (bank) expense do **NOT** appear (not cash movements)

- [ ] Verified

### Accounts Summary `/accounts-summary` (period: **Month**)

| Field | Expected |
|---|---|
| Total Revenue | THB 6,500 |
| Operational Outflow (Expenses, P&L) | **THB 1,000** (Rent + Internet, both) |
| **Vault Liquidity** | **THB 5,400** |
| Net Profit | 6,500 − COGS − 1,000 |

> **Headline check:** Vault Liquidity (5,400) **==** Cash Flow Register Balance (5,400). These did not match before.

- [ ] Verified

### Register Reconciliation `/register-reconciliation`

| Field | Expected | Verifies |
|---|---|---|
| Starting Float | THB 0 (first run) | |
| Verified Inflow | +THB 6,500 (1000+500+5000) | |
| Authorized Outflow | −THB 1,100 (800+300) | **sign fix** |
| **Theoretical Drawer Target** | **THB 5,400** | was **7,600** before the fix |
| Actual Cash = 5,400 | Variance **0 · BALANCED** | |
| Actual Cash = 5,300 | −100 · **SHORTFALL** | |
| Actual Cash = 5,500 | +100 · **SURPLUS** | |

- [ ] Verified

---

## Phase 3 — Sync tests (expense ↔ cash ledger) _(pending)_

1. Edit **Rent (Cash)** 800 → 1,000  →  Cash Flow balance **5,400 → 5,200**; Reconciliation target → 5,200.
2. Change **Rent** Payment Method **Cash → Bank**  →  its `cash_flow` outflow is **deleted**  →  balance **5,200 → 6,200** (Rent still in P&L expenses).
3. Delete a **cash** expense  →  its `cash_flow` entry is also removed.

- [ ] Verified

---

## Phase 4 — Reconciliation cycle _(pending)_

Enter Actual Cash = 5,400 → **Secure & Terminal Close** → saved → reopen the page.

- [ ] Starting Float now shows **5,400** (last close); new period starts from 0.

---

## Known caveats

1. **Legacy credit sale** (e.g. old `#F5GTOU`) will not show "Due" — it was stored `paid = full` under the old bug. Only **new** credit sales track outstanding correctly.
2. **Deleting Sales via Backup** does not remove their auto `cash_flow` inflow entries (they aren't linked) — delete **Cash Flow** in the same pass (see Phase 0).

---

_Related branch: `fix/accounts-financial-audit`. See commits for AccountsSummary,
Expenses, CashFlow, RegisterReconciliation, POS, Sales, and Backup changes._
