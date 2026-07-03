import { useState, useRef } from 'react'
import Layout from '../../components/layout/Layout'
import { db } from '../../firebase/config'
import useAuthStore from '../../store/authStore-multi-branch'
import {
    collection,
    getDocs,
    doc,
    writeBatch,
} from 'firebase/firestore'

// ── Constants ─────────────────────────────────────────────────────────────────
const ALL_COLLECTIONS = [
    { id: 'products', label: 'Products', icon: 'box', defaultOn: true },
    { id: 'categories', label: 'Categories', icon: 'tag', defaultOn: true },
    { id: 'inventory', label: 'Inventory', icon: 'warehouse', defaultOn: true },
    { id: 'customers', label: 'Customers', icon: 'users', defaultOn: true },
    { id: 'suppliers', label: 'Suppliers', icon: 'factory', defaultOn: false },
    { id: 'users', label: 'Users/Staff', icon: 'briefcase', defaultOn: false },
    { id: 'sales', label: 'Sales', icon: 'dollar', defaultOn: false },
    { id: 'sales_returns', label: 'Sales Returns', icon: 'undo', defaultOn: false },
    { id: 'purchase_orders', label: 'Purchase Orders', icon: 'fileText', defaultOn: false },
    { id: 'expenses', label: 'Expenses', icon: 'card', defaultOn: false },
    { id: 'cash_flow', label: 'Cash Flow', icon: 'banknote', defaultOn: false },
    { id: 'reconciliations', label: 'Reconciliations', icon: 'listCheck', defaultOn: false },
    { id: 'suspended_sales', label: 'Suspended Sales', icon: 'pause', defaultOn: false },
    { id: 'settings', label: 'Settings', icon: 'gear', defaultOn: false },
]

const BATCH_SIZE = 499

// ── Helpers ───────────────────────────────────────────────────────────────────
function timestamp() {
    return new Date().toLocaleTimeString()
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function nowFilename() {
    const d = new Date()
    const pad = n => String(n).padStart(2, '0')
    return `gpos-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`
}

// ── Inline SVG icons (replace emojis) ───────────────────────────────────────────
const ICON_PATHS = {
    box: <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>,
    tag: <><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /><circle cx="7.5" cy="7.5" r=".5" fill="currentColor" /></>,
    warehouse: <><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18" /><path d="M8 21v-8h8v8" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    factory: <><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M7 18h.01M12 18h.01M17 18h.01" /></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
    dollar: <><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
    undo: <><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></>,
    fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8M16 17H8" /></>,
    card: <><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></>,
    banknote: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></>,
    listCheck: <><path d="M11 12H3M16 6H3M16 18H3" /><path d="m17 12 2 2 4-4" /></>,
    pause: <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></>,
    trash: <><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6M14 11v6" /></>,
    folder: <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />,
    check: <path d="M20 6 9 17l-5-5" />,
    bulb: <><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6M10 22h4" /></>,
    clipboardList: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 12h6M9 16h6" /></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    spinner: <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
}

function Icon({ name, className = 'w-4 h-4' }) {
    const path = ICON_PATHS[name]
    if (!path) return null
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {path}
        </svg>
    )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Backup() {
    const { businessId, branchId, userRole } = useAuthStore()

    // Export state
    const [exportCols, setExportCols] = useState(
        Object.fromEntries(ALL_COLLECTIONS.map(c => [c.id, c.defaultOn]))
    )

    // Delete state — nothing pre-selected (destructive)
    const [deleteCols, setDeleteCols] = useState(
        Object.fromEntries(ALL_COLLECTIONS.map(c => [c.id, false]))
    )

    // Import state
    const [importFile, setImportFile] = useState(null)
    const [importData, setImportData] = useState(null)
    const [mergeMode, setMergeMode] = useState(true)
    const fileRef = useRef()

    // Shared operation state
    const [running, setRunning] = useState(false)
    const [logs, setLogs] = useState([])
    const [progress, setProgress] = useState({ done: 0, total: 0 })
    const [status, setStatus] = useState('idle') // idle | running | done | error
    const [history, setHistory] = useState([])

    const logRef = useRef()

    // ── Scope Helper ──────────────────────────────────────────────────────────
    function getCollectionRef(colId) {
        if (!businessId) return null

        const branchSpecific = [
            'inventory', 'sales', 'sales_returns', 'purchase_orders',
            'expenses', 'cash_flow', 'reconciliations', 'suspended_sales'
        ]

        if (colId === 'users') {
            return collection(db, 'business_users', businessId)
        }

        if (branchSpecific.includes(colId)) {
            if (!branchId) return null
            return collection(db, 'businesses', businessId, 'branches', branchId, colId)
        }

        // Shared business-level collections
        return collection(db, 'businesses', businessId, colId)
    }

    function getDocRef(colId, docId) {
        const colRef = getCollectionRef(colId)
        if (!colRef) return null
        return doc(colRef, docId)
    }

    // ── Logging ──────────────────────────────────────────────────────────────
    function addLog(type, msg) {
        setLogs(prev => {
            const next = [...prev, { type, msg, time: timestamp() }]
            setTimeout(() => {
                if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
            }, 30)
            return next
        })
    }

    function resetLog() {
        setLogs([])
        setProgress({ done: 0, total: 0 })
        setStatus('running')
    }

    // ── Export ───────────────────────────────────────────────────────────────
    async function startExport() {
        const selected = ALL_COLLECTIONS.filter(c => exportCols[c.id])
        if (selected.length === 0) return alert('Select at least one collection to export.')

        setRunning(true)
        resetLog()
        addLog('info', `🚀 Starting export of ${selected.length} collection(s)...`)

        const backup = {
            __meta__: {
                exportedAt: new Date().toISOString(),
                project: 'GPOS',
                collections: selected.map(c => c.id),
                version: '1.0'
            },
            __collections__: {}
        }

        let total = 0
        let done = 0

        try {
            // First pass — count docs
            for (const col of selected) {
                const colRef = getCollectionRef(col.id)
                if (!colRef) continue
                const snap = await getDocs(colRef)
                total += snap.size
            }
            setProgress({ done: 0, total })
            addLog('info', `📊 Found ${total} total documents across ${selected.length} collections`)
            addLog('info', `🏢 Scope: Business(${businessId}) | Branch(${branchId || 'Global'})`)

            // Second pass — export
            for (const col of selected) {
                const colRef = getCollectionRef(col.id)
                if (!colRef) {
                    addLog('warn', `  ⚠️ Skipping ${col.label} — Path not available in this context`)
                    continue
                }
                const snap = await getDocs(colRef)
                backup.__collections__[col.id] = {}

                for (const docSnap of snap.docs) {
                    backup.__collections__[col.id][docSnap.id] = {
                        ...docSnap.data(),
                        __collections__: {}
                    }
                    done++
                    setProgress({ done, total })
                }

                addLog('ok', `  ✅ ${col.label} — ${snap.size} docs`)
            }

            // Download
            const json = JSON.stringify(backup, null, 2)
            const blob = new Blob([json], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const filename = nowFilename()
            const a = document.createElement('a')
            a.href = url; a.download = filename; a.click()
            URL.revokeObjectURL(url)

            const size = formatBytes(blob.size)
            addLog('done', `🎉 Export complete! ${done} documents · ${size} · "${filename}"`)
            setStatus('done')

            // Save to history
            setHistory(prev => [{
                filename,
                size,
                docs: done,
                cols: selected.length,
                time: new Date().toLocaleString(),
                data: json
            }, ...prev])

        } catch (err) {
            addLog('error', '❌ Export failed: ' + err.message)
            setStatus('error')
        } finally {
            setRunning(false)
        }
    }

    // ── File select ──────────────────────────────────────────────────────────
    function handleFileSelect(e) {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = ev => {
            try {
                const parsed = JSON.parse(ev.target.result)
                setImportData(parsed)
                setImportFile(file)
                addLog('info', `📂 Loaded: ${file.name} (${formatBytes(file.size)})`)

                // Show meta if available
                if (parsed.__meta__) {
                    const m = parsed.__meta__
                    addLog('info', `   Exported: ${m.exportedAt ? new Date(m.exportedAt).toLocaleString() : 'unknown'}`)
                    addLog('info', `   Collections: ${(m.collections || []).join(', ')}`)
                }
                const colIds = Object.keys(parsed.__collections__ || parsed)
                const totalDocs = Object.values(parsed.__collections__ || parsed)
                    .reduce((s, col) => s + Object.keys(col).length, 0)
                addLog('info', `   Preview: ${colIds.length} collections, ${totalDocs} documents`)
                setStatus('idle')
            } catch (err) {
                addLog('error', '❌ Invalid JSON: ' + err.message)
                setImportData(null)
                setImportFile(null)
            }
        }
        reader.readAsText(file)
        setLogs([]) // clear previous logs
    }

    // ── Import ───────────────────────────────────────────────────────────────
    async function startImport() {
        if (!importData) return alert('Load a backup file first.')

        const confirmed = window.confirm(
            mergeMode
                ? `Merge import: existing documents NOT in the file will be kept. Continue?`
                : `Full restore: this will OVERWRITE all matching documents. Continue?`
        )
        if (!confirmed) return

        setRunning(true)
        resetLog()

        const collections = importData.__collections__ || importData
        const colNames = Object.keys(collections)
        const totalDocs = Object.values(collections).reduce((s, c) => s + Object.keys(c).length, 0)

        addLog('info', `🚀 Starting import — ${colNames.length} collections, ${totalDocs} documents`)
        addLog('info', `   Mode: ${mergeMode ? 'Merge (safe)' : 'Overwrite'}`)

        let done = 0
        setProgress({ done: 0, total: totalDocs })

        try {
            for (const colName of colNames) {
                const docs = collections[colName]
                const docIds = Object.keys(docs)
                addLog('info', `  ↳ [${colName}] — ${docIds.length} docs`)

                for (let i = 0; i < docIds.length; i += BATCH_SIZE) {
                    const batch = writeBatch(db)
                    const chunk = docIds.slice(i, i + BATCH_SIZE)

                    for (const docId of chunk) {
                        const { __collections__, ...cleanData } = docs[docId]
                        const ref = getDocRef(colName, docId)
                        if (ref) {
                            batch.set(ref, cleanData)
                        }
                    }

                    await batch.commit()
                    done += chunk.length
                    setProgress({ done, total: totalDocs })
                }

                addLog('ok', `  ✅ [${colName}] imported ${docIds.length} docs`)
            }

            addLog('done', `🎉 Import complete! ${done} documents restored.`)
            setStatus('done')
        } catch (err) {
            addLog('error', '❌ Import failed: ' + err.message)
            setStatus('error')
        } finally {
            setRunning(false)
        }
    }

    // ── Delete (per-collection, mirrors Export) ────────────────────────────────
    async function startDelete() {
        const selected = ALL_COLLECTIONS.filter(c => deleteCols[c.id])
        if (selected.length === 0) return alert('Select at least one collection to delete.')

        const typed = window.prompt(
            `WARNING: This permanently deletes ${selected.length} collection(s):\n\n` +
            selected.map(c => `• ${c.label}`).join('\n') +
            `\n\nType "DELETE" to confirm:`
        )
        if (typed !== 'DELETE') {
            if (typed !== null) alert('Cancelled — "DELETE" did not match.')
            return
        }

        setRunning(true)
        resetLog()
        addLog('warn', `🗑️ Deleting ${selected.length} collection(s)...`)
        addLog('info', `🏢 Scope: Business(${businessId}) | Branch(${branchId || 'Global'})`)

        let total = 0
        let done = 0

        try {
            // First pass — count docs
            for (const col of selected) {
                const colRef = getCollectionRef(col.id)
                if (!colRef) continue
                const snap = await getDocs(colRef)
                total += snap.size
            }
            setProgress({ done: 0, total })
            addLog('info', `📊 Found ${total} document(s) to delete`)

            // Second pass — delete
            for (const col of selected) {
                const colRef = getCollectionRef(col.id)
                if (!colRef) {
                    addLog('warn', `  ⚠️ Skipping ${col.label} — path not available in this context`)
                    continue
                }
                const snap = await getDocs(colRef)
                if (snap.empty) { addLog('info', `  ↷ ${col.label}: empty`); continue }

                for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
                    const batch = writeBatch(db)
                    const chunk = snap.docs.slice(i, i + BATCH_SIZE)
                    chunk.forEach(d => batch.delete(d.ref))
                    await batch.commit()
                    done += chunk.length
                    setProgress({ done, total })
                }

                addLog('ok', `  ✅ ${col.label} — ${snap.size} deleted`)
            }

            addLog('done', `🎉 Delete complete! ${done} document(s) removed.`)
            setStatus('done')
        } catch (err) {
            addLog('error', '❌ Delete failed: ' + err.message)
            setStatus('error')
        } finally {
            setRunning(false)
        }
    }

    // ── Re-download from history ──────────────────────────────────────────────
    function reDownload(item) {
        const blob = new Blob([item.data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = item.filename; a.click()
        URL.revokeObjectURL(url)
    }

    // ── UI helpers ────────────────────────────────────────────────────────────
    const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0

    const logColors = {
        info: 'text-gray-400',
        ok: 'text-green-400',
        warn: 'text-yellow-400',
        error: 'text-red-400',
        done: 'text-green-300 font-bold',
    }

    const statusUI = {
        idle: { label: 'Idle', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-500' },
        running: { label: 'Running', dot: 'bg-yellow-400 animate-pulse', badge: 'bg-yellow-50 text-yellow-600' },
        done: { label: 'Done', dot: 'bg-green-500', badge: 'bg-green-50 text-green-600' },
        error: { label: 'Error', dot: 'bg-red-500', badge: 'bg-red-50 text-red-600' },
    }

    const sc = statusUI[status]

    if (userRole !== 'owner') {
        return (
            <Layout>
                <div className="p-12 text-center">
                    <div className="flex justify-center mb-4 text-gray-400"><Icon name="lock" className="w-10 h-10" /></div>
                    <h2 className="text-xl font-bold text-gray-800">Access Restricted</h2>
                    <p className="text-gray-500 mt-2">Only the Business Owner can perform backup or restore operations.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="p-6 max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-6 mt-2">
                    <h1 className="text-2xl font-bold text-gray-800">Backup & Restore</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Export your Firestore data as JSON backups, or restore from a previous backup file.
                    </p>
                </div>

                {/* Info banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
                    <span className="flex-shrink-0 text-amber-500"><Icon name="bulb" className="w-5 h-5" /></span>
                    <div className="text-sm text-amber-800">
                        <strong>Best practice:</strong> Export a backup before importing new products, updating prices in bulk, or making major inventory changes.
                        Backups are downloaded to your computer — nothing is stored on any external server.
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                    {/* ── EXPORT ────────────────────────────────────────── */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-green-600 px-5 py-3">
                            <h2 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2"><Icon name="download" className="w-4 h-4" /> Export Backup</h2>
                            <p className="text-green-100 text-xs mt-0.5">Download Firestore data as JSON</p>
                        </div>
                        <div className="p-5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Select Collections</p>
                            <div className="grid grid-cols-2 gap-2 mb-5">
                                {ALL_COLLECTIONS.map(col => (
                                    <label key={col.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-900 select-none">
                                        <input
                                            type="checkbox"
                                            checked={!!exportCols[col.id]}
                                            onChange={e => setExportCols(p => ({ ...p, [col.id]: e.target.checked }))}
                                            className="rounded accent-green-600 w-4 h-4"
                                        />
                                        <span className="flex items-center gap-1.5"><Icon name={col.icon} className="w-4 h-4 text-gray-400" /> {col.label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Select all / none */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setExportCols(Object.fromEntries(ALL_COLLECTIONS.map(c => [c.id, true])))}
                                    className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={() => setExportCols(Object.fromEntries(ALL_COLLECTIONS.map(c => [c.id, false])))}
                                    className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    None
                                </button>
                            </div>

                            <button
                                onClick={startExport}
                                disabled={running}
                                className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-40 transition flex items-center justify-center gap-2"
                            >
                                {running
                                    ? <><Icon name="spinner" className="w-4 h-4 animate-spin" /> Exporting...</>
                                    : <><Icon name="download" className="w-4 h-4" /> Export Now</>}
                            </button>
                        </div>
                    </div>

                    {/* ── IMPORT / RESTORE ──────────────────────────────── */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-blue-600 px-5 py-3">
                            <h2 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2"><Icon name="upload" className="w-4 h-4" /> Import / Restore</h2>
                            <p className="text-blue-100 text-xs mt-0.5">Restore from backup or import new data</p>
                        </div>
                        <div className="p-5">

                            {/* File drop */}
                            <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition mb-4 ${importFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
                                <span className="mb-1">{importFile ? <Icon name="check" className="w-7 h-7 text-green-500" /> : <Icon name="folder" className="w-7 h-7 text-gray-400" />}</span>
                                <span className="text-sm font-medium text-gray-600">
                                    {importFile ? importFile.name : 'Click to select backup JSON'}
                                </span>
                                {importFile && (
                                    <span className="text-xs text-gray-400 mt-1">{formatBytes(importFile.size)}</span>
                                )}
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </label>

                            {/* Mode */}
                            <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={mergeMode}
                                        onChange={() => setMergeMode(true)}
                                        className="mt-0.5 accent-blue-600"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Merge <span className="text-xs text-green-600 font-bold">(Recommended)</span></p>
                                        <p className="text-xs text-gray-400">Adds/updates docs in file. Keeps existing docs not in file.</p>
                                    </div>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={!mergeMode}
                                        onChange={() => setMergeMode(false)}
                                        className="mt-0.5 accent-blue-600"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Overwrite</p>
                                        <p className="text-xs text-gray-400">Overwrites all matching documents with file data.</p>
                                    </div>
                                </label>
                            </div>

                            <button
                                onClick={startImport}
                                disabled={running || !importData}
                                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition flex items-center justify-center gap-2"
                            >
                                {running
                                    ? <><Icon name="spinner" className="w-4 h-4 animate-spin" /> Importing...</>
                                    : <><Icon name="upload" className="w-4 h-4" /> Restore / Import</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── DELETE ───────────────────────────────────────────── */}
                <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm mb-6">
                    <div className="bg-red-600 px-5 py-3 flex items-center justify-between">
                        <div>
                            <h2 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2"><Icon name="trash" className="w-4 h-4" /> Delete Data</h2>
                            <p className="text-red-100 text-xs mt-0.5">Permanently remove selected collections</p>
                        </div>
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter border border-red-400">DANGER</span>
                    </div>
                    <div className="p-5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Select Collections to Delete</p>
                        <div className="grid grid-cols-2 gap-2 mb-5">
                            {ALL_COLLECTIONS.map(col => (
                                <label key={col.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-900 select-none">
                                    <input
                                        type="checkbox"
                                        checked={!!deleteCols[col.id]}
                                        onChange={e => setDeleteCols(p => ({ ...p, [col.id]: e.target.checked }))}
                                        className="rounded accent-red-600 w-4 h-4"
                                    />
                                    <span className="flex items-center gap-1.5"><Icon name={col.icon} className="w-4 h-4 text-gray-400" /> {col.label}</span>
                                </label>
                            ))}
                        </div>

                        {/* Select all / none */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setDeleteCols(Object.fromEntries(ALL_COLLECTIONS.map(c => [c.id, true])))}
                                className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                            >
                                Select All
                            </button>
                            <button
                                onClick={() => setDeleteCols(Object.fromEntries(ALL_COLLECTIONS.map(c => [c.id, false])))}
                                className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                            >
                                None
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mb-4">
                            Scope: current business &amp; branch. <strong className="text-red-600">This cannot be undone</strong> — export a backup first.
                        </p>

                        <button
                            onClick={startDelete}
                            disabled={running}
                            className="w-full py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition flex items-center justify-center gap-2"
                        >
                            {running
                                ? <><Icon name="spinner" className="w-4 h-4 animate-spin" /> Deleting...</>
                                : <><Icon name="trash" className="w-4 h-4" /> Delete Selected</>}
                        </button>
                    </div>
                </div>

                {/* ── Export History ─────────────────────────────────── */}
                {history.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Icon name="clipboardList" className="w-4 h-4" /> Session Export History</p>
                        <div className="divide-y divide-gray-100">
                            {history.map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 font-mono">{item.filename}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {item.docs} docs · {item.cols} collections · {item.size} · {item.time}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => reDownload(item)}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition flex items-center gap-1.5"
                                    >
                                        <Icon name="download" className="w-3.5 h-3.5" /> Re-download
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Log Panel ──────────────────────────────────────── */}
                {(logs.length > 0 || status !== 'idle') && (
                    <div className="bg-gray-900 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Operation Log</p>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${sc.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                                {sc.label}
                            </span>
                        </div>

                        {/* Progress bar */}
                        {progress.total > 0 && (
                            <div className="mb-3">
                                <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
                                    <div
                                        className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: pct + '%' }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{progress.done} / {progress.total} documents</span>
                                    <span>{pct}%</span>
                                </div>
                            </div>
                        )}

                        {/* Log output */}
                        <div
                            ref={logRef}
                            className="font-mono text-xs space-y-0.5 max-h-60 overflow-y-auto"
                        >
                            {logs.map((l, i) => (
                                <div key={i} className={logColors[l.type] || 'text-gray-400'}>
                                    <span className="text-gray-600">{l.time} › </span>{l.msg}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    )
}
