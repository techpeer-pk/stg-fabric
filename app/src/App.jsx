import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import ErrorBoundary from './components/common/ErrorBoundary'
import { onAuthChange } from './firebase/auth'
import ProtectedRoute from './routes/ProtectedRoute'
import useAuthStore from './store/authStore-multi-branch'
import useThemeStore from './store/themeStore'
import { onMessageListener } from './firebase/messaging'
import { clearQueryCache } from './firebase/queryCache'
import { resetPreload } from './utils/appPreloader'
import toast, { Toaster } from 'react-hot-toast'
import NotificationListener from './components/common/NotificationListener'

// ── Lazy loaded pages (code splitting) ───────────────────────────────────────
const Login               = lazy(() => import('./pages/auth/Login'))
const PendingApproval     = lazy(() => import('./pages/auth/PendingApproval'))
const ServiceUnavailable  = lazy(() => import('./pages/auth/ServiceUnavailable'))
const BillingStatus       = lazy(() => import('./pages/admin/BillingStatus'))
const UserSettings        = lazy(() => import('./pages/auth/UserSettings'))
const Dashboard           = lazy(() => import('./pages/dashboard/Dashboard'))
const POS                 = lazy(() => import('./pages/pos/POS'))
const Products            = lazy(() => import('./pages/products/Products'))
const Sales               = lazy(() => import('./pages/sales/Sales'))
const Invoice             = lazy(() => import('./pages/sales/Invoice'))
const Customers           = lazy(() => import('./pages/customers/Customers'))
const Inventory           = lazy(() => import('./pages/inventory/Inventory'))
const Suppliers           = lazy(() => import('./pages/inventory/Suppliers'))
const PurchaseOrders      = lazy(() => import('./pages/inventory/PurchaseOrders'))
const POInvoice           = lazy(() => import('./pages/inventory/POInvoice'))
const Barcode             = lazy(() => import('./pages/barcode/Barcode'))
const Employees           = lazy(() => import('./pages/employees/Employees'))
const Branches            = lazy(() => import('./pages/settings/Branches'))
const Reports             = lazy(() => import('./pages/reports/Reports'))
const Settings            = lazy(() => import('./pages/settings/Settings'))
const Documentation       = lazy(() => import('./pages/settings/Documentation'))
const Help                = lazy(() => import('./pages/settings/Help'))
const Import              = lazy(() => import('./pages/settings/Import'))
const Backup              = lazy(() => import('./pages/settings/Backup'))
const Expenses            = lazy(() => import('./pages/accounts/Expenses'))
const CashFlow            = lazy(() => import('./pages/accounts/CashFlow'))
const AccountsSummary     = lazy(() => import('./pages/accounts/AccountsSummary'))
const RegisterReconciliation = lazy(() => import('./pages/accounts/RegisterReconciliation'))
const Pricing             = lazy(() => import('./pages/public/Pricing'))
const Purpose             = lazy(() => import('./pages/public/Purpose'))
const PublicDocumentation = lazy(() => import('./pages/public/PublicDocumentation'))
const PublicInvoice       = lazy(() => import('./pages/public/PublicInvoice'))

// ── Page loader (shown while lazy chunk loads) ────────────────────────────────
const PageLoader = () => (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">Loading...</p>
        </div>
    </div>
)

function App() {
    const { user, setUser, loading, setLoading } = useAuthStore()
    const { initTheme } = useThemeStore()

    useEffect(() => {
        initTheme()
        const unsubscribe = onAuthChange(async (currentUser) => {
            try {
                if (currentUser) {
                    setUser(currentUser)
                    const { getUserSessionContext } = await import('./firebase/firestore-multi-branch')
                    const context = await getUserSessionContext(currentUser.uid)
                    if (context?.disabled) {
                        // Don't navigate here — this listener fires on every page load
                        // regardless of route (including /billing-status, /login, ...).
                        // Just flag it; ProtectedRoute redirects for the routes that need it.
                        useAuthStore.setState({
                            businessId: context.businessId,
                            businessDisabled: true,
                            businessDisabledMessage: context.statusMessage || ''
                        })
                    } else if (context) {
                        useAuthStore.setState({
                            businessId: context.businessId,
                            branchId: useAuthStore.getState().branchId || context.branchId,
                            branchName: useAuthStore.getState().branchName || context.branchName,
                            userRole: context.role || 'cashier',
                            assignedBranches: context.branches || [],
                            businessDisabled: false
                        })
                    }
                } else {
                    setUser(null)
                    useAuthStore.setState({ userRole: 'cashier', businessId: null, branchId: null, businessDisabled: false })
                    // Drop cached data and preload state so the next login starts clean
                    clearQueryCache()
                    resetPreload()
                }
            } catch (error) {
                console.error('Session sync error:', error)
            } finally {
                setLoading(false)
            }
        })
        return () => unsubscribe()
    }, [setUser, setLoading, initTheme])

    useEffect(() => {
        onMessageListener()
            .then((payload) => {
                toast.custom((t) => (
                    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                        <div className="flex-1 w-0 p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">🔔</span>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{payload.notification.title}</p>
                                    <p className="mt-1 text-sm text-gray-500">{payload.notification.body}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex border-l border-gray-200">
                            <button onClick={() => toast.dismiss(t.id)}
                                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-bold text-blue-600 hover:text-blue-500">
                                Close
                            </button>
                        </div>
                    </div>
                ), { duration: 5000 })
            })
            .catch(() => {})
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-200 dark:bg-gray-950 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-3" />
                <p className="text-gray-400 text-sm font-medium">Fabric POS Loading...</p>
            </div>
        )
    }

    return (
        <ErrorBoundary>
            <Toaster position="top-right" reverseOrder={false} />
            <NotificationListener />
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Public */}
                    <Route path="/"        element={<Navigate to="/login" replace />} />
                    <Route path="/docs"    element={<PublicDocumentation />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/purpose" element={<Purpose />} />
                    <Route path="/login"   element={user ? <Navigate to="/dashboard" /> : <Login />} />
                    <Route path="/register" element={<Navigate to="/login" />} />
                    <Route path="/pending-approval" element={<PendingApproval />} />
                    <Route path="/service-unavailable" element={<ServiceUnavailable />} />
                    {/* Not in Sidebar, not in ProtectedRoute — gated by its own access-code + auth check */}
                    <Route path="/billing-status" element={<BillingStatus />} />
                    <Route path="/invoice/:businessId/:branchId/:id" element={<Invoice />} />
                    <Route path="/verify/:businessId/:branchId/:saleId" element={<PublicInvoice />} />

                    {/* Protected */}
                    <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/pos"          element={<ProtectedRoute><POS /></ProtectedRoute>} />
                    <Route path="/sales"        element={<ProtectedRoute><Sales /></ProtectedRoute>} />
                    <Route path="/customers"    element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                    <Route path="/barcode"      element={<ProtectedRoute><Barcode /></ProtectedRoute>} />
                    <Route path="/user-settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
                    <Route path="/documentation" element={<ProtectedRoute><Documentation /></ProtectedRoute>} />
                    <Route path="/help"         element={<ProtectedRoute><Help /></ProtectedRoute>} />

                    {/* Manager + Owner */}
                    <Route path="/products"        element={<ProtectedRoute allowedRoles={['owner','manager']}><Products /></ProtectedRoute>} />
                    <Route path="/inventory"       element={<ProtectedRoute allowedRoles={['owner','manager']}><Inventory /></ProtectedRoute>} />
                    <Route path="/suppliers"       element={<ProtectedRoute allowedRoles={['owner','manager']}><Suppliers /></ProtectedRoute>} />
                    <Route path="/purchase-orders" element={<ProtectedRoute allowedRoles={['owner','manager']}><PurchaseOrders /></ProtectedRoute>} />
                    <Route path="/po-invoice/:id"  element={<ProtectedRoute allowedRoles={['owner','manager']}><POInvoice /></ProtectedRoute>} />
                    <Route path="/accounts-summary"        element={<ProtectedRoute allowedRoles={['owner','manager']}><AccountsSummary /></ProtectedRoute>} />
                    <Route path="/expenses"                element={<ProtectedRoute allowedRoles={['owner','manager']}><Expenses /></ProtectedRoute>} />
                    <Route path="/cash-flow"               element={<ProtectedRoute allowedRoles={['owner','manager']}><CashFlow /></ProtectedRoute>} />
                    <Route path="/register-reconciliation" element={<ProtectedRoute allowedRoles={['owner','manager']}><RegisterReconciliation /></ProtectedRoute>} />

                    {/* Owner only */}
                    <Route path="/employees" element={<ProtectedRoute allowedRoles={['owner']}><Employees /></ProtectedRoute>} />
                    <Route path="/branches"  element={<ProtectedRoute allowedRoles={['owner']}><Branches /></ProtectedRoute>} />
                    <Route path="/reports"   element={<ProtectedRoute allowedRoles={['owner']}><Reports /></ProtectedRoute>} />
                    <Route path="/settings"  element={<ProtectedRoute allowedRoles={['owner']}><Settings /></ProtectedRoute>} />
                    <Route path="/import"    element={<ProtectedRoute allowedRoles={['owner']}><Import /></ProtectedRoute>} />
                    <Route path="/backup"    element={<ProtectedRoute allowedRoles={['owner']}><Backup /></ProtectedRoute>} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    )
}

export default App
