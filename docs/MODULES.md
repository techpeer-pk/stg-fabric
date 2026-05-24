# Modules Detail — Fabric POS

Yeh document har module ki detail batata hai — kya kaam karta hai, kya data store karta hai, aur kaisa dikhta hai.

---

## Module 1 — Auth / Login

**Source:** GPOS se lena (minor changes)

### Kya Karta Hai
- Secure login system
- Role-based access (Admin, Manager, Cashier, Warehouse)
- Auto logout after inactivity

### Roles
```
Admin     → Sab kuch dekh aur change kar sakta hai
Manager   → Sales, Reports, Inventory
Cashier   → Sirf POS aur Invoice
Warehouse → Sirf Barcode scan aur stock update
```

---

## Module 2 — Dashboard

**Source:** GPOS se customize

### Kya Dikhta Hai
- Aaj ki total sales
- Total stock (meters mein)
- Pending invoices count
- Low stock alert
- Weekly sales chart (simple bar chart)

---

## Module 3 — Products

**Source:** GPOS se customize

### Fabric-Specific Fields
| Field | Example |
|-------|---------|
| Product Name | Cotton White Plain |
| Category | Cotton / Polyester / Silk / Lawn |
| Color | White, Blue, Red |
| Width | 44 inch / 58 inch |
| Unit | Meters / Roll |
| Price per Meter | PKR 450 |
| Barcode | Auto-generated |

### Kya Karta Hai
- Naya product add karo
- Barcode auto-generate hota hai
- Stock automatically update hoti hai jab sale ho

---

## Module 4 — Barcode System ← NEW

**Source:** Naya banana hai (JsBarcode + html5-qrcode)

### 2 Parts Hain

#### Part A — Barcode Generate
- Product ya roll select karo
- System unique barcode banata hai
- Label print karo (sticker ke liye)

#### Part B — Barcode Scan
- Camera ya USB scanner se scan karo
- Product ki puri history saamne aaye:

```
Barcode: FAB-2026-00142
─────────────────────────────
Product  : Cotton White Plain
Roll No  : R-042
Meters   : 150m
─────────────────────────────
HISTORY:
✅ 12 May 2026 — Warehouse mein aaya
✅ 14 May 2026 — QC Pass
✅ 18 May 2026 — Invoice #INV-089 mein sell hua
   Customer: Ahmed Textiles, Thailand
```

### Barcode Format
```
FAB-{YEAR}-{5-digit-number}
Example: FAB-2026-00142
```

---

## Module 5 — Sales Tracking

**Source:** GPOS se lena (minor changes)

### Kya Store Hota Hai
| Field | Detail |
|-------|--------|
| Sale ID | Auto-generated |
| Date & Time | Automatic |
| Customer | Customer profile se |
| Products | Kya kya bika |
| Quantity | Kitne meters |
| Total Amount | PKR / THB / USD |
| Payment Method | Cash / Bank Transfer |
| Invoice No | Link to invoice |

### Reports
- Aaj ki sales
- Is hafte ki sales
- Is mahine ki sales
- Customer ke hisaab se sales
- Product ke hisaab se sales

---

## Module 6 — Invoice System ← NEW

**Source:** Naya banana hai (react-to-print)

### Invoice Mein Kya Hoga
```
┌─────────────────────────────────────┐
│  FABRIC FACTORY NAME                │
│  Karachi, Pakistan                  │
│  Tel: +92-XXX-XXXXXXX               │
├─────────────────────────────────────┤
│  Invoice #: INV-2026-089            │
│  Date: 18 May 2026                  │
│  Customer: Ahmed Textiles           │
├────────────┬────────┬───────┬───────┤
│ Product    │ Meters │ Rate  │ Total │
├────────────┼────────┼───────┼───────┤
│ Cotton Wht │  150m  │ 450   │67,500 │
│ Lawn Blue  │   80m  │ 380   │30,400 │
├────────────┴────────┴───────┼───────┤
│                    TOTAL    │97,900 │
└─────────────────────────────┴───────┘
```

### Invoice Features
- Print karo (A4)
- PDF download karo
- WhatsApp pe share karo
- Pakistan (PKR) aur Thailand (USD/THB) dono formats

---

## Module 7 — Inventory

**Source:** GPOS se lena (minor changes)

### Kya Track Karta Hai
- Total stock per product (meters mein)
- Low stock alert (e.g. 50 meters se kam ho toh alert)
- Stock automatically ghatti hai jab sale ho
- Manual stock adjustment bhi kar sakte hain

---

## Module 8 — Customers

**Source:** GPOS se lena

### Customer Profile
| Field | Detail |
|-------|--------|
| Name | Customer/Company naam |
| Location | Karachi / Thailand / Other |
| Phone | Contact number |
| Total Purchases | Kitna kharida |
| Outstanding | Kitna baaki hai |
| Purchase History | Sari invoices |

---

## Module 9 — Reports

**Source:** GPOS se customize

### Available Reports
| Report | Description |
|--------|-------------|
| Daily Sales | Aaj kya bika |
| Monthly Summary | Is mahine ka overview |
| Product-wise | Har fabric ki sales |
| Customer-wise | Har customer ki purchases |
| Stock Report | Current inventory |
| Low Stock Alert | Kam stock wale products |
