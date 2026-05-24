# Invoice System — Fabric POS

---

## Invoice Kaise Banegi?

```
Customer Select Karo
       ↓
Products Add Karo (barcode scan ya manual)
       ↓
Quantity aur Rate Confirm Karo
       ↓
"Invoice Banao" Click Karo
       ↓
Print / PDF / WhatsApp
```

---

## Invoice Example

```
╔═════════════════════════════════════════╗
║          ABC FABRIC FACTORY             ║
║     Shop #5, SITE Area, Karachi         ║
║  Tel: +92-21-XXXXXXXX | NTN: XXXXXXX   ║
╠═════════════════════════════════════════╣
║  Invoice #: INV-2026-089                ║
║  Date: 20 May 2026                      ║
║  Customer: Ahmed Textiles               ║
║  Location: Bangkok, Thailand            ║
╠══════════════╦═══════╦═══════╦══════════╣
║ Product      ║Meters ║ Rate  ║  Total   ║
╠══════════════╬═══════╬═══════╬══════════╣
║ Cotton White ║  150  ║  450  ║  67,500  ║
║ Lawn Blue    ║   80  ║  380  ║  30,400  ║
║ Polyester Rd ║  200  ║  320  ║  64,000  ║
╠══════════════╩═══════╩═══════╬══════════╣
║                    Sub Total ║ 1,61,900 ║
║                    Discount  ║   5,000  ║
║                    TOTAL     ║ 1,56,900 ║
╠══════════════════════════════╩══════════╣
║  Payment: Bank Transfer                 ║
║  Status: PAID ✓                         ║
╚═════════════════════════════════════════╝
```

---

## Invoice Fields

| Field | Required | Auto/Manual |
|-------|----------|-------------|
| Invoice Number | ✅ | Auto (INV-2026-001) |
| Date | ✅ | Auto |
| Customer Name | ✅ | Select from list |
| Customer Location | ✅ | Auto (from profile) |
| Products | ✅ | Scan ya Manual |
| Quantity (Meters) | ✅ | Manual |
| Rate per Meter | ✅ | Auto (from product) |
| Discount | ❌ Optional | Manual |
| Payment Method | ✅ | Select |
| Payment Status | ✅ | Paid / Unpaid / Partial |
| Notes | ❌ Optional | Manual |

---

## Currency Support

| Country | Currency | Symbol |
|---------|----------|--------|
| Pakistan | Pakistani Rupee | PKR |
| Thailand | US Dollar | USD |
| International | US Dollar | USD |

> Currency invoice banate waqt select karo.

---

## Invoice Share Karna

### Print
- A4 size mein print hogi
- Browser print dialog khulega
- Direct printer se print

### PDF Download
- PDF file download hogi
- Share kar sako email pe

### WhatsApp Share
- WhatsApp Web pe share button
- Customer ka number select karo
- Invoice image send ho jaye

---

## Invoice Status

| Status | Matlab |
|--------|--------|
| 🟡 Draft | Abhi complete nahi |
| 🔵 Sent | Customer ko bhej di |
| ✅ Paid | Payment aa gayi |
| ❌ Unpaid | Payment nahi aayi |
| 🟠 Partial | Adhi payment aayi |

---

## Invoice History

Har customer ka invoice history:

```
Ahmed Textiles — Invoice History
─────────────────────────────────
INV-2026-089  |  20 May 2026  |  PKR 1,56,900  |  ✅ Paid
INV-2026-072  |  05 May 2026  |  PKR 98,400    |  ✅ Paid
INV-2026-055  |  18 Apr 2026  |  USD 890       |  🟠 Partial
─────────────────────────────────
Total Purchases: PKR 3,24,500 + USD 890
Outstanding: USD 450
```
