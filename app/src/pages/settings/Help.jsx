import { useState } from 'react'
import Layout from '../../components/layout/Layout'
import {
    Home, Rocket, Package, HelpCircle, Wrench,
    LayoutDashboard, ShoppingBag, ScanBarcode, Warehouse,
    ShoppingCart, FileText, Users, BarChart2, Settings,
    CheckCircle2, ChevronDown, Phone, Mail, Zap, Globe,
    Lock, Cloud, ArrowRight, Factory, Info, AlertTriangle,
    Star, Layers, Tag, Ruler, Printer, FileDown, Share2,
    QrCode, PenLine
} from 'lucide-react'

function Help() {
    const [activeTab, setActiveTab] = useState('overview')
    const [expandedFaq, setExpandedFaq] = useState(null)

    const tabs = [
        { id: 'overview',        label: 'Overview',       Icon: Home },
        { id: 'getting-started', label: 'Getting Started', Icon: Rocket },
        { id: 'modules',         label: 'Modules',        Icon: Package },
        { id: 'faq',             label: 'FAQ',            Icon: HelpCircle },
        { id: 'troubleshooting', label: 'Troubleshooting', Icon: Wrench },
    ]

    const toggleFaq = (id) => setExpandedFaq(expandedFaq === id ? null : id)

    // ── FAQ Data ───────────────────────────────────────────────────────────────
    const faqItems = [
        {
            id: 1,
            question: "Login kaise karein?",
            answer: "Admin apko email aur password dega. Woh email/password likh kar Login button dabayein. Pehli baar login par Dashboard khul jayega."
        },
        {
            id: 2,
            question: "Naya user kaise add karein?",
            answer: "Users sirf admin hi add karta hai — Firebase Console mein jayein → Authentication → Add User. Phir Firestore mein users collection mein uska document banayein jis mein role (cashier, manager, etc.) set karein. Self-registration band hai taake koi bhi system mein na ghusse."
        },
        {
            id: 3,
            question: "Barcode generate hone ke baad kya karein?",
            answer: "Barcode generate karne ke baad, uski label print karein aur fabric roll ya bundle pe chipka dein. Jab bhi scan karein — system us fabric ki poori history aur stage dikhayega."
        },
        {
            id: 4,
            question: "Fabric ki stage update kaise hoti hai?",
            answer: "Barcode page mein Scan tab kholo → Camera se barcode scan karo → System fabric ki details dikhayega → 'Update Stage' se naya status set karo (e.g., warehouse → shipped)."
        },
        {
            id: 5,
            question: "Invoice kaise share karein WhatsApp pe?",
            answer: "Sale complete karne ke baad Invoice page pe jayein → 📱 WhatsApp button dabayein → System invoice ki image ya link direct WhatsApp share mein khol dega."
        },
        {
            id: 6,
            question: "Pakistan se Thailand ki branch alag manage hogi?",
            answer: "Haan! Har branch ka data alag hota hai — Karachi branch ka stock alag, Thailand branch ka alag. Dashboard mein upar branch switch kar sakte ho."
        },
        {
            id: 7,
            question: "Currency PKR ke ilawa aur use kar sakte hain?",
            answer: "Haan! Settings mein Currency mein THB (Thai Baht), USD, AED, EUR sab available hain. Har branch ki alag currency ho sakti hai."
        },
        {
            id: 8,
            question: "Sale undo ya return kaise karein?",
            answer: "Sales page pe jao → Sale dhundo → Return button dabao → Confirm karo. System stock wapas update kar dega automatically."
        },
        {
            id: 9,
            question: "Low stock alert kab aata hai?",
            answer: "Jab kisi product ki quantity minimum threshold se neeche aa jaye — Dashboard pe alert show hota hai aur Inventory page pe woh item red mein highlight hota hai."
        },
        {
            id: 10,
            question: "Data safe hai? Internet band ho to kya hoga?",
            answer: "Data Firebase (Google) ke servers pe save hota hai — bilkul safe hai. Internet band ho to system kuch der ke liye kaam karta raha sakta hai, lekin sale complete karne ke liye internet zaroori hai."
        }
    ]

    // ── Modules walkthrough content ──────────────────────────────────────────
    const modules = [
        {
            id: 'dashboard',
            Icon: LayoutDashboard,
            title: 'Dashboard',
            color: 'blue',
            steps: [
                { step: 'Overview Cards', detail: 'Khulte hi aaj ki Total Sales, Total Revenue, Products count, aur Low Stock alerts ek nazar mein dikhte hain.' },
                { step: 'Sales Chart', detail: 'Graph mein is hafte ki daily sales trend dekh sakte ho — kis din zyada bikri hui.' },
                { step: 'Recent Sales', detail: 'Neeche ki taraf aaj ki 5 latest sales list hoti hain — customer name, amount, status sab dikhta hai.' },
                { step: 'Low Stock Alert', detail: 'Agar koi fabric/product stock threshold se neeche hai to yahan warning show hogi — stock bharo warna sale ruk sakti hai.' },
            ]
        },
        {
            id: 'products',
            Icon: Layers,
            title: 'Products (Fabric Catalog)',
            color: 'purple',
            steps: [
                { step: 'Product List', detail: 'Ye aap ki poori fabric catalog hai — naam, category, price, cost, stock unit sab yahan listed hai.' },
                { step: 'Naya Product Add karo', detail: '"Add Product" button dabao → Name (e.g., "Lawn Print A12"), Price per meter, Cost Price, Category, Unit (meters/yards/roll) bharein → Fabric Type (Cotton, Linen, Silk...), Color, Width (inches) bhi fill karein → Save karo.' },
                { step: 'Product Edit/Delete', detail: 'Kisi product ka ✏️ Edit ya 🗑️ Delete icon dabao. Delete karne se inventory record bhi hata deta hai — sooch samajh ke karo.' },
                { step: 'Barcode Field', detail: 'Product form mein Barcode field hai — manually likh sakte ho ya Barcode module se generate kar ke yahan paste kar sakte ho.' },
            ]
        },
        {
            id: 'barcode',
            Icon: ScanBarcode,
            title: 'Barcode System',
            color: 'orange',
            steps: [
                {
                    step: '1. Generate Barcode',
                    detail: 'Barcode tab kholo → "Generate New" pe click karo → Product select karo (ya manually fabric ka naam likho) → Generate dabao. System automatically FAB-2025-XXXXX format ka unique barcode banata hai.'
                },
                {
                    step: '2. Label Print karo',
                    detail: 'Generate hone ke baad barcode image dikhta hai — Print button se label print karo aur fabric roll ya bundle pe chipka do. Ye hi iska "identity card" hai.'
                },
                {
                    step: '3. Scan & Track karo',
                    detail: 'Scan tab mein jao → Camera on karo → Barcode ke saamne rakho → System us fabric ki poori details dikhayega: naam, stage, product link, kab create hua.'
                },
                {
                    step: '4. Stage Update karo',
                    detail: 'Scan ke baad "Update Stage" section aata hai — yahan stage change karo: Received → Production → QC Check → QC Passed → Warehouse → Shipped → Delivered → Sold. Har update ka timestamp automatic save hota hai.'
                },
                {
                    step: '5. History dekho',
                    detail: 'History tab mein saare generated barcodes ki list hai — search, filter by stage kar sakte ho. Koi bhi barcode click karo to poori tracking history milegi.'
                },
            ]
        },
        {
            id: 'inventory',
            Icon: Warehouse,
            title: 'Inventory',
            color: 'teal',
            steps: [
                { step: 'Stock Levels', detail: 'Har product ki current quantity, minimum threshold, aur unit yahan dikhti hai. Red mein highlighted item matlab low stock — turant refill karo.' },
                { step: 'Stock Adjust karo', detail: '"Adjust" button se manually stock badhao ya ghataao — jaise nayi shipment aai to +500 meters, ya koi product damaged hua to -20.' },
                { step: 'Min Stock Set karo', detail: 'Minimum quantity set karo — jab stock is level se neeche jaye, alert aa jata hai Dashboard pe.' },
            ]
        },
        {
            id: 'sales-pos',
            Icon: ShoppingCart,
            title: 'Sales / POS (Sale karna)',
            color: 'green',
            steps: [
                { step: '1. POS page kholo', detail: 'Left menu mein "Sales" → "POS" pe click karo. Yahan fabric sale ka main screen hai.' },
                { step: '2. Product select karo', detail: 'Search bar mein fabric ka naam ya barcode type karo — product list mein aa jayega. Click karo ya barcode scan karo — cart mein add ho jayega.' },
                { step: '3. Quantity set karo', detail: 'Cart mein quantity adjust karo (kitne meters chahiye). Price automatic calculate hoga.' },
                { step: '4. Customer add karo (optional)', detail: 'Agar registered customer hai to select karo — uski purchase history mein add hoga aur loyalty points milenge agar enabled ho.' },
                { step: '5. Payment karo', detail: 'Cash, Bank Transfer, ya Credit method select karo → Amount paid likho → "Complete Sale" dabao. Sale Firestore mein save ho jata hai.' },
                { step: '6. Invoice dekho', detail: 'Sale complete hone ke baad "View Invoice" button aata hai — professional A4 invoice khulta hai complete fabric details ke saath.' },
            ]
        },
        {
            id: 'invoice',
            Icon: FileText,
            title: 'Invoice System',
            color: 'indigo',
            steps: [
                { step: 'Invoice auto-generate', detail: 'Har sale pe automatically INV-2025-XXXXX number wala invoice ready hota hai — koi extra kaam nahi.' },
                { step: '🖨️ Print karo', detail: 'Invoice page pe "Print" button — browser ka print dialog khulta hai, A4 size pe perfect print aata hai.' },
                { step: '📄 PDF download karo', detail: '"PDF" button dabao — ek second mein PDF file download hoti hai. Client ko email pe bheji ja sakti hai.' },
                { step: '📱 WhatsApp pe share karo', detail: '"WhatsApp" button se invoice ki image ya link direct share ho jata hai — client ko phone pe milti hai invoice.' },
                { step: 'QR Code', detail: 'Har invoice pe ek QR code hota hai — client phone se scan kare to invoice ka online version khul jata hai verify karne ke liye.' },
                { step: 'Authorized Signature', detail: 'Invoice ke neeche Authorized Signature ka box hai — print karke sign karo aur client ko dein.' },
            ]
        },
        {
            id: 'customers',
            Icon: Users,
            title: 'Customers',
            color: 'pink',
            steps: [
                { step: 'Customer add karo', detail: 'Customers page → "Add Customer" → Naam, phone, email bharein → Save. Ab POS mein sale karte waqt yeh customer select ho sakta hai.' },
                { step: 'Purchase History', detail: 'Kisi bhi customer pe click karo — uski poori purchase history dikhegi: kab kya kharida, kitna total spent.' },
                { step: 'Loyalty Points', detail: 'Agar Settings mein loyalty enable hai, to har sale pe customer points earn karta hai. Agli purchase pe redeem kar sakta hai.' },
            ]
        },
        {
            id: 'reports',
            Icon: BarChart2,
            title: 'Reports',
            color: 'yellow',
            steps: [
                { step: 'Sales Report', detail: 'Date range select karo — us period ki total sales, revenue, aur order count dikhega.' },
                { step: 'Top Products', detail: 'Konsi fabric sabse zyada biki? Yahan top-selling products ki list milegi — in pe stock rakhna zaroori hai.' },
                { step: 'Revenue Trend', detail: 'Monthly ya weekly revenue graph — business grow ho raha hai ya nahi, ek nazar mein pata chalta hai.' },
            ]
        },
        {
            id: 'settings',
            Icon: Settings,
            title: 'Settings',
            color: 'gray',
            steps: [
                { step: 'Business Info', detail: 'Factory ka naam, address, phone, email, NTN number — yeh sab Invoice pe automatically print hota hai. Zaroor fill karein.' },
                { step: 'Currency', detail: 'PKR (Pakistan) ya THB (Thailand) — branch ke hisaab se set karo.' },
                { step: 'Tax / GST', detail: 'Enable karo to sales pe automatically GST calculate hoga. Rate aur label (GST/VAT) khud set kar sakte ho.' },
                { step: 'Receipt Footer', detail: 'Invoice ke neeche jo message print ho — e.g., "Thank you for your business!" — yahan customize karo.' },
                { step: 'Low Stock Alert', detail: 'On rakho — jab stock minimum se neeche jaye to Dashboard pe alert aayega.' },
            ]
        },
    ]

    const colorMap = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-600', text: 'text-blue-700', light: 'bg-blue-100' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-600', text: 'text-purple-700', light: 'bg-purple-100' },
        orange: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-100' },
        teal: { bg: 'bg-teal-50', border: 'border-teal-200', badge: 'bg-teal-600', text: 'text-teal-700', light: 'bg-teal-100' },
        green: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-600', text: 'text-green-700', light: 'bg-green-100' },
        indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-600', text: 'text-indigo-700', light: 'bg-indigo-100' },
        pink: { bg: 'bg-pink-50', border: 'border-pink-200', badge: 'bg-pink-600', text: 'text-pink-700', light: 'bg-pink-100' },
        yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-100' },
        gray: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-600', text: 'text-gray-700', light: 'bg-gray-100' },
    }

    return (
        <Layout title="Help & Support">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* ── Hero Banner ── */}
                <div className="bg-gray-900 rounded-2xl px-8 py-7 flex items-center gap-5 shadow-lg mt-12">
                    <img
                        src="/src/assets/images/stg_logo.jpeg"
                        alt="Logo"
                        className="h-14 w-14 rounded-xl object-cover flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none' }}
                    />
                    <div>
                        <h1 className="text-2xl font-black text-white leading-tight">Fabric POS — Help Center</h1>
                        <p className="text-gray-400 text-sm mt-1">
                            System ka complete walkthrough — step by step, simple zabaan mein
                        </p>
                    </div>
                    <div className="ml-auto hidden md:flex flex-col items-end gap-1">
                        <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">System Version</span>
                        <span className="text-blue-400 font-black text-lg">v2.0</span>
                    </div>
                </div>

                {/* ── Tab Navigation ── */}
                <div className="flex flex-wrap gap-2 bg-white rounded-xl p-2 shadow-sm border border-gray-100">
                    {tabs.map(tab => {
                        const { Icon } = tab
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm transition ${
                                    activeTab === tab.id
                                        ? 'bg-gray-900 text-white shadow'
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    OVERVIEW TAB
                ══════════════════════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">

                        {/* What is Fabric POS */}
                        <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-black text-gray-900 mb-3">🏭 Fabric POS kya hai?</h2>
                            <p className="text-gray-700 leading-relaxed text-sm">
                                <strong>Fabric POS</strong> ek complete digital management system hai jo specially fabric factory ke liye banaya gaya hai.
                                Yeh system aapki factory ki <strong>production se lekar sale tak</strong> sab kuch track karta hai —
                                barcode se fabric identify karo, real-time stock dekho, professional invoices banao, aur Karachi se Thailand tak ka business ek jagah manage karo.
                            </p>
                        </div>

                        {/* Key Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                { Icon: ScanBarcode,   title: 'Barcode Tracking',    desc: 'Har fabric roll ka unique barcode — production se delivery tak track karo', bg: 'bg-orange-50 border-orange-200', ic: 'text-orange-500' },
                                { Icon: FileText,      title: 'Professional Invoice', desc: 'Sale ke baad turant A4 invoice — PDF download ya WhatsApp share',          bg: 'bg-indigo-50 border-indigo-200', ic: 'text-indigo-500' },
                                { Icon: Globe,         title: 'Multi-Branch',         desc: 'Pakistan (Karachi) aur Thailand — dono branches ek system mein',           bg: 'bg-green-50 border-green-200',  ic: 'text-green-500' },
                                { Icon: BarChart2,     title: 'Live Dashboard',       desc: 'Aaj ki sales, revenue, low stock alerts — sab real-time',                  bg: 'bg-blue-50 border-blue-200',   ic: 'text-blue-500' },
                                { Icon: Lock,          title: 'Secure & Role-Based',  desc: 'Owner, Manager, Cashier — sab ki alag permissions',                        bg: 'bg-purple-50 border-purple-200', ic: 'text-purple-500' },
                                { Icon: Cloud,         title: 'Cloud-Based',          desc: 'Data Google Firebase pe — kisi bhi device se access karo',                 bg: 'bg-teal-50 border-teal-200',   ic: 'text-teal-500' },
                            ].map((card, i) => (
                                <div key={i} className={`rounded-xl p-5 border ${card.bg}`}>
                                    <div className={`mb-3 ${card.ic}`}><card.Icon size={24} /></div>
                                    <h3 className="font-black text-gray-900 text-sm mb-1">{card.title}</h3>
                                    <p className="text-gray-600 text-xs leading-relaxed">{card.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* System Flow */}
                        <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-black text-gray-900 mb-5">🔄 System Flow — Fabric ka Safar</h2>
                            <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                                {[
                                    { Icon: Factory,     label: 'Production' },
                                    { arrow: true },
                                    { Icon: ScanBarcode, label: 'Barcode Generate' },
                                    { arrow: true },
                                    { Icon: Warehouse,   label: 'Warehouse' },
                                    { arrow: true },
                                    { Icon: Share2,      label: 'Shipped' },
                                    { arrow: true },
                                    { Icon: ShoppingCart, label: 'Sale / POS' },
                                    { arrow: true },
                                    { Icon: FileText,    label: 'Invoice' },
                                    { arrow: true },
                                    { Icon: Share2,      label: 'WhatsApp Share' },
                                ].map((item, i) => (
                                    item.arrow
                                        ? <ArrowRight key={i} size={14} className="text-gray-400" />
                                        : <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                            <item.Icon size={14} className="text-gray-500" /><span className="text-gray-700">{item.label}</span>
                                          </div>
                                ))}
                            </div>
                        </div>

                        {/* User Roles */}
                        <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-black text-gray-900 mb-5">👤 User Roles</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { role: '👑 Owner', access: 'Full access — sab kuch dekh aur kar sakta hai', color: 'bg-yellow-50 border-yellow-300' },
                                    { role: '🧑‍💼 Manager', access: 'Inventory, Products, Reports, Sales sab kuch', color: 'bg-blue-50 border-blue-300' },
                                    { role: '💳 Cashier', access: 'POS, Sales, Invoices — counter pe kaam karne ke liye', color: 'bg-green-50 border-green-300' },
                                    { role: '🏭 Warehouse', access: 'Inventory, Barcodes — stock manage karne ke liye', color: 'bg-orange-50 border-orange-300' },
                                ].map((r, i) => (
                                    <div key={i} className={`rounded-xl p-4 border ${r.color}`}>
                                        <p className="font-black text-gray-900 text-sm mb-1">{r.role}</p>
                                        <p className="text-gray-600 text-xs">{r.access}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    GETTING STARTED TAB
                ══════════════════════════════════════════════════════════════ */}
                {activeTab === 'getting-started' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 text-blue-800 text-sm font-medium">
                            💡 <strong>Note:</strong> System mein sirf Admin user add karta hai — koi bhi khud register nahi kar sakta. Yeh security ke liye hai.
                        </div>

                        {[
                            {
                                n: '1', Icon: Lock, title: 'Login karo',
                                desc: 'Admin se email aur password lo → Browser mein system ki URL kholein → Email/Password daal ke Login dabao.',
                                tip: 'Pehli baar login karne pe Dashboard seedha khulega.'
                            },
                            {
                                n: '2', Icon: Settings, title: 'Settings fill karo (Owner)',
                                desc: 'Left menu → Settings → Business Info mein Factory ka naam, address, phone, NTN number likho. Yeh invoice pe print hoga.',
                                tip: 'Currency mein PKR ya THB apni branch ke hisaab se select karo.'
                            },
                            {
                                n: '3', Icon: Layers, title: 'Products add karo',
                                desc: 'Left menu → Products → "Add Product" → Fabric ka naam, price per meter, category, fabric type, color, width sab bharein → Save.',
                                tip: 'Unit "meters" rakho agar fabric length mein bechte ho.'
                            },
                            {
                                n: '4', Icon: ScanBarcode, title: 'Barcodes generate karo',
                                desc: 'Left menu → Barcode → Generate tab → Product select karo → Generate dabao → Label print karo → Fabric pe chipkao.',
                                tip: 'Har fabric roll ya batch ka alag barcode hona chahiye.'
                            },
                            {
                                n: '5', Icon: Users, title: 'Customers add karo (optional)',
                                desc: 'Left menu → Customers → "Add Customer" → Naam aur phone number bharein → Save. Loyalty program ke liye useful hai.',
                                tip: 'Agar customer repeat buyer hai to zaroor add karo — uski full history track hoti hai.'
                            },
                            {
                                n: '6', Icon: ShoppingCart, title: 'Pehli Sale karo',
                                desc: 'Left menu → Sales → POS → Product search karo ya barcode scan karo → Cart mein add karo → Payment method choose karo → Complete Sale dabao.',
                                tip: 'Sale ke baad "View Invoice" se professional invoice dekhein aur share karein.'
                            },
                            {
                                n: '7', Icon: BarChart2, title: 'Reports check karo',
                                desc: 'Dashboard pe daily snapshot milta hai. Detailed reports ke liye Left menu → Reports → Date range select karo.',
                                tip: 'Rosana raat ko Dashboard dekho — pata chalega din kaisa raha.'
                            },
                        ].map((item, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex gap-5">
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-900 text-white font-black flex items-center justify-center text-lg">
                                    {item.n}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-gray-900 mb-1 flex items-center gap-2">
                                        <item.Icon size={16} className="text-blue-600 flex-shrink-0" /> {item.title}
                                    </h3>
                                    <p className="text-gray-700 text-sm leading-relaxed">{item.desc}</p>
                                    <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 text-xs text-blue-700 font-medium">
                                        💡 {item.tip}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    MODULES TAB
                ══════════════════════════════════════════════════════════════ */}
                {activeTab === 'modules' && (
                    <div className="space-y-6">
                        {modules.map((mod) => {
                            const c = colorMap[mod.color]
                            const ModIcon = mod.Icon
                            return (
                                <div key={mod.id} className={`rounded-2xl border ${c.bg} ${c.border} overflow-hidden shadow-sm`}>
                                    {/* Module Header */}
                                    <div className={`px-6 py-4 flex items-center gap-3 ${c.light}`}>
                                        <ModIcon size={22} className={c.text} />
                                        <h3 className={`font-black text-lg ${c.text}`}>{mod.title}</h3>
                                    </div>
                                    {/* Steps */}
                                    <div className="divide-y divide-white/70">
                                        {mod.steps.map((s, si) => (
                                            <div key={si} className="px-6 py-4 flex gap-4 bg-white/60">
                                                <div className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full ${c.badge} text-white text-xs font-black flex items-center justify-center`}>
                                                    {si + 1}
                                                </div>
                                                <div>
                                                    <p className={`font-black text-sm ${c.text}`}>{s.step}</p>
                                                    <p className="text-gray-700 text-sm mt-0.5 leading-relaxed">{s.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    FAQ TAB
                ══════════════════════════════════════════════════════════════ */}
                {activeTab === 'faq' && (
                    <div className="space-y-3">
                        {faqItems.map(item => (
                            <div key={item.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                <button
                                    onClick={() => toggleFaq(item.id)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition text-left"
                                >
                                    <span className="font-bold text-gray-900 text-sm pr-4">{item.id}. {item.question}</span>
                                    <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${expandedFaq === item.id ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedFaq === item.id && (
                                    <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
                                        <p className="text-gray-700 text-sm leading-relaxed">{item.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    TROUBLESHOOTING TAB
                ══════════════════════════════════════════════════════════════ */}
                {activeTab === 'troubleshooting' && (
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 text-yellow-800 text-sm font-medium">
                            ⚠️ Pehle yeh karo: Page refresh karo (F5 ya Ctrl+R), internet check karo, phir logout → login karo.
                        </div>

                        {[
                            {
                                issue: 'Login nahi ho raha',
                                Icon: Lock,
                                solutions: [
                                    'Email aur password dobara check karo — spelling mistake?',
                                    'Internet connection check karo',
                                    'Browser cache clear karo (Ctrl+Shift+Delete)',
                                    'Admin se password reset karo',
                                    'Chrome ya Firefox use karo — Internet Explorer nahi chalega',
                                ]
                            },
                            {
                                issue: 'Barcode scan nahi ho raha',
                                Icon: ScanBarcode,
                                solutions: [
                                    'Camera permission Allow karo — browser ne pucha hoga, Allow dabao',
                                    'Barcode ke saamne achhe se camera rakho — blur na ho',
                                    'Room mein zyada andhera na ho — light zaroor ho',
                                    'Page refresh karo aur dobara try karo',
                                    'Mobile mein try karo — phone ka camera zyada acha hota hai',
                                ]
                            },
                            {
                                issue: 'Products POS mein nahi dikh rahe',
                                Icon: ShoppingCart,
                                solutions: [
                                    'Products page pe check karo — product add hua hai ya nahi',
                                    'Page refresh karo (F5)',
                                    'Category filter check karo — "All" select karo',
                                    'Logout karke wapas login karo',
                                ]
                            },
                            {
                                issue: 'Sale save nahi ho rahi',
                                Icon: FileText,
                                solutions: [
                                    'Internet connection check karo — WiFi ya mobile data on hai?',
                                    'Cart mein koi item hai? — khali cart se sale nahi hoti',
                                    'Amount paid, total se kam na ho',
                                    'Page refresh karo aur dobara try karo',
                                ]
                            },
                            {
                                issue: 'Invoice print theek nahi aa raha',
                                Icon: Printer,
                                solutions: [
                                    'Printer on aur connected hai?',
                                    'Browser ka print dialog — "More settings" mein A4 size select karo',
                                    '"Fit to page" option on karo',
                                    'PDF download karo aur PDF reader se print karo — zyada accurate hoga',
                                ]
                            },
                            {
                                issue: 'Data load nahi ho raha / blank page',
                                Icon: BarChart2,
                                solutions: [
                                    'Internet speed check karo — slow internet se Firebase data late aata hai',
                                    'Page hard refresh karo: Ctrl+Shift+R',
                                    'Browser ka cache clear karo',
                                    'Doosra browser try karo',
                                    'Aur kuch na ho to admin se rabta karo',
                                ]
                            },
                            {
                                issue: 'WhatsApp share kaam nahi kar raha',
                                Icon: Share2,
                                solutions: [
                                    'Mobile pe try karo — desktop pe WhatsApp Web install hona chahiye',
                                    'Browser ne popup block kiya hoga — allow karo',
                                    'WhatsApp Web browser mein logged in hai?',
                                    'PDF download karo aur manually WhatsApp pe bhejo',
                                ]
                            },
                        ].map((item, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                                    <item.Icon size={15} className="text-red-500 flex-shrink-0" />
                                    <h3 className="font-black text-red-700 text-sm">{item.issue}</h3>
                                </div>
                                <div className="px-6 py-4 space-y-2">
                                    {item.solutions.map((sol, si) => (
                                        <div key={si} className="flex items-start gap-2 text-sm text-gray-700">
                                            <CheckCircle2 size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>{sol}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Footer Contact ── */}
                <div className="bg-gray-900 rounded-2xl p-7 text-center mt-4">
                    <p className="text-white font-black text-lg mb-1">Phir bhi masla ho? 🤔</p>
                    <p className="text-gray-400 text-sm mb-4">
                        System support ke liye apne administrator ya developer se rabta karein.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-bold px-5 py-2 rounded-xl">
                        <Mail size={14} /> techpeer.pk@gmail.com
                    </div>
                    <p className="text-gray-600 text-xs mt-4 font-bold uppercase tracking-widest">
                        Fabric POS · v2.0 · Powered by Firebase
                    </p>
                </div>

            </div>
        </Layout>
    )
}

export default Help
