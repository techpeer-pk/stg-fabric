# Fabric POS — Pre-Production Testing Checklist
**Project:** STG Fabric | **URL:** https://stg-fabric.web.app  
**Date:** 2026-06-28 | **Tester:** ___________

Legend: ✅ Pass | ❌ Fail | ⏭ Skip

---

## 1. AUTH & LOGIN

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 1.1 | Owner login | Dashboard loads, role = "owner" shown in navbar | | |
| 1.2 | Manager login | Dashboard loads, role = "manager" | | |
| 1.3 | Cashier login | Dashboard loads, role = "cashier" | | |
| 1.4 | Wrong password | Error message shown, no crash | | |
| 1.5 | Logout | Redirects to login, localStorage cleared | | |
| 1.6 | Page refresh | Stays logged in (auth persists) | | |
| 1.7 | Direct URL access (logged out) | Redirects to /login | | |

---

## 2. SIDEBAR / NAVIGATION

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 2.1 | Owner sidebar | All sections visible (Main, Inventory, Sales, Reports, Accounts, Management) | | |
| 2.2 | Manager sidebar | Same as owner minus employee management | | |
| 2.3 | Cashier sidebar | Only: Dashboard, POS, Sales, Customers, Help | | |
| 2.4 | Cashier — no Barcode link | Barcode page NOT in cashier menu | | |
| 2.5 | Cashier — no Accounts link | Accounts NOT in cashier menu | | |
| 2.6 | Active link highlight | Current page highlighted in sidebar | | |
| 2.7 | Mobile menu toggle | Hamburger opens/closes sidebar | | |

---

## 3. DASHBOARD

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 3.1 | KPI cards load | Revenue, Sales count, Customers shown | | |
| 3.2 | Currency correct | Shows PKR (or whatever is set in Settings) | | |
| 3.3 | Branch name shown | Correct branch name in header | | |
| 3.4 | Charts render | No blank/broken charts | | |

---

## 4. POS (Point of Sale)

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 4.1 | Products list loads | All products shown with stock | | |
| 4.2 | Search product | Filters correctly | | |
| 4.3 | Add to cart | Product added, quantity = 1 | | |
| 4.4 | Out of stock product | Toast error: "is out of stock", NOT added to cart | | |
| 4.5 | Increase qty beyond stock | Toast error: "Only X in stock", qty capped | | |
| 4.6 | Remove item from cart | Item removed, total recalculated | | |
| 4.7 | Checkout — empty cart | Toast: "Cart is empty!" | | |
| 4.8 | Checkout — cash, no amount entered | Toast: "Please enter amount paid!" | | |
| 4.9 | Checkout — amount less than total | Toast: "Amount paid is less than total!" | | |
| 4.10 | Checkout — 0 price item | Toast: "Some items have invalid price" | | |
| 4.11 | Successful sale | Invoice shown, stock reduced, sale saved | | |
| 4.12 | Currency in cart | Shows correct currency (PKR/USD/etc) | | |
| 4.13 | Hold sale | Cart saved as suspended | | |
| 4.14 | Resume held sale | Cart restored correctly | | |
| 4.15 | Barcode scan | Product found and added | | |
| 4.16 | Walk-in customer | Sale completes without customer selected | | |
| 4.17 | Select customer | Customer attached to sale, points applied | | |

---

## 5. INVOICE

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 5.1 | Invoice shows business name | Correct business name from Settings | | |
| 5.2 | NO hardcoded "Karachi, Pakistan" | Address only shows if set in Settings | | |
| 5.3 | Download PDF | PDF downloads correctly | | |
| 5.4 | WhatsApp share | Opens WhatsApp with invoice image | | |
| 5.5 | Invoice totals match | Subtotal, tax, discount, total all correct | | |
| 5.6 | Currency on invoice | Correct currency symbol | | |

---

## 6. PRODUCTS

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 6.1 | Products list loads | Table with search, sort, pagination | | |
| 6.2 | Add product | Product saved, appears in list | | |
| 6.3 | Price field — negative not allowed | Cannot enter negative price (min=0) | | |
| 6.4 | Cost price — negative not allowed | Cannot enter negative cost price | | |
| 6.5 | Edit product | Changes saved correctly | | |
| 6.6 | Delete product | Product + all inventory records deleted (cascade) | | |
| 6.7 | Cashier view | No Add/Edit/Delete buttons visible | | |
| 6.8 | Sort by name/price/stock | Sorts correctly | | |
| 6.9 | Search | Filters by name/barcode | | |
| 6.10 | Pagination | 10/25/50/100 rows, page navigation works | | |

---

## 7. INVENTORY

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 7.1 | Inventory loads | All products with stock shown | | |
| 7.2 | No "Unknown Product" rows | Orphaned records filtered out | | |
| 7.3 | Stock adjust | Quantity updates correctly | | |
| 7.4 | Low stock items | Highlighted or flagged | | |
| 7.5 | Stock = 0 items | Shown as "Out of Stock" | | |

---

## 8. SALES HISTORY

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 8.1 | Sales list loads | All sales shown | | |
| 8.2 | Currency in totals | Correct currency (not hardcoded PKR) | | |
| 8.3 | Owner — Delete button visible | Red delete button shown per row | | |
| 8.4 | Manager — Delete button visible | Delete button shown | | |
| 8.5 | Cashier — Delete button hidden | No delete button for cashier | | |
| 8.6 | Delete sale | Sale removed, confirmation shown | | |
| 8.7 | View invoice | Invoice modal opens correctly | | |
| 8.8 | Date filter | Filters sales by date range | | |
| 8.9 | Search sales | Filters by customer/amount | | |

---

## 9. CUSTOMERS

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 9.1 | Customer list loads | All customers shown | | |
| 9.2 | Currency in "Gross Expenditure" | Correct currency (not hardcoded PKR) | | |
| 9.3 | Owner/Manager — Review + Purge buttons | Edit/delete visible | | |
| 9.4 | Cashier — "Immutable" label | No edit/delete, shows "Immutable" | | |
| 9.5 | Add customer | Customer saved | | |
| 9.6 | Edit customer | Changes saved | | |
| 9.7 | Delete customer | Customer removed | | |
| 9.8 | Loyalty points | Points calculated correctly from sales | | |

---

## 10. BARCODE PAGE

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 10.1 | Table loads | All barcodes shown with S.No | | |
| 10.2 | Search | Filters by product name/barcode | | |
| 10.3 | Sort columns | Sorts by name/barcode/price | | |
| 10.4 | Rows per page | 10/25/50/100 dropdown works | | |
| 10.5 | Pagination footer | Page 1 of N, prev/next buttons | | |
| 10.6 | Print barcode | Zebra printer, Portrait, CODE128, darkness 0 | | |
| 10.7 | Cashier — no Barcode access | /barcode redirects or shows 403 | | |

---

## 11. REPORTS

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 11.1 | Reports load | Charts and tables render | | |
| 11.2 | Currency correct | Correct currency throughout | | |
| 11.3 | Date range filter | Filters data correctly | | |
| 11.4 | Top products | Shows correct best-sellers | | |
| 11.5 | Export/Download | PDF or CSV works | | |

---

## 12. ACCOUNTS

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 12.1 | Summary loads | Revenue, Expenses, Net Profit shown | | |
| 12.2 | Period filter (Today/Month/Year) | Numbers change correctly | | |
| 12.3 | Net Profit = Revenue - COGS - Expenses | Math is correct | | |
| 12.4 | Add expense | Saved, Summary updates | | |
| 12.5 | Edit expense | Changes saved | | |
| 12.6 | Delete expense | Removed | | |
| 12.7 | Cash Flow — add entry | Saved with correct +/- sign | | |
| 12.8 | Register Reconciliation | End-of-day count works | | |

---

## 13. SETTINGS

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 13.1 | Settings load | Current values shown | | |
| 13.2 | Change currency (e.g. USD) | Saved, all pages now show USD | | |
| 13.3 | Currency persists on refresh | Still USD after F5 | | |
| 13.4 | Change business name | Reflected in invoice | | |
| 13.5 | Add address | Shows on invoice, replaces blank | | |
| 13.6 | Tax settings | Tax rate applied in POS | | |

---

## 14. EMPLOYEES (Management)

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 14.1 | Employee list loads | All staff shown | | |
| 14.2 | Add employee | Account created, role set | | |
| 14.3 | Remove employee | Removed from both collections | | |
| 14.4 | Cashier — no access | Management not in cashier sidebar | | |

---

## 15. NAVBAR & USER PROFILE

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 15.1 | Name + avatar clickable | Navigates to /user-settings | | |
| 15.2 | Hover effect on name | Blue color on hover | | |
| 15.3 | Online/Offline badge | Shows correct connectivity status | | |
| 15.4 | Dark mode toggle | Switches theme, persists on refresh | | |

---

## 16. PERFORMANCE & EDGE CASES

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 16.1 | First load time | App loads under 3 seconds | | |
| 16.2 | Offline mode | "Offline Mode" badge shown, app doesn't crash | | |
| 16.3 | Back button navigation | No unexpected reloads or blank pages | | |
| 16.4 | Mobile (375px) | All pages usable on mobile | | |
| 16.5 | Fast repeated clicks | No duplicate sales/expenses created | | |
| 16.6 | Empty states | "No data" shown (not blank/broken) | | |

---

## BUGS FOUND DURING TESTING

| # | Page | Bug Description | Severity | Fixed? |
|---|------|-----------------|----------|--------|
| | | | | |
| | | | | |
| | | | | |

---

## SIGN-OFF

- [ ] All critical tests (auth, POS, sales, inventory) passed
- [ ] Currency correct on all pages
- [ ] No hardcoded addresses in invoice
- [ ] Role-based access verified for all 3 roles
- [ ] Ready for client demo

**Tested by:** ___________ **Date:** ___________
