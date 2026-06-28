import { NavLink } from 'react-router-dom'
import { logout } from '../../firebase/auth'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useAuthStore from '../../store/authStore-multi-branch'
import { requestNotificationPermission } from '../../firebase/messaging'
import toast from 'react-hot-toast'
import {
    LayoutDashboard, ShoppingCart, Package, Warehouse,
    ScanBarcode, Truck, ClipboardList, ReceiptText,
    Users, UserCog, GitBranch, BarChart2, Settings,
    Upload, Database, BookOpen, HelpCircle, UserCircle,
    DollarSign, Wallet, ArrowLeftRight, BookMarked,
    Bell, BellOff, LogOut, ChevronDown, ChevronRight,
    Building2
} from 'lucide-react'

const menuItems = [
    { path: '/dashboard',             icon: LayoutDashboard,   label: 'Dashboard',        roles: ['owner', 'manager', 'cashier'] },
    { path: '/pos',                   icon: ShoppingCart,      label: 'POS',               roles: ['owner', 'manager', 'cashier'] },
    { path: '/products',              icon: Package,           label: 'Products',          roles: ['owner', 'manager'] },
    { path: '/inventory',             icon: Warehouse,         label: 'Inventory',         roles: ['owner', 'manager'] },
    { path: '/barcode',               icon: ScanBarcode,       label: 'Barcode',           roles: ['owner', 'manager'] },
    { path: '/suppliers',             icon: Truck,             label: 'Suppliers',         roles: ['owner', 'manager'] },
    { path: '/purchase-orders',       icon: ClipboardList,     label: 'PO',                roles: ['owner', 'manager'] },
    { path: '/sales',                 icon: ReceiptText,       label: 'Sales',             roles: ['owner', 'manager', 'cashier'] },
    { path: '/customers',             icon: Users,             label: 'Customers',         roles: ['owner', 'manager', 'cashier'] },
    { path: '/employees',             icon: UserCog,           label: 'Employees',         roles: ['owner'] },
    { path: '/branches',              icon: GitBranch,         label: 'Branches',          roles: ['owner'] },
    { path: '/reports',               icon: BarChart2,         label: 'Reports',           roles: ['owner'] },
    { path: '/settings',              icon: Settings,          label: 'Settings',          roles: ['owner'] },
    { path: '/import',                icon: Upload,            label: 'Import Data',       roles: ['owner'] },
    { path: '/backup',                icon: Database,          label: 'Backup & Restore',  roles: ['owner'] },
    { path: '/accounts-summary',      icon: DollarSign,        label: 'Summary',           roles: ['owner', 'manager'] },
    { path: '/expenses',              icon: Wallet,            label: 'Expenses',          roles: ['owner', 'manager'] },
    { path: '/cash-flow',             icon: ArrowLeftRight,    label: 'Cash Flow',         roles: ['owner', 'manager'] },
    { path: '/register-reconciliation', icon: BookMarked,      label: 'Register Close',    roles: ['owner', 'manager'] },
    { path: '/documentation',         icon: BookOpen,          label: 'Documentation',     roles: ['owner', 'manager', 'cashier'] },
    { path: '/help',                  icon: HelpCircle,        label: 'Help & Support',    roles: ['owner', 'manager', 'cashier'] },
    { path: '/user-settings',         icon: UserCircle,        label: 'Profile',           roles: ['owner', 'manager', 'cashier'] },
]

const menuGroups = [
    { title: 'Main',           paths: ['/dashboard', '/pos'] },
    { title: 'Management',     paths: ['/products', '/inventory', '/barcode', '/suppliers', '/purchase-orders'] },
    { title: 'Sales',          paths: ['/sales', '/customers'] },
    { title: 'Administration', paths: ['/employees', '/branches', '/reports', '/settings', '/import', '/backup'] },
    { title: 'Accounts',       paths: ['/accounts-summary', '/expenses', '/cash-flow', '/register-reconciliation'] },
    { title: 'Help',           paths: ['/documentation', '/help', '/user-settings'] },
]

function Sidebar({ isOpen, setIsOpen }) {
    const navigate = useNavigate()
    const { user, businessId, userRole, branchName, assignedBranches, switchBranch } = useAuthStore()
    const [showBranchDropdown, setShowBranchDropdown] = useState(false)
    const [notifLoading, setNotifLoading] = useState(false)
    const [openGroups, setOpenGroups] = useState(() => {
        const initial = {}
        menuGroups.forEach(g => { initial[g.title] = g.title === 'Main' })
        return initial
    })

    const handleEnableNotifications = async () => {
        setNotifLoading(true)
        const token = await requestNotificationPermission(businessId, user.uid)
        if (token) toast.success('Notifications enabled successfully!')
        else toast.error('Could not enable notifications. Please check browser settings.')
        setNotifLoading(false)
    }

    const filteredMenu = menuItems.filter(item => !item.roles || item.roles.includes(userRole))

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className={`h-screen w-64 bg-gray-900 dark:bg-black text-white flex flex-col fixed left-0 top-0 z-[50] transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

            {/* ── Logo ── */}
            <div className="px-5 py-4 border-b border-gray-700 dark:border-gray-800 flex items-center gap-3">
                <img
                    src="/stg_logo.jpeg"
                    alt="STG Logo"
                    className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                />
                <div>
                    <h1 className="text-base font-black text-white leading-tight">Fabric POS</h1>
                    <p className="text-gray-400 text-xs">Fabric Factory Management</p>
                </div>
            </div>

            {/* ── Branch Selector ── */}
            {assignedBranches && assignedBranches.length > 0 && (
                <div className="px-4 py-3 border-b border-gray-700 dark:border-gray-800">
                    <div className="relative">
                        <button
                            onClick={() => userRole !== 'cashier' && setShowBranchDropdown(!showBranchDropdown)}
                            disabled={userRole === 'cashier'}
                            className={`w-full flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg text-sm text-white font-medium transition ${userRole !== 'cashier' ? 'hover:bg-gray-700 cursor-pointer' : 'cursor-default opacity-90'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Building2 size={15} className="text-gray-400 flex-shrink-0" />
                                <div className="text-left">
                                    <p className="text-xs text-gray-400 leading-none">Branch</p>
                                    <p className="text-sm font-semibold mt-0.5">{branchName || 'Select Branch'}</p>
                                </div>
                            </div>
                            {userRole !== 'cashier' && (
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`} />
                            )}
                        </button>

                        {showBranchDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                                {assignedBranches.map((branch) => (
                                    <button
                                        key={branch.branchId}
                                        onClick={() => { switchBranch(branch.branchId, branch.branchName); setShowBranchDropdown(false) }}
                                        className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
                                    >
                                        <Building2 size={13} className="text-gray-400" />
                                        {branch.branchName}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Navigation ── */}
            <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
                {menuGroups.map((group) => {
                    const items = filteredMenu.filter(i => group.paths.includes(i.path))
                    if (!items.length) return null
                    const open = !!openGroups[group.title]
                    return (
                        <div key={group.title}>
                            <button
                                type="button"
                                onClick={() => setOpenGroups(prev => ({ ...prev, [group.title]: !prev[group.title] }))}
                                className="w-full flex items-center justify-between px-2 mb-1.5 text-[10px] uppercase text-gray-500 font-black tracking-widest h-7 hover:text-gray-300 transition"
                                aria-expanded={open}
                            >
                                <span>{group.title}</span>
                                <ChevronRight size={12} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
                            </button>

                            {open && (
                                <div className="bg-gray-800/50 dark:bg-white/5 rounded-lg p-1.5 space-y-0.5">
                                    {items.map((item) => {
                                        const Icon = item.icon
                                        return (
                                            <NavLink
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setIsOpen(false)}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-3 px-3 py-2.5 rounded-md transition text-sm font-medium ${isActive
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                                        : 'text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10 hover:text-white'
                                                    }`
                                                }
                                            >
                                                <Icon size={16} className="flex-shrink-0" />
                                                {item.label}
                                            </NavLink>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>

            {/* ── Footer Actions ── */}
            <div className="p-3 border-t border-gray-700 dark:border-gray-800 space-y-1">
                <button
                    onClick={handleEnableNotifications}
                    disabled={notifLoading}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-400 hover:bg-blue-600/10 transition w-full text-sm font-medium border border-blue-900/30"
                >
                    {notifLoading
                        ? <BellOff size={16} className="animate-pulse" />
                        : <Bell size={16} />
                    }
                    {notifLoading ? 'Enabling...' : 'Enable Alerts'}
                </button>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-red-600 hover:text-white transition w-full text-sm font-medium"
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>

        </div>
    )
}

export default Sidebar
