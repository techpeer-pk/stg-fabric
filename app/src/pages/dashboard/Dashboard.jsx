import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import FirestoreService from '../../firebase/firestore-multi-branch'
import useAuthStore from '../../store/authStore-multi-branch'
import { handleError } from '../../utils/errorHandler'
import { SkeletonDashboard } from '../../components/common/skeleton/Skeleton'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
    DollarSign, ReceiptText, Package, Users,
    TrendingUp, TrendingDown, AlertTriangle, Trophy,
    CreditCard, BarChart2, Building2, ShoppingCart, Warehouse
} from 'lucide-react'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function Dashboard() {
    const { businessId, branchId, branchName, currency: storeCurrency } = useAuthStore()
    const [stats, setStats] = useState({
        todaySales: 0, yesterdaySales: 0,
        todayTransactions: 0, yesterdayTransactions: 0,
        totalProducts: 0, totalCustomers: 0,
        lowStockItems: [], topProducts: [],
        paymentBreakdown: [], chartData: [],
        allSales: [], loading: true
    })
    const [chartRange, setChartRange] = useState('weekly')
    const [customFrom, setCustomFrom] = useState('')
    const [customTo, setCustomTo] = useState('')
    const currency = storeCurrency || 'PKR'

    const buildChartData = (sales, range, from = '', to = '') => {
        const now = new Date()
        const data = []
        const getAmt = s => s.finalAmount || s.total || 0
        if (range === 'daily') {
            for (let i = 23; i >= 0; i--) {
                const hour = new Date(now); hour.setHours(now.getHours() - i, 0, 0, 0)
                const nextHour = new Date(hour); nextHour.setHours(hour.getHours() + 1)
                const total = sales.filter(s => { const t = s.createdAt?.toDate?.(); return t && t >= hour && t < nextHour }).reduce((sum, s) => sum + getAmt(s), 0)
                data.push({ label: `${hour.getHours()}:00`, sales: parseFloat(total.toFixed(2)) })
            }
        } else if (range === 'weekly') {
            for (let i = 6; i >= 0; i--) {
                const day = new Date(now); day.setDate(now.getDate() - i); day.setHours(0, 0, 0, 0)
                const nextDay = new Date(day); nextDay.setDate(day.getDate() + 1)
                const total = sales.filter(s => { const t = s.createdAt?.toDate?.(); return t && t >= day && t < nextDay }).reduce((sum, s) => sum + getAmt(s), 0)
                data.push({ label: day.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric' }), sales: parseFloat(total.toFixed(2)) })
            }
        } else if (range === 'monthly') {
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date(now); weekStart.setDate(now.getDate() - (i + 1) * 7); weekStart.setHours(0, 0, 0, 0)
                const weekEnd = new Date(now); weekEnd.setDate(now.getDate() - i * 7); weekEnd.setHours(23, 59, 59, 999)
                const total = sales.filter(s => { const t = s.createdAt?.toDate?.(); return t && t >= weekStart && t <= weekEnd }).reduce((sum, s) => sum + getAmt(s), 0)
                data.push({ label: `Week ${4 - i}`, sales: parseFloat(total.toFixed(2)) })
            }
        } else if (range === 'custom' && from && to) {
            const start = new Date(from + 'T00:00:00')
            const end = new Date(to + 'T23:59:59')
            const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
            const steps = Math.min(diffDays + 1, 31)
            for (let i = 0; i < steps; i++) {
                const day = new Date(start); day.setDate(start.getDate() + i)
                if (day > end) break
                const nextDay = new Date(day); nextDay.setDate(day.getDate() + 1)
                const total = sales.filter(s => { const t = s.createdAt?.toDate?.(); return t && t >= day && t < nextDay }).reduce((sum, s) => sum + getAmt(s), 0)
                data.push({ label: day.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }), sales: parseFloat(total.toFixed(2)) })
            }
        }
        return data
    }

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [productsSnap, customersSnap, inventorySnap, allSalesSnap] = await Promise.all([
                    FirestoreService.getProducts(businessId),
                    FirestoreService.getCustomers(businessId),
                    FirestoreService.getInventory(businessId, branchId),
                    FirestoreService.getSales(businessId, branchId)
                ])
                const inventoryList = inventorySnap.docs.map(d => ({ id: d.id, ...d.data() }))
                const allSales = allSalesSnap.docs.map(d => ({ id: d.id, ...d.data() }))

                const now = new Date()
                const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
                const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)

                const todaySales = allSales.filter(s => { const t = s.createdAt?.toDate?.() || new Date(s.createdAt); return t >= todayStart && t <= now })
                const yesterdaySales = allSales.filter(s => { const t = s.createdAt?.toDate?.() || new Date(s.createdAt); return t >= yesterdayStart && t < todayStart })

                const tSales = todaySales.reduce((sum, d) => sum + (d.finalAmount || d.total || 0), 0)
                const ySales = yesterdaySales.reduce((sum, d) => sum + (d.finalAmount || d.total || 0), 0)

                const productSalesMap = {}
                allSales.forEach(sale => {
                    sale.items?.forEach(item => {
                        if (!productSalesMap[item.name]) productSalesMap[item.name] = { name: item.name, quantity: 0, revenue: 0 }
                        productSalesMap[item.name].quantity += item.quantity
                        productSalesMap[item.name].revenue += item.total
                    })
                })
                const topProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

                const paymentMap = {}
                allSales.forEach(sale => {
                    const method = sale.paymentMethod || 'cash'
                    if (!paymentMap[method]) paymentMap[method] = 0
                    paymentMap[method] += sale.finalAmount || sale.total || 0
                })
                const paymentBreakdown = Object.entries(paymentMap).map(([name, value]) => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    value: parseFloat(value.toFixed(2))
                }))

                const lowStockItems = productsSnap.docs
                    .map(d => {
                        const p = { id: d.id, ...d.data() }
                        const inv = inventoryList.find(i => i.productId === p.id)
                        return { ...p, currentStock: inv?.quantity || 0, minStock: inv?.reorderLevel || 10 }
                    })
                    .filter(p => p.currentStock <= p.minStock)

                setStats({
                    todaySales: tSales, yesterdaySales: ySales,
                    todayTransactions: todaySales.length, yesterdayTransactions: yesterdaySales.length,
                    totalProducts: productsSnap.size, totalCustomers: customersSnap.size,
                    lowStockItems, topProducts, paymentBreakdown,
                    chartData: buildChartData(allSales, 'weekly'),
                    allSales, loading: false
                })
            } catch (err) {
                handleError(err, 'Dashboard Stats', 'Failed to load dashboard data')
                setStats(prev => ({ ...prev, loading: false }))
            }
        }
        if (businessId && branchId) fetchStats()
    }, [businessId, branchId])

    const handleChartRange = (range) => {
        setChartRange(range)
        if (range !== 'custom') {
            setStats(prev => ({ ...prev, chartData: buildChartData(prev.allSales, range) }))
        }
    }

    const handleApplyCustomRange = () => {
        if (!customFrom || !customTo) return
        setStats(prev => ({ ...prev, chartData: buildChartData(prev.allSales, 'custom', customFrom, customTo) }))
    }

    const calcGrowth = (curr, prev) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100

    // ── Range-based stats for cards ───────────────────────────────────────────
    const getRangeStats = () => {
        const now = new Date()
        const getAmt = s => s.finalAmount || s.total || 0
        let current = [], previous = [], growthLabel = ''

        if (chartRange === 'daily') {
            const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
            const yestStart  = new Date(todayStart); yestStart.setDate(yestStart.getDate() - 1)
            current  = stats.allSales.filter(s => { const t = s.createdAt?.toDate?.(); return t && t >= todayStart && t <= now })
            previous = stats.allSales.filter(s => { const t = s.createdAt?.toDate?.(); return t && t >= yestStart && t < todayStart })
            growthLabel = 'vs yesterday'
        } else if (chartRange === 'weekly') {
            const weekStart     = new Date(now); weekStart.setDate(now.getDate() - 7); weekStart.setHours(0, 0, 0, 0)
            const prevWeekStart = new Date(weekStart); prevWeekStart.setDate(weekStart.getDate() - 7)
            current  = stats.allSales.filter(s => { const t = s.createdAt?.toDate?.(); return t && t >= weekStart && t <= now })
            previous = stats.allSales.filter(s => { const t = s.createdAt?.toDate?.(); return t && t >= prevWeekStart && t < weekStart })
            growthLabel = 'vs last week'
        } else if (chartRange === 'monthly') {
            const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1)
            const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const prevMonthEnd  = new Date(monthStart)
            current  = stats.allSales.filter(s => { const t = s.createdAt?.toDate?.(); return t && t >= monthStart && t <= now })
            previous = stats.allSales.filter(s => { const t = s.createdAt?.toDate?.(); return t && t >= prevMonthStart && t < prevMonthEnd })
            growthLabel = 'vs last month'
        } else if (chartRange === 'custom' && customFrom && customTo) {
            const from = new Date(customFrom + 'T00:00:00')
            const to   = new Date(customTo   + 'T23:59:59')
            current = stats.allSales.filter(s => { const t = s.createdAt?.toDate?.(); return t && t >= from && t <= to })
            growthLabel = 'in range'
        } else {
            // fallback — all sales
            current = stats.allSales
            growthLabel = 'all time'
        }

        const curSales  = current.reduce((sum, s)  => sum + getAmt(s), 0)
        const prevSales = previous.reduce((sum, s) => sum + getAmt(s), 0)
        return {
            sales: curSales, transactions: current.length,
            prevSales, prevTransactions: previous.length,
            growthLabel
        }
    }

    const rangeLabels = { daily: "Today's", weekly: "This Week's", monthly: "This Month's", custom: 'Period', }
    const rangePrefix = rangeLabels[chartRange] || "Total"

    if (stats.loading) return (
        <Layout title="Dashboard">
            <div className="mt-12"><SkeletonDashboard /></div>
        </Layout>
    )

    const rs = getRangeStats()
    const salesGrowth = calcGrowth(rs.sales, rs.prevSales)
    const transGrowth = calcGrowth(rs.transactions, rs.prevTransactions)

    const statCards = [
        {
            label: `${rangePrefix} Sales`, icon: DollarSign, iconColor: 'text-green-500', bg: 'bg-green-50',
            value: `${currency} ${rs.sales.toLocaleString()}`,
            growth: salesGrowth, growthLabel: rs.growthLabel
        },
        {
            label: 'Transactions', icon: ReceiptText, iconColor: 'text-blue-500', bg: 'bg-blue-50',
            value: rs.transactions,
            growth: transGrowth, growthLabel: rs.growthLabel
        },
        {
            label: 'Products', icon: Package, iconColor: 'text-purple-500', bg: 'bg-purple-50',
            value: stats.totalProducts,
            sub: 'Active in inventory'
        },
        {
            label: 'Customers', icon: Users, iconColor: 'text-orange-500', bg: 'bg-orange-50',
            value: stats.totalCustomers,
            sub: 'Registered profiles'
        },
    ]

    return (
        <Layout title="Dashboard">
            <div className="mt-12 space-y-6">

                {/* ── Branch Banner ── */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-5 shadow-lg text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                            <Building2 size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Current Branch</p>
                            <h2 className="text-xl font-black mt-0.5">{branchName}</h2>
                        </div>
                    </div>
                    <BarChart2 size={40} className="text-white/10" />
                </div>

                {/* ── Range Selector ── */}
                <div className="flex flex-wrap items-center gap-2">
                    {['daily', 'weekly', 'monthly', 'custom'].map(range => (
                        <button key={range} onClick={() => handleChartRange(range)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition ${chartRange === range ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-gray-900 text-gray-500 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}>
                            {range === 'daily' ? 'Today' : range === 'weekly' ? 'This Week' : range === 'monthly' ? 'This Month' : 'Custom'}
                        </button>
                    ))}
                    {chartRange === 'custom' && (
                        <div className="flex flex-wrap items-center gap-2">
                            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs dark:bg-gray-800 dark:text-gray-200" />
                            <span className="text-gray-400 text-xs">to</span>
                            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs dark:bg-gray-800 dark:text-gray-200" />
                            <button onClick={handleApplyCustomRange} disabled={!customFrom || !customTo}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white disabled:opacity-40 transition hover:bg-blue-700">
                                Apply
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card, i) => {
                        const Icon = card.icon
                        return (
                            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">{card.label}</p>
                                    <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center`}>
                                        <Icon size={16} className={card.iconColor} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100">{card.value}</h3>
                                {card.growth !== undefined ? (
                                    <p className={`text-xs mt-2 font-semibold flex items-center gap-1 ${card.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {card.growth >= 0
                                            ? <TrendingUp size={12} />
                                            : <TrendingDown size={12} />
                                        }
                                        {Math.abs(card.growth).toFixed(1)}%
                                        <span className="text-gray-400 font-normal">{card.growthLabel}</span>
                                    </p>
                                ) : (
                                    <p className="text-gray-400 text-xs mt-2">{card.sub}</p>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* ── Sales Chart ── */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                    <div className="flex items-center gap-2 mb-5">
                        <BarChart2 size={16} className="text-blue-600" />
                        <div>
                            <h3 className="font-black text-gray-800 dark:text-gray-100 text-sm uppercase tracking-widest">Sales Overview</h3>
                            <p className="text-gray-400 text-xs mt-0.5">
                                {chartRange === 'daily' ? 'Today (hourly)' : chartRange === 'weekly' ? 'Last 7 days' : chartRange === 'monthly' ? 'Last 4 weeks' : customFrom && customTo ? `${customFrom} → ${customTo}` : 'Select range above'}
                            </p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={stats.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={80} tickFormatter={v => v.toLocaleString()} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} formatter={(value) => [`${currency} ${value.toLocaleString()}`, 'Sales']} />
                            <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2.5} fill="url(#salesGradient)" dot={{ fill: '#2563eb', r: 3 }} activeDot={{ r: 5 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* ── Top Products + Payment Breakdown ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy size={15} className="text-yellow-500" />
                            <h3 className="font-black text-gray-800 dark:text-gray-100 text-sm uppercase tracking-widest">Top Selling Products</h3>
                        </div>
                        {stats.topProducts.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8 italic">No sales data yet</p>
                        ) : (
                            <div className="space-y-4">
                                {stats.topProducts.map((product, index) => {
                                    const maxRevenue = stats.topProducts[0]?.revenue || 1
                                    const pct = (product.revenue / maxRevenue) * 100
                                    return (
                                        <div key={product.name}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-orange-400'}`}>
                                                        {index + 1}
                                                    </span>
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[150px]">{product.name}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-xs font-black text-blue-600">{currency} {product.revenue.toLocaleString()}</p>
                                                    <p className="text-[10px] text-gray-400">{product.quantity} sold</p>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                                                <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard size={15} className="text-blue-500" />
                            <h3 className="font-black text-gray-800 dark:text-gray-100 text-sm uppercase tracking-widest">Payment Breakdown</h3>
                        </div>
                        {stats.paymentBreakdown.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8 italic">No payment data yet</p>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <ResponsiveContainer width={150} height={150}>
                                    <PieChart>
                                        <Pie data={stats.paymentBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                                            {stats.paymentBreakdown.map((_, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [`${currency} ${value.toLocaleString()}`, '']} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex-1 space-y-3 w-full">
                                    {stats.paymentBreakdown.map((item, index) => {
                                        const total = stats.paymentBreakdown.reduce((sum, i) => sum + i.value, 0)
                                        const pct = ((item.value / total) * 100).toFixed(1)
                                        return (
                                            <div key={item.name} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
                                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-gray-800 dark:text-gray-100">{pct}%</p>
                                                    <p className="text-[10px] text-gray-400">{currency} {item.value.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Welcome Banner ── */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-7 shadow-lg text-white">
                    <h2 className="text-2xl font-black mb-1">Welcome to Fabric POS</h2>
                    <p className="text-blue-100 mb-5 text-sm">
                        {stats.todayTransactions > 0
                            ? `${stats.todayTransactions} transaction${stats.todayTransactions > 1 ? 's' : ''} today — ${currency} ${stats.todaySales.toLocaleString()} total revenue.`
                            : 'No transactions yet today. Open the POS to start selling!'}
                    </p>
                    <div className="flex gap-3 flex-wrap">
                        <button onClick={() => window.location.href = '/pos'} className="bg-white text-blue-600 px-5 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition flex items-center gap-2">
                            <ShoppingCart size={15} /> Open POS
                        </button>
                        <button onClick={() => window.location.href = '/inventory'} className="bg-blue-500 text-white border border-blue-400 px-5 py-2 rounded-lg font-bold text-sm hover:bg-blue-400 transition flex items-center gap-2">
                            <Warehouse size={15} /> Manage Inventory
                        </button>
                    </div>
                </div>

                {/* ── Low Stock Alerts ── */}
                {stats.lowStockItems?.length > 0 && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-gray-800 dark:text-gray-100 uppercase tracking-widest text-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                Low Stock Alerts
                            </h3>
                            <span className="text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full uppercase border dark:border-red-900/30">
                                {stats.lowStockItems.length} item{stats.lowStockItems.length > 1 ? 's' : ''} need restocking
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.lowStockItems.map(item => (
                                <div key={item.id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-red-100 dark:border-red-900/30 shadow-sm flex items-center justify-between group hover:border-red-400 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                                            <AlertTriangle size={18} className="text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 group-hover:text-red-600 transition-colors">{item.name}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Stock: {item.currentStock} {item.unit || 'pcs'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Min</p>
                                        <p className="text-xs font-black text-gray-500">{item.minStock}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    )
}

export default Dashboard
