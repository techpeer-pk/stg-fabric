import FirestoreService from '../firebase/firestore-multi-branch'
import usePreloadStore, { resetPreloadState } from '../store/preloadStore'

/**
 * App Preloader
 * After login, loads EVERY segment of the app — the lazy page chunks and the
 * Firestore collections they render — while the gray full-screen loader is
 * shown. Data lands in the query cache (see firebase/queryCache.js), so once
 * the loader disappears, navigating between segments is instant.
 */

const MANAGEMENT = ['owner', 'manager']
const OWNER = ['owner']

// The dynamic import() specifiers match App.jsx's lazy() imports, so Vite
// resolves them to the same chunks — preloading here warms React.lazy too.
const PAGE_SEGMENTS = [
    { label: 'Dashboard',        load: () => import('../pages/dashboard/Dashboard') },
    { label: 'Point of Sale',    load: () => import('../pages/pos/POS') },
    { label: 'Sales',            load: () => import('../pages/sales/Sales') },
    { label: 'Invoices',         load: () => import('../pages/sales/Invoice') },
    { label: 'Customers',        load: () => import('../pages/customers/Customers') },
    { label: 'Barcodes',         load: () => import('../pages/barcode/Barcode') },
    { label: 'User Settings',    load: () => import('../pages/auth/UserSettings') },
    { label: 'Documentation',    load: () => import('../pages/settings/Documentation') },
    { label: 'Help',             load: () => import('../pages/settings/Help') },
    { label: 'Products',         load: () => import('../pages/products/Products'),               roles: MANAGEMENT },
    { label: 'Inventory',        load: () => import('../pages/inventory/Inventory'),             roles: MANAGEMENT },
    { label: 'Suppliers',        load: () => import('../pages/inventory/Suppliers'),             roles: MANAGEMENT },
    { label: 'Purchase Orders',  load: () => import('../pages/inventory/PurchaseOrders'),        roles: MANAGEMENT },
    { label: 'PO Invoices',      load: () => import('../pages/inventory/POInvoice'),             roles: MANAGEMENT },
    { label: 'Accounts Summary', load: () => import('../pages/accounts/AccountsSummary'),        roles: MANAGEMENT },
    { label: 'Expenses',         load: () => import('../pages/accounts/Expenses'),               roles: MANAGEMENT },
    { label: 'Cash Flow',        load: () => import('../pages/accounts/CashFlow'),               roles: MANAGEMENT },
    { label: 'Reconciliation',   load: () => import('../pages/accounts/RegisterReconciliation'), roles: MANAGEMENT },
    { label: 'Employees',        load: () => import('../pages/employees/Employees'),             roles: OWNER },
    { label: 'Branches',         load: () => import('../pages/settings/Branches'),               roles: OWNER },
    { label: 'Reports',          load: () => import('../pages/reports/Reports'),                 roles: OWNER },
    { label: 'Settings',         load: () => import('../pages/settings/Settings'),               roles: OWNER },
    { label: 'Import',           load: () => import('../pages/settings/Import'),                 roles: OWNER },
    { label: 'Backup',           load: () => import('../pages/settings/Backup'),                 roles: OWNER },
]

// Warms the query cache with the exact calls pages make on mount.
const DATA_SEGMENTS = [
    { label: 'Business Profile', load: (b) => FirestoreService.getBusiness(b) },
    { label: 'Branch Info',      load: (b, br) => FirestoreService.getBranch(b, br) },
    { label: 'Branch List',      load: (b) => FirestoreService.getBranches(b) },
    { label: 'Products',         load: (b) => FirestoreService.getProducts(b) },
    { label: 'Stock',            load: (b, br) => FirestoreService.getInventory(b, br) },
    { label: 'Categories',       load: (b) => FirestoreService.getCategories(b) },
    { label: 'Customers',        load: (b) => FirestoreService.getCustomers(b) },
    { label: 'Sales History',    load: (b, br) => FirestoreService.getSales(b, br) },
    { label: 'Suspended Sales',  load: (b, br) => FirestoreService.getSuspendedSales(b, br) },
    { label: 'Barcodes',         load: (b) => FirestoreService.getBarcodes(b) },
    { label: 'Suppliers',        load: (b) => FirestoreService.getSuppliers(b),            roles: MANAGEMENT },
    { label: 'Purchase Orders',  load: (b, br) => FirestoreService.getPurchaseOrders(b, br), roles: MANAGEMENT },
    { label: 'Expenses',         load: (b, br) => FirestoreService.getExpenses(b, br),     roles: MANAGEMENT },
    { label: 'Cash Ledger',      load: (b, br) => FirestoreService.getCashFlow(b, br),     roles: MANAGEMENT },
    { label: 'Reconciliations',  load: (b, br) => FirestoreService.getReconciliations(b, br), roles: MANAGEMENT },
]

// Never trap the user on the loader — reveal the app even if something hangs.
const PRELOAD_TIMEOUT_MS = 30000

export const preloadKeyFor = (businessId, branchId) => `${businessId}::${branchId}`

const allowedFor = (roles, userRole) => !roles || userRole === 'owner' || roles.includes(userRole)

let runningKey = null

export async function startPreload({ businessId, branchId, userRole }) {
    const key = preloadKeyFor(businessId, branchId)
    if (usePreloadStore.getState().readyKey === key || runningKey === key) return
    runningKey = key

    const tasks = [
        ...PAGE_SEGMENTS.filter(s => allowedFor(s.roles, userRole))
            .map(s => ({ label: s.label, run: () => s.load() })),
        ...DATA_SEGMENTS.filter(s => allowedFor(s.roles, userRole))
            .map(s => ({ label: s.label, run: () => s.load(businessId, branchId) }))
    ]

    usePreloadStore.setState({ status: 'loading', done: 0, total: tasks.length, label: '' })

    let done = 0
    const all = Promise.all(tasks.map(async (task) => {
        try {
            await task.run()
        } catch (error) {
            console.warn(`⚠️ Preload: ${task.label} failed`, error)
        }
        done++
        if (runningKey === key) usePreloadStore.setState({ done, label: task.label })
    }))

    await Promise.race([all, new Promise(resolve => setTimeout(resolve, PRELOAD_TIMEOUT_MS))])

    if (runningKey === key) {
        runningKey = null
        usePreloadStore.setState({ readyKey: key, status: 'ready' })
    }
}

export const resetPreload = () => {
    runningKey = null
    resetPreloadState()
}
