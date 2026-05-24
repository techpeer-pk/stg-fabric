# Fabric POS — Fabric Factory Management System

> **Based on:** [GPOS](https://github.com/Silverado313/gpos) (Open Source POS)
> **Client:** Fabric Factory, Karachi, Pakistan
> **Operations:** Pakistan → Thailand
> **Built with:** React 19 + Firebase + Tailwind CSS

---

## Yeh System Kya Karta Hai?

Yeh system ek fabric factory ke liye banaya gaya hai jo:

- Products ko **barcode** se track kare — production se lekar sale tak
- **Simple invoices** banaye aur print/share kare
- **Sales track** kare — kya bika, kab bika, kisko bika

---

## 3 Core Features

### 1. Barcode Tracking
Har product/roll ko ek unique barcode milta hai.
Barcode scan karo — puri history saamne aa jaye.

```
Maal Aaya → Barcode Laga → Production → QC → Warehouse → SOLD ✓
```

### 2. Sales Tracking
- Har sale record hoti hai
- Customer ka naam, date, amount sab store hota hai
- Daily / Monthly reports

### 3. Simple Invoicing
- Ek click mein invoice ready
- Print ya WhatsApp pe share
- Pakistan aur Thailand dono ke liye

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Tailwind CSS |
| State Management | Zustand |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Barcode | JsBarcode + html5-qrcode |
| Print | react-to-print |
| Build Tool | Vite |
| Hosting | Firebase Hosting |

---

## System Modules

| Module | Status | Description |
|--------|--------|-------------|
| Auth / Login | ✅ GPOS se lena | Role-based login |
| Dashboard | ✅ GPOS se customize | Sales overview |
| Products | ✅ GPOS se customize | Fabric products manage karo |
| Barcode | 🔨 New banana hai | Generate + Scan |
| Sales | ✅ GPOS se lena | Sales record |
| Invoice | 🔨 New banana hai | Invoice generate + print |
| Inventory | ✅ GPOS se lena | Stock track karo |
| Customers | ✅ GPOS se lena | Customer profiles |
| Reports | ✅ GPOS se customize | Sales reports |

---

## User Roles

| Role | Access |
|------|--------|
| Admin (Owner) | Sab kuch |
| Manager | Sales, Inventory, Reports |
| Cashier | Sirf POS + Invoice |
| Warehouse | Sirf Barcode scan + Stock |

---

## Project Structure

```
fabric-pos/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/
│   │   ├── auth/         # Login page
│   │   ├── dashboard/    # Main dashboard
│   │   ├── products/     # Product management
│   │   ├── barcode/      # Barcode generate + scan  ← NEW
│   │   ├── sales/        # Sales tracking
│   │   ├── invoice/      # Invoice system           ← NEW
│   │   ├── inventory/    # Stock management
│   │   ├── customers/    # Customer profiles
│   │   └── reports/      # Reports
│   ├── firebase/         # Firebase config
│   ├── store/            # Zustand state
│   └── utils/            # Helper functions
├── docs/
│   ├── MODULES.md        # Har module ki detail
│   ├── SETUP.md          # Installation guide
│   ├── BARCODE.md        # Barcode system guide
│   └── INVOICE.md        # Invoice system guide
├── README.md
└── package.json
```

---

## Quick Start

```bash
# 1. Clone karo
git clone https://github.com/Silverado313/gpos.git fabric-pos
cd fabric-pos

# 2. Dependencies install karo
npm install

# 3. Extra packages add karo
npm install jsbarcode html5-qrcode react-to-print

# 4. Firebase setup karo (.env file)
cp .env.example .env.local
# .env.local mein apni Firebase keys daalo

# 5. Run karo
npm run dev
```

---

## Development Phases

| Phase | Kaam | Estimated Time |
|-------|------|---------------|
| Phase 1 | GPOS clone + Fabric ke liye customize | 1 week |
| Phase 2 | Barcode module | 1 week |
| Phase 3 | Invoice system | 3-4 days |
| Phase 4 | Testing + Bug fixes | 3-4 days |
| **Total** | | **~3-4 weeks** |

---

## Docs

- [Modules Detail](docs/MODULES.md)
- [Setup Guide](docs/SETUP.md)
- [Barcode System](docs/BARCODE.md)
- [Invoice System](docs/INVOICE.md)

---

## License

MIT — Based on [GPOS](https://github.com/Silverado313/gpos) by Silverado313
