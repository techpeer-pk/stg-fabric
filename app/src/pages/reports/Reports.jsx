import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import FirestoreService from '../../firebase/firestore-multi-branch'
import useAuthStore from '../../store/authStore-multi-branch'
import { handleError } from '../../utils/errorHandler'
import {
    BarChart2, FileDown, Printer, TrendingUp, Trophy,
    CreditCard, Calendar, Package, ShoppingCart, ChevronRight
} from 'lucide-react'

function Reports() {
    const { businessId, branchId } = useAuthStore()
    const [sales, setSales] = useState([])
    const [products, setProducts] = useState([])
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('week')
    const [activeTab, setActiveTab] = useState('sales')
    const [customFrom, setCustomFrom] = useState('')
    const [customTo, setCustomTo] = useState('')

    const currency = 'PKR'
    const getAmt = s => s.finalAmount || s.total || 0

    useEffect(() => {
        if (!businessId || !branchId) return
        const fetchData = async () => {
            try {
                const [salesSnap, productsSnap, poSnap] = await Promise.all([
                    FirestoreService.getSales(businessId, branchId),
                    FirestoreService.getProducts(businessId),
                    FirestoreService.getPurchaseOrders(businessId, branchId)
                ])
                setSales(salesSnap.docs.map(d => ({ id: d.id, ...d.data() })))
                setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
                setPurchaseOrders(poSnap.docs.map(d => ({ id: d.id, ...d.data() })))
            } catch (err) {
                handleError(err, 'Fetch Reports', 'Failed to load reports data')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [businessId, branchId])

    // ── Date filter ───────────────────────────────────────────────────────────
    const getFilteredSales = () => {
        const now = new Date()
        return sales.filter(sale => {
            if (!sale.createdAt) return false
            const t = sale.createdAt.toDate?.() || new Date(sale.createdAt)
            if (period === 'today') {
                return t.toDateString() === now.toDateString()
            } else if (period === 'week') {
                return t >= new Date(now - 7 * 24 * 60 * 60 * 1000)
            } else if (period === 'month') {
                return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear()
            } else if (period === 'custom' && customFrom && customTo) {
                const from = new Date(customFrom + 'T00:00:00')
                const to = new Date(customTo + 'T23:59:59')
                return t >= from && t <= to
            }
            return true // 'all'
        })
    }

    const filteredSales = getFilteredSales()
    const totalRevenue = filteredSales.reduce((sum, s) => sum + getAmt(s), 0)
    const totalTransactions = filteredSales.length
    const avgSale = totalTransactions ? totalRevenue / totalTransactions : 0

    // ── Chart: last 7 days bar ────────────────────────────────────────────────
    const getChartData = () => {
        const sourceSales = (period === 'all' || period === 'custom')
            ? filteredSales
            : sales  // always use full sales for the 7-day trend chart
        const days = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i)
            days.push({ date: d, label: d.toLocaleDateString('en-US', { weekday: 'short' }), revenue: 0 })
        }
        sourceSales.forEach(sale => {
            if (!sale.createdAt) return
            const t = sale.createdAt.toDate?.() || new Date(sale.createdAt)
            const day = days.find(d => d.date.toDateString() === t.toDateString())
            if (day) day.revenue += getAmt(sale)
        })
        const maxRevenue = Math.max(...days.map(d => d.revenue), 1)
        return days.map(d => ({ ...d, percent: (d.revenue / maxRevenue) * 100 }))
    }

    const chartData = getChartData()

    // ── Payment breakdown ─────────────────────────────────────────────────────
    const cashSales   = filteredSales.filter(s => s.paymentMethod === 'cash')
    const cardSales   = filteredSales.filter(s => s.paymentMethod === 'card')
    const bankSales   = filteredSales.filter(s => s.paymentMethod === 'bank_transfer')
    const creditSales = filteredSales.filter(s => !['cash', 'card', 'bank_transfer'].includes(s.paymentMethod))

    // ── Top products ──────────────────────────────────────────────────────────
    const productSales = {}
    filteredSales.forEach(sale => {
        sale.items?.forEach(item => {
            const key = item.name
            if (productSales[key]) {
                productSales[key].quantity += item.quantity
                productSales[key].revenue += item.total || 0
            } else {
                productSales[key] = { quantity: item.quantity || 0, revenue: item.total || 0 }
            }
        })
    })
    const topProducts = Object.entries(productSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5)

    // ── CSV Export ────────────────────────────────────────────────────────────
    const handleExportCSV = () => {
        const headers = ['Date', 'Invoice ID', `Total (${currency})`, 'Payment', 'Items', 'Customer']
        const rows = filteredSales.map(s => [
            (s.createdAt?.toDate?.() || new Date(s.createdAt)).toLocaleString(),
            s.id,
            getAmt(s).toFixed(2),
            s.paymentMethod || '',
            s.items?.length || 0,
            s.customerName || ''
        ])
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `stg_fabric_report_${period}_${new Date().toLocaleDateString('en-PK')}.csv`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
    }

    const periodLabels = { today: 'Today', week: 'This Week', month: 'This Month', all: 'All Time', custom: 'Custom' }

    return (
        <Layout title="Reports">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 mt-12">
                <div className="flex flex-wrap gap-2 items-center">
                    {['today', 'week', 'month', 'all', 'custom'].map(p => (
                        <button key={p} onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${period === p ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
                            {periodLabels[p]}
                        </button>
                    ))}
                    {period === 'custom' && (
                        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                            <span className="text-gray-400 text-sm">to</span>
                            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                        </div>
                    )}
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={handleExportCSV}
                        className="flex-1 md:flex-none bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-700 transition shadow-sm flex items-center justify-center gap-2 text-sm">
                        <FileDown size={15} /> Export CSV
                    </button>
                    <button onClick={() => window.print()}
                        className="flex-1 md:flex-none bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-2 text-sm">
                        <Printer size={15} /> Print
                    </button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-4 mb-6 border-b border-gray-100">
                {[['sales', 'Sales Report'], ['purchases', 'Purchases Report']].map(([tab, label]) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`pb-2 px-1 font-black uppercase tracking-widest text-xs transition-all ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === 'sales' ? (
                <>
                    {/* ── Quick Stats ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Revenue',   value: `${currency} ${totalRevenue.toLocaleString()}`,  color: 'text-gray-800' },
                            { label: 'Transactions',    value: totalTransactions,                                color: 'text-gray-800' },
                            { label: 'Average Ticket',  value: `${currency} ${Math.round(avgSale).toLocaleString()}`, color: 'text-blue-600' },
                            { label: 'Fabric Types Sold', value: Object.keys(productSales).length,              color: 'text-gray-800' },
                        ].map(card => (
                            <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{card.label}</p>
                                <h3 className={`text-2xl font-black mt-1 truncate ${card.color} dark:text-gray-100`}>{card.value}</h3>
                            </div>
                        ))}
                    </div>

                    {/* ── Main Grid ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left — Chart + Table */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Revenue Trend Chart */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={15} className="text-blue-600" />
                                        <h3 className="font-black text-gray-800 dark:text-gray-100 text-sm uppercase tracking-widest">Weekly Revenue Trend</h3>
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">Last 7 days</span>
                                </div>
                                <div className="flex items-end justify-between h-40 px-2 gap-1">
                                    {chartData.map(day => (
                                        <div key={day.label} className="flex flex-col items-center flex-1 gap-1.5 group">
                                            <div className="relative w-full flex justify-center items-end h-32">
                                                <div className="absolute -top-7 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 pointer-events-none">
                                                    {currency} {day.revenue.toLocaleString()}
                                                </div>
                                                <div
                                                    style={{ height: `${Math.max(day.percent, 3)}%` }}
                                                    className="w-full max-w-[36px] bg-blue-500 rounded-t-md transition-all duration-500 group-hover:bg-blue-600"
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{day.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Transactions */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart size={14} className="text-gray-500" />
                                        <h3 className="font-black text-gray-800 dark:text-gray-100 uppercase text-xs tracking-widest">Recent Transactions</h3>
                                    </div>
                                    <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded font-bold">Latest 10</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                            <tr>
                                                {['Date/Time', 'Customer', 'Items', 'Payment', 'Total'].map(h => (
                                                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 ${h === 'Total' ? 'text-right' : 'text-left'}`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {loading ? (
                                                <tr><td colSpan="5" className="text-center py-10"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto" /></td></tr>
                                            ) : filteredSales.length === 0 ? (
                                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic text-sm">No transactions in this period</td></tr>
                                            ) : filteredSales.slice(0, 10).map(sale => {
                                                const t = sale.createdAt?.toDate?.() || new Date(sale.createdAt)
                                                return (
                                                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                            <span className="block text-xs">{t.toLocaleDateString()}</span>
                                                            <span className="text-[10px] text-gray-400">{t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">{sale.customerName || '—'}</td>
                                                        <td className="px-4 py-3 text-gray-500 text-xs">{sale.items?.length || 0} items</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                                sale.paymentMethod === 'cash' ? 'text-green-600 bg-green-50' :
                                                                sale.paymentMethod === 'card' ? 'text-blue-600 bg-blue-50' :
                                                                sale.paymentMethod === 'bank_transfer' ? 'text-purple-600 bg-purple-50' :
                                                                'text-yellow-600 bg-yellow-50'
                                                            }`}>{sale.paymentMethod === 'bank_transfer' ? 'Bank' : sale.paymentMethod}</span>
                                                        </td>
                                                        <td className="px-4 py-3 font-black text-gray-900 dark:text-gray-100 text-right">
                                                            {currency} {getAmt(sale).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Right — Composition + Top Products */}
                        <div className="space-y-6">

                            {/* Payment Composition */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <CreditCard size={14} className="text-blue-500" />
                                    <h3 className="font-black text-gray-800 dark:text-gray-100 text-sm uppercase tracking-widest">Payment Breakdown</h3>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Cash',      val: cashSales.length,   color: 'bg-green-500' },
                                        { label: 'Card',      val: cardSales.length,   color: 'bg-blue-500' },
                                        { label: 'Bank',      val: bankSales.length,   color: 'bg-purple-500' },
                                        { label: 'Credit',    val: creditSales.length, color: 'bg-yellow-500' },
                                    ].map(item => {
                                        const pct = totalTransactions ? (item.val / totalTransactions) * 100 : 0
                                        return (
                                            <div key={item.label} className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold text-gray-500">
                                                    <span>{item.label}</span>
                                                    <span>{pct.toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                                                    <div className={`${item.color} h-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Top Selling Fabrics */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Trophy size={14} className="text-yellow-500" />
                                    <h3 className="font-black text-gray-800 dark:text-gray-100 text-sm uppercase tracking-widest">Top Selling Fabrics</h3>
                                </div>
                                <div className="space-y-3">
                                    {topProducts.length === 0 ? (
                                        <p className="text-gray-400 text-center py-6 text-sm italic">No data yet</p>
                                    ) : topProducts.map(([name, data], i) => (
                                        <div key={name} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className={`text-xs font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-orange-400'}`}>{i + 1}</span>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{name}</p>
                                                    <p className="text-[10px] text-gray-400">{data.quantity}m sold</p>
                                                </div>
                                            </div>
                                            <p className="text-xs font-black text-blue-600 flex-shrink-0">{currency} {data.revenue.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* ── Purchases Tab ── */
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Total Spend', value: `${currency} ${purchaseOrders.filter(po => po.status === 'received').reduce((s, po) => s + (po.totalAmount || 0), 0).toLocaleString()}`, color: 'text-gray-800' },
                            { label: 'Pending Orders', value: purchaseOrders.filter(po => po.status === 'pending').length, color: 'text-orange-600' },
                            { label: 'Suppliers Used', value: [...new Set(purchaseOrders.map(po => po.supplierId))].length, color: 'text-gray-800' },
                        ].map(card => (
                            <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{card.label}</p>
                                <h3 className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</h3>
                            </div>
                        ))}
                    </div>

                    {/* Inventory Valuation */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center gap-2 mb-5">
                            <Package size={16} className="opacity-80" />
                            <h3 className="font-black text-xs uppercase tracking-widest opacity-80">Inventory Valuation (Live)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Cost Value', val: products.reduce((s, p) => s + ((p.costPrice || 0) * (p.stock || 0)), 0), sub: 'Capital in current stock' },
                                { label: 'Retail Value', val: products.reduce((s, p) => s + ((p.price || 0) * (p.stock || 0)), 0), sub: 'Revenue if all sold' },
                                { label: 'Gross Profit', val: products.reduce((s, p) => s + (((p.price || 0) - (p.costPrice || 0)) * (p.stock || 0)), 0), sub: 'Margin in stock', green: true },
                            ].map(item => (
                                <div key={item.label}>
                                    <p className="text-[10px] font-black uppercase opacity-60 mb-1">{item.label}</p>
                                    <p className={`text-2xl font-black ${item.green ? 'text-green-300' : ''}`}>{currency} {item.val.toLocaleString()}</p>
                                    <p className="text-[10px] opacity-40 mt-0.5">{item.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Purchase Orders Table */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-black text-gray-800 dark:text-gray-100 uppercase text-xs tracking-widest">Incoming Stock History</h3>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    {['Vendor', 'Items', 'Value', 'Received At'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {purchaseOrders.filter(po => po.status === 'received').length === 0 ? (
                                    <tr><td colSpan="4" className="px-5 py-10 text-center text-gray-400 italic">No received orders yet.</td></tr>
                                ) : purchaseOrders.filter(po => po.status === 'received').map(po => (
                                    <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                        <td className="px-5 py-3 font-bold text-gray-800 dark:text-gray-100">{po.supplierName}</td>
                                        <td className="px-5 py-3 text-gray-500 text-xs">{po.items?.length || 0} Products</td>
                                        <td className="px-5 py-3 font-black text-blue-600">{currency} {po.totalAmount?.toLocaleString()}</td>
                                        <td className="px-5 py-3 text-xs text-gray-500">{po.receivedAt?.toDate?.().toLocaleString() || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Layout>
    )
}

export default Reports
