import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { db } from '../../firebase/config'
import { collection, getDocs, getDoc, query, orderBy, doc } from 'firebase/firestore'
import { handleError } from '../../utils/errorHandler'

function Reports() {
    const [sales, setSales] = useState([])
    const [products, setProducts] = useState([])
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('today')
    const [activeTab, setActiveTab] = useState('sales')

    const currency = settings?.currency || 'PKR'

    useEffect(() => {
        const fetchData = async () => {
            try {
                const settingsSnap = await getDoc(doc(db, 'settings', 'global'))
                if (settingsSnap.exists()) setSettings(settingsSnap.data())

                const salesSnap = await getDocs(query(collection(db, 'sales'), orderBy('createdAt', 'desc')))
                const salesList = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                setSales(salesList)

                const productsSnap = await getDocs(collection(db, 'products'))
                const productsList = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                setProducts(productsList)

                const poSnap = await getDocs(query(collection(db, 'purchase_orders'), orderBy('createdAt', 'desc')))
                const poList = poSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                setPurchaseOrders(poList)
            } catch (err) {
                handleError(err, 'Fetch Reports', 'Failed to load reports data')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Filter sales by period
    const getFilteredSales = () => {
        const now = new Date()
        return sales.filter(sale => {
            if (!sale.createdAt) return false
            const saleDate = sale.createdAt.toDate()
            if (period === 'today') {
                return saleDate.toDateString() === now.toDateString()
            } else if (period === 'week') {
                const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
                return saleDate >= weekAgo
            } else if (period === 'month') {
                return saleDate.getMonth() === now.getMonth() &&
                    saleDate.getFullYear() === now.getFullYear()
            }
            return true
        })
    }

    const filteredSales = getFilteredSales()
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0)
    const totalTransactions = filteredSales.length
    const avgSale = totalTransactions ? totalRevenue / totalTransactions : 0

    // CSV Export Logic
    const handleExportCSV = () => {
        const headers = ['Date', 'Transaction ID', `Total (${currency})`, 'Payment Method', 'Items Count']
        const csvData = filteredSales.map(sale => [
            sale.createdAt?.toDate().toLocaleString(),
            sale.id,
            sale.total.toFixed(2),
            sale.paymentMethod,
            sale.items?.length || 0
        ])

        const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `gpos_report_${period}_${new Date().toLocaleDateString()}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Daily Sales Chart Data (Last 7 Days)
    const getLast7Days = () => {
        const days = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setHours(0, 0, 0, 0)
            d.setDate(d.getDate() - i)
            days.push({
                date: d,
                label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: 0
            })
        }

        sales.forEach(sale => {
            if (!sale.createdAt) return
            const saleDate = sale.createdAt.toDate()
            const day = days.find(d => d.date.toDateString() === saleDate.toDateString())
            if (day) day.revenue += sale.total
        })

        const maxRevenue = Math.max(...days.map(d => d.revenue), 1)
        return days.map(d => ({ ...d, percent: (d.revenue / maxRevenue) * 100 }))
    }

    const chartData = getLast7Days()

    // Payment method breakdown
    const cashSales = filteredSales.filter(s => s.paymentMethod === 'cash')
    const cardSales = filteredSales.filter(s => s.paymentMethod === 'card')
    const creditSales = filteredSales.filter(s => s.paymentMethod === 'credit')

    // Top selling products
    const productSales = {}
    filteredSales.forEach(sale => {
        sale.items?.forEach(item => {
            if (productSales[item.name]) {
                productSales[item.name].quantity += item.quantity
                productSales[item.name].revenue += item.total
            } else {
                productSales[item.name] = { quantity: item.quantity, revenue: item.total }
            }
        })
    })

    const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)

    return (
        <Layout title="Reports">

            {/* Header / Export */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 mt-12">
                <div className="flex flex-wrap gap-2">
                    {['today', 'week', 'month', 'all'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${period === p
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            {p === 'all' ? 'All Time' : p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={handleExportCSV}
                        className="flex-1 md:flex-none bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition shadow-sm flex items-center justify-center gap-2"
                    >
                        <span>📥</span> Export CSV
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-2"
                    >
                        <span>🖨️</span> Print Report
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('sales')}
                    className={`pb-2 px-4 font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'sales' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Sales Report
                </button>
                <button
                    onClick={() => setActiveTab('purchases')}
                    className={`pb-2 px-4 font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'purchases' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Purchases Report
                </button>
            </div>

            {activeTab === 'sales' ? (
                <>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                            <h3 className="text-2xl font-black text-gray-800 mt-1 truncate">{currency} {totalRevenue.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Transactions</p>
                            <h3 className="text-2xl font-black text-gray-800 mt-1">{totalTransactions}</h3>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Average Ticket</p>
                            <h3 className="text-2xl font-black text-blue-600 mt-1 truncate">{currency} {avgSale.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Unique Items</p>
                            <h3 className="text-2xl font-black text-gray-800 mt-1">{Object.keys(productSales).length}</h3>
                        </div>
                    </div>

                    {/* Main Content Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left Column (Chart & Table) */}
                        <div className="lg:col-span-2 space-y-8 min-w-0">

                            {/* Weekly Chart */}
                            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm overflow-hidden">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-gray-800">📅 Weekly Revenue Trend</h3>
                                    <p className="text-xs text-gray-400 font-medium">Last 7 days</p>
                                </div>
                                <div className="flex items-end justify-between h-48 px-2 overflow-x-auto pb-2">
                                    {chartData.map((day) => (
                                        <div key={day.label} className="flex flex-col items-center flex-1 min-w-[40px] group gap-2">
                                            <div className="relative w-full flex justify-center items-end h-32">
                                                <div className="absolute -top-8 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                                    {currency} {day.revenue.toLocaleString()}
                                                </div>
                                                <div
                                                    style={{ height: `${day.percent}%` }}
                                                    className="w-8 max-w-[2.5rem] bg-blue-500 rounded-t-md transition-all duration-500 group-hover:bg-blue-600"
                                                ></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{day.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Transactions Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Recent Transactions</h3>
                                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">Showing Latest 10</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50/50 border-b">
                                            <tr>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-500">Date/Time</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-500">Items</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-500">Mode</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-500">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-12">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                            <span className="text-gray-400 text-xs">Loading sales...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredSales.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-12 text-gray-400 italic">No transactions in this period</td>
                                                </tr>
                                            ) : filteredSales.slice(0, 10).map((sale) => (
                                                <tr key={sale.id} className="hover:bg-gray-50/50 transition">
                                                    <td className="px-6 py-3 text-gray-600">
                                                        <span className="block">{sale.createdAt?.toDate().toLocaleDateString()}</span>
                                                        <span className="text-[10px] text-gray-400">{sale.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </td>
                                                    <td className="px-6 py-3 text-gray-600">{sale.items?.length || 0} items</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${sale.paymentMethod === 'cash' ? 'text-green-600 bg-green-50' :
                                                            sale.paymentMethod === 'card' ? 'text-blue-600 bg-blue-50' :
                                                                'text-yellow-600 bg-yellow-50'
                                                            }`}>{sale.paymentMethod}</span>
                                                    </td>
                                                    <td className="px-6 py-3 font-bold text-gray-900 text-right">
                                                        {currency} {sale.total?.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Right Column (Composition & Top Products) */}
                        <div className="lg:col-span-1 space-y-8 min-w-0">

                            {/* Sales Composition */}
                            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-6">📊 Sales Composition</h3>
                                <div className="space-y-6">
                                    {[
                                        { label: 'Cash', val: cashSales.length, color: 'bg-green-500' },
                                        { label: 'Card', val: cardSales.length, color: 'bg-blue-500' },
                                        { label: 'Credit', val: creditSales.length, color: 'bg-yellow-500' }
                                    ].map(item => {
                                        const percent = totalTransactions ? (item.val / totalTransactions) * 100 : 0
                                        return (
                                            <div key={item.label} className="space-y-2">
                                                <div className="flex justify-between text-xs font-bold text-gray-500">
                                                    <span>{item.label}</span>
                                                    <span>{percent.toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={`${item.color} h-full transition-all duration-700`}
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Top Products */}
                            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <span>🏆</span> Top Selling Products
                                </h3>
                                <div className="space-y-4">
                                    {topProducts.length === 0 ? (
                                        <p className="text-gray-400 text-center py-6 text-sm italic">No data yet</p>
                                    ) : (
                                        topProducts.map(([name, data]) => (
                                            <div key={name} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-gray-800 truncate">{name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{data.quantity} Units Sold</p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="text-sm font-black text-blue-600 shrink-0">{currency} {data.revenue.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Purchase Spend</p>
                            <h3 className="text-2xl font-black text-gray-800 mt-1">
                                {currency} {purchaseOrders.filter(po => po.status === 'received').reduce((sum, po) => sum + (po.totalAmount || 0), 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pending Orders</p>
                            <h3 className="text-2xl font-black text-orange-600 mt-1">
                                {purchaseOrders.filter(po => po.status === 'pending').length}
                            </h3>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Suppliers</p>
                            <h3 className="text-2xl font-black text-gray-800 mt-1">
                                {[...new Set(purchaseOrders.map(po => po.supplierId))].length}
                            </h3>
                        </div>
                    </div>

                    {/* Stock Valuation Section */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <span className="text-8xl">📦</span>
                        </div>
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] opacity-70 mb-6">Inventory Valuation (Live)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                            <div>
                                <p className="text-[10px] font-black uppercase opacity-60 mb-1">Total Asset Value</p>
                                <p className="text-3xl font-black">
                                    {currency} {products.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.stock || 0)), 0).toLocaleString()}
                                </p>
                                <p className="text-[10px] opacity-40 mt-1">Total capital tied in current stock</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase opacity-60 mb-1">Est. Store Value</p>
                                <p className="text-3xl font-black">
                                    {currency} {products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0).toLocaleString()}
                                </p>
                                <p className="text-[10px] opacity-40 mt-1">Potential revenue if all sold</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase opacity-60 mb-1">Potential Profit</p>
                                <p className="text-3xl font-black text-green-300">
                                    {currency} {products.reduce((sum, p) => sum + (((p.price || 0) - (p.costPrice || 0)) * (p.stock || 0)), 0).toLocaleString()}
                                </p>
                                <p className="text-[10px] opacity-40 mt-1">Gross profit margin in stock</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b">
                            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Incoming Stock History</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Vendor</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Items</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Value</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Received At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {purchaseOrders.filter(po => po.status === 'received').length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">No received orders yet.</td></tr>
                                ) : (
                                    purchaseOrders.filter(po => po.status === 'received').map(po => (
                                        <tr key={po.id}>
                                            <td className="px-6 py-4 font-bold text-gray-800">{po.supplierName}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{po.items?.length || 0} Products</td>
                                            <td className="px-6 py-4 font-black text-blue-600">{currency} {po.totalAmount?.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {po.receivedAt?.toDate().toLocaleString() || 'N/A'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Layout>
    )
}

export default Reports