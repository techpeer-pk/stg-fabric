import { useState, useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import { Html5QrcodeScanner } from 'html5-qrcode'
import Layout from '../../components/layout/Layout'
import {
    addBarcode, getBarcodes, getBarcodeByCode, updateBarcode,
    getProducts
} from '../../firebase/firestore-multi-branch'
import { SkeletonBarcode } from '../../components/common/skeleton/Skeleton'
import useAuthStore from '../../store/authStore-multi-branch'
import { handleError, showSuccess } from '../../utils/errorHandler'
import { serverTimestamp } from 'firebase/firestore'

const STAGES = [
    { value: 'received',    label: 'Maal Received',      color: 'bg-yellow-100 text-yellow-800' },
    { value: 'production',  label: 'In Production',      color: 'bg-blue-100 text-blue-800' },
    { value: 'qc_check',    label: 'QC Check',           color: 'bg-orange-100 text-orange-800' },
    { value: 'qc_passed',   label: 'QC Passed',          color: 'bg-green-100 text-green-800' },
    { value: 'qc_failed',   label: 'QC Failed',          color: 'bg-red-100 text-red-800' },
    { value: 'warehouse',   label: 'In Warehouse',       color: 'bg-purple-100 text-purple-800' },
    { value: 'shipped',     label: 'Shipped',            color: 'bg-indigo-100 text-indigo-800' },
    { value: 'delivered',   label: 'Delivered',          color: 'bg-teal-100 text-teal-800' },
    { value: 'sold',        label: 'Sold',               color: 'bg-gray-100 text-gray-800' },
]

function generateBarcodeId() {
    const year = new Date().getFullYear()
    const num = Math.floor(10000 + Math.random() * 90000)
    return `FAB-${year}-${num}`
}

export default function Barcode() {
    const { businessId, branchId, user } = useAuthStore()

    const [tab, setTab] = useState('generate') // 'generate' | 'scan' | 'history'
    const [products, setProducts] = useState([])
    const [productsLoading, setProductsLoading] = useState(true)
    const [selectedProduct, setSelectedProduct] = useState('')
    const [barcodeId, setBarcodeId] = useState('')
    const [rollNo, setRollNo] = useState('')
    const [quantity, setQuantity] = useState('')
    const [loading, setLoading] = useState(false)

    const [scanResult, setScanResult] = useState(null)
    const [scanError, setScanError] = useState('')
    const [scannerStarted, setScannerStarted] = useState(false)
    const [newStage, setNewStage] = useState('')
    const [stageLoading, setStageLoading] = useState(false)

    const [barcodes, setBarcodes] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)

    const barcodeRef = useRef(null)
    const scannerRef = useRef(null)

    useEffect(() => {
        if (businessId) fetchProducts()
    }, [businessId])

    useEffect(() => {
        if (tab === 'history' && businessId) fetchBarcodes()
        if (tab !== 'scan' && scannerRef.current) {
            scannerRef.current.clear().catch(() => {})
            scannerRef.current = null
            setScannerStarted(false)
        }
    }, [tab])

    useEffect(() => {
        if (barcodeId && barcodeRef.current) {
            try {
                JsBarcode(barcodeRef.current, barcodeId, {
                    format: 'CODE128',
                    width: 2,
                    height: 60,
                    displayValue: true,
                    fontSize: 14,
                })
            } catch (_) {}
        }
    }, [barcodeId])

    const fetchProducts = async () => {
        try {
            const snap = await getProducts(businessId)
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch (err) {
            handleError(err, 'Fetch Products')
        } finally {
            setProductsLoading(false)
        }
    }

    const fetchBarcodes = async () => {
        setHistoryLoading(true)
        try {
            const snap = await getBarcodes(businessId)
            setBarcodes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch (err) {
            handleError(err, 'Fetch Barcodes')
        } finally {
            setHistoryLoading(false)
        }
    }

    const handleGenerate = async (e) => {
        e.preventDefault()
        if (!selectedProduct) return
        setLoading(true)
        try {
            const product = products.find(p => p.id === selectedProduct)
            const newBarcode = generateBarcodeId()
            const barcodeData = {
                barcodeId: newBarcode,
                productId: selectedProduct,
                productName: product.name,
                fabricType: product.fabricType || '',
                color: product.color || '',
                width: product.width || '',
                rollNo: rollNo || '-',
                quantity: parseFloat(quantity) || 0,
                unit: product.unit || 'meters',
                currentStage: 'received',
                history: [{
                    stage: 'received',
                    label: 'Maal Received',
                    timestamp: new Date().toISOString(),
                    by: user?.email || 'system',
                }],
                createdAt: serverTimestamp(),
                branchId,
            }
            await addBarcode(businessId, barcodeData)
            setBarcodeId(newBarcode)
            setRollNo('')
            setQuantity('')
            showSuccess(`Barcode generated: ${newBarcode}`)
        } catch (err) {
            handleError(err, 'Generate Barcode', 'Failed to generate barcode')
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        const svg = barcodeRef.current
        if (!svg) return
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
            <html><head><title>Barcode - ${barcodeId}</title>
            <style>body{display:flex;justify-content:center;padding:20px;font-family:sans-serif;}
            .label{border:1px solid #ccc;padding:16px;text-align:center;width:240px;}
            h3{margin:0 0 8px;font-size:14px;}p{margin:4px 0;font-size:12px;color:#555;}</style>
            </head><body>
            <div class="label">
                <h3>Fabric POS</h3>
                ${svg.outerHTML}
                <p>${products.find(p => p.id === selectedProduct)?.name || ''}</p>
            </div>
            <script>window.onload=()=>{window.print();window.close()}</script>
            </body></html>
        `)
        printWindow.document.close()
    }

    const startScanner = () => {
        if (scannerRef.current) return
        setScanResult(null)
        setScanError('')
        const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false)
        scanner.render(
            async (decodedText) => {
                scanner.clear().catch(() => {})
                scannerRef.current = null
                setScannerStarted(false)
                await lookupBarcode(decodedText)
            },
            (err) => { if (!err?.includes('No MultiFormat')) setScanError(err) }
        )
        scannerRef.current = scanner
        setScannerStarted(true)
    }

    const lookupBarcode = async (code) => {
        setScanResult(null)
        setScanError('')
        try {
            const snap = await getBarcodeByCode(businessId, code)
            if (snap.empty) {
                setScanError(`Barcode nahi mila: ${code}`)
                return
            }
            const docSnap = snap.docs[0]
            setScanResult({ id: docSnap.id, ...docSnap.data() })
        } catch (err) {
            handleError(err, 'Lookup Barcode')
        }
    }

    const handleManualLookup = (e) => {
        e.preventDefault()
        const val = e.target.elements.manualCode.value.trim()
        if (val) lookupBarcode(val)
    }

    const handleStageUpdate = async () => {
        if (!newStage || !scanResult) return
        setStageLoading(true)
        try {
            const stageLabel = STAGES.find(s => s.value === newStage)?.label || newStage
            const updatedHistory = [
                ...(scanResult.history || []),
                {
                    stage: newStage,
                    label: stageLabel,
                    timestamp: new Date().toISOString(),
                    by: user?.email || 'system',
                }
            ]
            await updateBarcode(businessId, scanResult.id, {
                currentStage: newStage,
                history: updatedHistory
            })
            setScanResult(prev => ({ ...prev, currentStage: newStage, history: updatedHistory }))
            setNewStage('')
            showSuccess('Stage updated!')
        } catch (err) {
            handleError(err, 'Update Stage')
        } finally {
            setStageLoading(false)
        }
    }

    const getStageStyle = (val) => STAGES.find(s => s.value === val)?.color || 'bg-gray-100 text-gray-700'
    const getStageLabel = (val) => STAGES.find(s => s.value === val)?.label || val

    if (productsLoading) {
        return (
            <Layout title="Barcode">
                <div className="mt-12">
                    <SkeletonBarcode />
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Barcode">
            {/* Tab Bar */}
            <div className="flex gap-2 mb-6 mt-12 border-b dark:border-gray-800">
                {[
                    { key: 'generate', label: 'Generate & Print' },
                    { key: 'scan', label: 'Scan & Track' },
                    { key: 'history', label: 'All Barcodes' },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-5 py-2.5 text-sm font-bold rounded-t-lg transition ${tab === t.key
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: Generate ── */}
            {tab === 'generate' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">New Barcode</h3>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1 block">Product *</label>
                                <select
                                    required
                                    value={selectedProduct}
                                    onChange={e => setSelectedProduct(e.target.value)}
                                    className="w-full border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Product</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.color ? `— ${p.color}` : ''} {p.fabricType ? `(${p.fabricType})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1 block">Roll No</label>
                                <input
                                    type="text"
                                    value={rollNo}
                                    onChange={e => setRollNo(e.target.value)}
                                    placeholder="e.g. R-042"
                                    className="w-full border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1 block">Quantity (Meters/Yards)</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    placeholder="e.g. 150"
                                    className="w-full border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                            >
                                {loading ? 'Generating...' : 'Generate Barcode'}
                            </button>
                        </form>
                    </div>

                    {/* Barcode Preview */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center">
                        {barcodeId ? (
                            <>
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Label Preview</h3>
                                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center w-full">
                                    <p className="text-sm font-bold text-blue-600 mb-2">Fabric POS</p>
                                    <svg ref={barcodeRef} className="mx-auto" />
                                    <p className="text-xs text-gray-500 mt-2">
                                        {products.find(p => p.id === selectedProduct)?.name}
                                    </p>
                                </div>
                                <button
                                    onClick={handlePrint}
                                    className="mt-4 w-full bg-gray-800 text-white py-2.5 rounded-xl font-bold hover:bg-gray-700 transition"
                                >
                                    Print Label
                                </button>
                            </>
                        ) : (
                            <div className="text-center text-gray-400 dark:text-gray-600">
                                <div className="text-6xl mb-3">🔲</div>
                                <p className="text-sm">Product select karo aur barcode generate karo</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB: Scan ── */}
            {tab === 'scan' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Scan Barcode</h3>

                        {!scannerStarted && (
                            <button
                                onClick={startScanner}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 mb-4 shadow-lg shadow-blue-500/20"
                            >
                                Camera se Scan Karo
                            </button>
                        )}
                        <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />

                        <div className="mt-4 border-t dark:border-gray-800 pt-4">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">Ya Manual Type Karo</p>
                            <form onSubmit={handleManualLookup} className="flex gap-2">
                                <input
                                    name="manualCode"
                                    placeholder="FAB-2026-XXXXX"
                                    className="flex-1 border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button type="submit" className="px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
                                    Search
                                </button>
                            </form>
                        </div>
                        {scanError && <p className="mt-3 text-red-500 text-sm">{scanError}</p>}
                    </div>

                    {/* Scan Result */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        {scanResult ? (
                            <>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Barcode</p>
                                        <p className="text-xl font-black text-blue-600">{scanResult.barcodeId}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStageStyle(scanResult.currentStage)}`}>
                                        {getStageLabel(scanResult.currentStage)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                    <div><p className="text-gray-400 text-xs">Product</p><p className="font-bold dark:text-gray-100">{scanResult.productName}</p></div>
                                    <div><p className="text-gray-400 text-xs">Roll No</p><p className="font-bold dark:text-gray-100">{scanResult.rollNo}</p></div>
                                    <div><p className="text-gray-400 text-xs">Quantity</p><p className="font-bold dark:text-gray-100">{scanResult.quantity} {scanResult.unit}</p></div>
                                    <div><p className="text-gray-400 text-xs">Color</p><p className="font-bold dark:text-gray-100">{scanResult.color || '-'}</p></div>
                                    {scanResult.fabricType && <div><p className="text-gray-400 text-xs">Fabric</p><p className="font-bold dark:text-gray-100">{scanResult.fabricType}</p></div>}
                                    {scanResult.width && <div><p className="text-gray-400 text-xs">Width</p><p className="font-bold dark:text-gray-100">{scanResult.width}"</p></div>}
                                </div>

                                {/* Update Stage */}
                                <div className="border-t dark:border-gray-800 pt-4 mb-4">
                                    <p className="text-xs uppercase font-bold text-gray-500 tracking-widest mb-2">Stage Update Karo</p>
                                    <div className="flex gap-2">
                                        <select
                                            value={newStage}
                                            onChange={e => setNewStage(e.target.value)}
                                            className="flex-1 border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Stage</option>
                                            {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                        <button
                                            onClick={handleStageUpdate}
                                            disabled={!newStage || stageLoading}
                                            className="px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 text-sm"
                                        >
                                            {stageLoading ? '...' : 'Update'}
                                        </button>
                                    </div>
                                </div>

                                {/* History */}
                                <div>
                                    <p className="text-xs uppercase font-bold text-gray-500 tracking-widest mb-2">Tracking History</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {[...(scanResult.history || [])].reverse().map((h, i) => (
                                            <div key={i} className="flex items-start gap-3 text-sm">
                                                <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                                                <div>
                                                    <p className="font-bold dark:text-gray-200">{h.label}</p>
                                                    <p className="text-gray-400 text-xs">{new Date(h.timestamp).toLocaleString('en-PK')} · {h.by}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 py-16">
                                <div className="text-6xl mb-3">📋</div>
                                <p className="text-sm">Scan karo ya barcode type karo — detail yahan aayegi</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB: History ── */}
            {tab === 'history' && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {historyLoading ? (
                        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" /></div>
                    ) : barcodes.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <div className="text-5xl mb-3">🔲</div>
                            <p>Koi barcode nahi mila. Pehle generate karo.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400 font-black tracking-widest">
                                <tr>
                                    <th className="px-4 py-3 text-left">Barcode</th>
                                    <th className="px-4 py-3 text-left">Product</th>
                                    <th className="px-4 py-3 text-left">Roll / Qty</th>
                                    <th className="px-4 py-3 text-left">Color</th>
                                    <th className="px-4 py-3 text-left">Stage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {barcodes.map(b => (
                                    <tr
                                        key={b.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition"
                                        onClick={() => { setScanResult(b); setTab('scan') }}
                                    >
                                        <td className="px-4 py-3 font-mono text-blue-600 font-bold">{b.barcodeId}</td>
                                        <td className="px-4 py-3 dark:text-gray-200">{b.productName}</td>
                                        <td className="px-4 py-3 dark:text-gray-300">{b.rollNo} · {b.quantity} {b.unit}</td>
                                        <td className="px-4 py-3 dark:text-gray-300">{b.color || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStageStyle(b.currentStage)}`}>
                                                {getStageLabel(b.currentStage)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </Layout>
    )
}
