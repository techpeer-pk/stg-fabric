# Barcode System — Fabric POS

Yeh document barcode system ki complete detail deta hai.

---

## Barcode Kaise Kaam Karta Hai?

```
Naya Product/Roll Add Karo
           ↓
   System Barcode Banata Hai
   (FAB-2026-00142)
           ↓
   Barcode Label Print Karo
           ↓
   Roll pe Laga Do
           ↓
   Har Stage pe Scan Karo
           ↓
   History Automatically Save Hoti Hai
```

---

## Barcode Format

```
FAB - 2026 - 00142
 ↑     ↑       ↑
Brand  Year  Number
```

**Examples:**
- `FAB-2026-00001` — Pehla roll
- `FAB-2026-00142` — 142wa roll
- `FAB-2027-00001` — Agli saal ka pehla roll

---

## Tracking Stages

Jab bhi koi barcode scan kare, stage select karna hoga:

| Stage | Matlab |
|-------|--------|
| 🟡 Received | Maal factory mein aaya |
| 🔵 In Production | Production mein hai |
| 🟠 QC Check | Quality check ho raha hai |
| ✅ QC Passed | Quality check pass |
| ❌ QC Failed | Quality mein masla — reject |
| 📦 In Warehouse | Warehouse mein ready |
| 🚢 Shipped | Pakistan se bhej diya |
| 📬 Delivered | Customer tak pahunch gaya |
| 💰 Sold | Invoice mein sell ho gaya |

---

## Scan Karne Ke Tarike

### Tarika 1 — USB Barcode Scanner
- Scanner lagao computer se
- Scan page khulle
- Scanner se scan karo — automatic ho jata hai

### Tarika 2 — Phone Camera
- Mobile pe system kholo
- "Scan" button dabao
- Camera se barcode ke saamne rakho
- Automatic detect ho jata hai

---

## Barcode History Example

```
Barcode Scan Kiya: FAB-2026-00142
═══════════════════════════════════

Product  : Cotton White Plain
Roll No  : R-042
Meters   : 150
Category : Cotton

───────────────────────────────────
TRACKING HISTORY:

✅ 12 May 2026 — 10:30 AM
   Stage: Received
   By: Warehouse Staff

✅ 14 May 2026 — 02:15 PM
   Stage: QC Passed
   By: QC Manager

✅ 15 May 2026 — 09:00 AM
   Stage: In Warehouse

✅ 20 May 2026 — 11:45 AM
   Stage: Sold
   Invoice: INV-2026-089
   Customer: Ahmed Textiles, Thailand
   Amount: PKR 67,500
```

---

## Label Print Karna

Barcode label aise dikhega:

```
┌─────────────────────────┐
│   FABRIC POS            │
│                         │
│  |||||||||||||||||||    │
│  FAB-2026-00142         │
│                         │
│  Cotton White Plain     │
│  150 Meters             │
│  PKR 450/m              │
└─────────────────────────┘
```

**Label Size:** 50mm x 30mm (standard sticker size)

---

## Packages Used

```json
"jsbarcode": "^3.11.6",
"html5-qrcode": "^2.3.8",
"react-to-print": "^2.15.1"
```
