/**
 * Skeleton Pre-loader Components — Fabric POS
 * Reusable shimmer skeletons for all pages
 */

// ── Base shimmer animation ──────────────────────────────────────────────────
export function SkeletonBox({ className = '' }) {
    return (
        <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`} />
    )
}

// ── Stat Card (Dashboard top cards) ────────────────────────────────────────
export function SkeletonStatCard() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex justify-between items-start">
                <SkeletonBox className="h-3 w-24" />
                <SkeletonBox className="h-8 w-8 rounded-xl" />
            </div>
            <SkeletonBox className="h-7 w-32" />
            <SkeletonBox className="h-3 w-20" />
        </div>
    )
}

// ── Chart area ──────────────────────────────────────────────────────────────
export function SkeletonChart({ height = 'h-52' }) {
    return (
        <div className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 ${height}`}>
            <SkeletonBox className="h-4 w-32 mb-4" />
            <div className="flex items-end gap-2 h-36">
                {[60, 80, 45, 90, 55, 75, 65].map((h, i) => (
                    <div
                        key={i}
                        className="flex-1 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-t-lg"
                        style={{ height: `${h}%` }}
                    />
                ))}
            </div>
        </div>
    )
}

// ── Table row skeleton ──────────────────────────────────────────────────────
export function SkeletonTableRow({ cols = 5 }) {
    return (
        <tr>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <SkeletonBox className={`h-4 ${i === 0 ? 'w-28' : i === cols - 1 ? 'w-16' : 'w-20'}`} />
                </td>
            ))}
        </tr>
    )
}

// ── Full Table skeleton ─────────────────────────────────────────────────────
export function SkeletonTable({ rows = 6, cols = 5 }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex gap-6">
                {Array.from({ length: cols }).map((_, i) => (
                    <SkeletonBox key={i} className="h-3 w-16" />
                ))}
            </div>
            {/* Rows */}
            <table className="w-full">
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {Array.from({ length: rows }).map((_, i) => (
                        <SkeletonTableRow key={i} cols={cols} />
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// ── Dashboard full skeleton ─────────────────────────────────────────────────
export function SkeletonDashboard() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonStatCard key={i} />
                ))}
            </div>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <SkeletonChart height="h-64" />
                </div>
                <SkeletonChart height="h-64" />
            </div>
            {/* Bottom tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SkeletonTable rows={4} cols={3} />
                <SkeletonTable rows={4} cols={3} />
            </div>
        </div>
    )
}

// ── Products page skeleton ──────────────────────────────────────────────────
export function SkeletonProducts() {
    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-9 w-28 rounded-xl" />
            </div>
            <SkeletonTable rows={8} cols={6} />
        </div>
    )
}

// ── Generic list page skeleton ──────────────────────────────────────────────
export function SkeletonList({ rows = 6, cols = 5 }) {
    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-9 w-28 rounded-xl" />
            </div>
            <SkeletonTable rows={rows} cols={cols} />
        </div>
    )
}

// ── POS skeleton ────────────────────────────────────────────────────────────
export function SkeletonPOS() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full animate-in fade-in duration-300">
            {/* Product grid */}
            <div className="lg:col-span-2 space-y-3">
                <SkeletonBox className="h-10 w-full rounded-xl" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-2">
                            <SkeletonBox className="h-16 w-full rounded-lg" />
                            <SkeletonBox className="h-3 w-24" />
                            <SkeletonBox className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </div>
            {/* Cart */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-3">
                <SkeletonBox className="h-5 w-20" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                        <SkeletonBox className="h-3 w-28" />
                        <SkeletonBox className="h-3 w-12" />
                    </div>
                ))}
                <div className="border-t dark:border-gray-800 pt-3 space-y-2">
                    <SkeletonBox className="h-4 w-full" />
                    <SkeletonBox className="h-10 w-full rounded-xl" />
                </div>
            </div>
        </div>
    )
}

// ── Barcode page skeleton ───────────────────────────────────────────────────
export function SkeletonBarcode() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-4">
                <SkeletonBox className="h-5 w-32" />
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-1">
                        <SkeletonBox className="h-3 w-20" />
                        <SkeletonBox className="h-10 w-full rounded-xl" />
                    </div>
                ))}
                <SkeletonBox className="h-11 w-full rounded-xl" />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-4">
                <SkeletonBox className="h-4 w-28" />
                <SkeletonBox className="h-32 w-48 rounded-xl" />
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-10 w-full rounded-xl" />
            </div>
        </div>
    )
}

// ── Default export: all variants ────────────────────────────────────────────
export default {
    Box: SkeletonBox,
    StatCard: SkeletonStatCard,
    Chart: SkeletonChart,
    Table: SkeletonTable,
    TableRow: SkeletonTableRow,
    Dashboard: SkeletonDashboard,
    Products: SkeletonProducts,
    List: SkeletonList,
    POS: SkeletonPOS,
    Barcode: SkeletonBarcode,
}
