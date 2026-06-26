import { useState, useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import { Html5QrcodeScanner } from 'html5-qrcode'
import Layout from '../../components/layout/Layout'
import {
    addBarcode, getBarcodes, getBarcodeByCode, updateBarcode, deleteBarcode,
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
    const [sortCol, setSortCol] = useState('createdAt')
    const [sortDir, setSortDir] = useState('desc')
    const [bcPage, setBcPage] = useState(1)
    const [bcPerPage, setBcPerPage] = useState(25)
    const [labelSize, setLabelSize] = useState('76x50')
    const [labelRotate, setLabelRotate] = useState('0')

    const barcodeRef = useRef(null)
    const scannerRef = useRef(null)
    const usbInputRef = useRef(null)

    const LABEL_SIZES = [
        { value: '76x50',  label: '3" × 2"  (76×50mm) — Default', w: '3in',   h: '2in',   bh: 45, bw: 1.2 },
        { value: '50x25',  label: '2" × 1"  (50×25mm)',            w: '2in',   h: '1in',   bh: 28, bw: 0.7 },
        { value: '38x25',  label: '1.5" × 1" (38×25mm)',           w: '1.5in', h: '1in',   bh: 25, bw: 0.6 },
        { value: '100x50', label: '4" × 2"  (100×50mm)',           w: '4in',   h: '2in',   bh: 55, bw: 1   },
    ]

    useEffect(() => {
        if (businessId) fetchProducts()
    }, [businessId])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const productId = params.get('product')
        if (productId) {
            setSelectedProduct(productId)
            setTab('generate')
        }
    }, [])

    useEffect(() => {
        if (tab === 'history' && businessId) fetchBarcodes()
        if (tab !== 'scan' && scannerRef.current) {
            scannerRef.current.clear().catch(() => {})
            scannerRef.current = null
            setScannerStarted(false)
        }
        if (tab === 'scan') {
            setTimeout(() => usbInputRef.current?.focus(), 100)
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

    const printLabel = (code, productName) => {
        if (!code) return
        const size = LABEL_SIZES.find(s => s.value === labelSize) || LABEL_SIZES[0]
        const rot = parseInt(labelRotate) || 0

        // For 90/270 deg, swap page dimensions so paper orientation matches
        const isSwapped = rot === 90 || rot === 270
        const pageW = isSwapped ? size.h : size.w
        const pageH = isSwapped ? size.w : size.h

        // CSS transform: rotate around center, then translate to keep content on page
        const rotateStyle = rot === 0 ? '' : `
            transform: rotate(${rot}deg);
            transform-origin: center center;
            ${isSwapped ? `width: ${size.w}; height: ${size.h}; margin-left: -${size.w === size.h ? '0' : 'auto'};` : ''}
        `

        const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        document.body.appendChild(tempSvg)
        try {
            JsBarcode(tempSvg, code, {
                format: 'CODE128',
                width: size.bw,
                height: size.bh,
                displayValue: true,
                fontSize: 9,
                margin: 2,
            })
        } catch (_) {}
        const svgHtml = tempSvg.outerHTML
        document.body.removeChild(tempSvg)

        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Barcode - ${code}</title>
                <style>
                    @page { size: ${pageW} ${pageH}; margin: 0; }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        width: ${pageW};
                        height: ${pageH};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: Arial, sans-serif;
                        overflow: hidden;
                    }
                    .label {
                        width: ${size.w};
                        height: ${size.h};
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 2mm;
                        text-align: center;
                        gap: 1mm;
                        ${rotateStyle}
                    }
                    .biz { font-size: 9pt; font-weight: bold; letter-spacing: 1px; }
                    .label svg { display: block; }
                    .product-name {
                        font-size: 8pt;
                        font-weight: bold;
                        max-width: 100%;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                    }
                    .barcode-id { font-size: 7pt; color: #555; }
                </style>
            </head>
            <body>
                <div class="label">
                    <div class="biz">RELINK GLOBAL</div>
                    ${svgHtml}
                    <div class="product-name">${productName || ''}</div>
                    <div class="barcode-id">${code}</div>
                </div>
                <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
            </html>
        `)
        printWindow.document.close()
    }

    const handlePrint = () => {
        const productName = products.find(p => p.id === selectedProduct)?.name || ''
        printLabel(barcodeId, productName)
    }

    const handleTestPrint = () => {
        const size = LABEL_SIZES.find(s => s.value === labelSize) || LABEL_SIZES[0]
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Test Label</title>
                <style>
                    @page { size: ${size.w} ${size.h}; margin: 0; }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        width: ${size.w};
                        height: ${size.h};
                        font-family: Arial, sans-serif;
                        overflow: hidden;
                    }
                    .label {
                        width: 100%;
                        height: 100%;
                        border: 1px solid #000;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 1mm;
                        text-align: center;
                        gap: 1mm;
                    }
                    .title { font-size: 8pt; font-weight: bold; }
                    .size  { font-size: 7pt; color: #333; }
                    .line  { width: 90%; border-top: 1px dashed #999; }
                    .corner-tl { position:absolute; top:0; left:0; font-size:5pt; }
                    .corner-tr { position:absolute; top:0; right:0; font-size:5pt; }
                    .corner-bl { position:absolute; bottom:0; left:0; font-size:5pt; }
                    .corner-br { position:absolute; bottom:0; right:0; font-size:5pt; }
                </style>
            </head>
            <body>
                <div class="label" style="position:relative;">
                    <span class="corner-tl">▪</span>
                    <span class="corner-tr">▪</span>
                    <span class="corner-bl">▪</span>
                    <span class="corner-br">▪</span>
                    <p class="title">ALIGNMENT TEST</p>
                    <div class="line"></div>
                    <p class="size">${size.w} × ${size.h}</p>
                    <p class="size">${size.label}</p>
                    <div class="line"></div>
                    <p class="size">Fabric POS</p>
                </div>
                <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
            </html>
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

    const handleDeleteBarcode = async (id) => {
        if (!window.confirm('Yeh barcode delete karo?')) return
        try {
            await deleteBarcode(businessId, id)
            setBarcodes(prev => prev.filter(b => b.id !== id))
            if (scanResult?.id === id) setScanResult(null)
            showSuccess('Barcode deleted')
        } catch (err) {
            handleError(err, 'Delete Barcode')
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

            {/* ── Print Settings Bar (visible on all tabs) ── */}
            <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">🖨️ Print Settings:</span>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 font-bold">Size</label>
                    <select
                        value={labelSize}
                        onChange={e => setLabelSize(e.target.value)}
                        className="border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {LABEL_SIZES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 font-bold">Rotate</label>
                    <select
                        value={labelRotate}
                        onChange={e => setLabelRotate(e.target.value)}
                        className="border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="0">0° Normal</option>
                        <option value="90">90° ↻</option>
                        <option value="180">180° ↕</option>
                        <option value="270">270° ↺</option>
                    </select>
                </div>
                <button
                    onClick={handleTestPrint}
                    className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-yellow-600 transition text-xs"
                >
                    🧪 Test
                </button>
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
                                    <p className="text-sm font-bold text-blue-600 mb-2">Relink Global</p>
                                    <svg ref={barcodeRef} className="mx-auto" />
                                    <p className="text-xs text-gray-500 mt-2">
                                        {products.find(p => p.id === selectedProduct)?.name}
                                    </p>
                                </div>
                                <button
                                    onClick={handlePrint}
                                    disabled={!barcodeId}
                                    className="mt-4 w-full bg-gray-800 text-white py-2.5 rounded-xl font-bold hover:bg-gray-700 transition disabled:opacity-40"
                                >
                                    🖨️ Print Label
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
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Scan Barcode</h3>
                        <p className="text-xs text-gray-400 mb-4">USB scanner ya manually type karo</p>

                        {/* USB Scanner Input — auto focused */}
                        <div className="relative mb-4">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl pointer-events-none">📷</div>
                            <input
                                ref={usbInputRef}
                                type="text"
                                placeholder="Scanner se scan karo ya barcode type karo..."
                                className="w-full pl-12 pr-4 py-3 border-2 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-gray-800 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        const val = e.target.value.trim()
                                        if (val) {
                                            lookupBarcode(val)
                                            e.target.value = ''
                                        }
                                    }
                                }}
                                onClick={e => e.target.select()}
                            />
                        </div>

                        {scanError && (
                            <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
                                ❌ {scanError}
                            </div>
                        )}

                        {/* Camera Scanner (optional) */}
                        <div className="border-t dark:border-gray-800 pt-4">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-2">Ya Camera Use Karo</p>
                            {!scannerStarted && (
                                <button
                                    onClick={startScanner}
                                    className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm border dark:border-gray-700"
                                >
                                    📸 Camera se Scan Karo
                                </button>
                            )}
                            <div id="qr-reader" className="w-full rounded-xl overflow-hidden mt-2" />
                        </div>
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

                                {/* Reprint */}
                                <div className="mb-4">
                                    <button
                                        onClick={() => printLabel(scanResult.barcodeId, scanResult.productName)}
                                        className="w-full bg-gray-800 text-white py-2 rounded-xl font-bold hover:bg-gray-700 transition text-sm"
                                    >
                                        🖨️ Reprint Label
                                    </button>
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
                        <>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400 font-black tracking-widest">
                                <tr>
                                    <th className="px-4 py-3 text-left w-10">#</th>
                                    {[
                                        { key: 'barcodeId', label: 'Barcode' },
                                        { key: 'productName', label: 'Product' },
                                        { key: 'rollNo', label: 'Roll / Qty' },
                                        { key: 'color', label: 'Color' },
                                        { key: 'currentStage', label: 'Stage' },
                                    ].map(col => (
                                        <th
                                            key={col.key}
                                            className="px-4 py-3 text-left cursor-pointer select-none hover:text-blue-600 transition"
                                            onClick={() => {
                                                if (sortCol === col.key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
                                                else { setSortCol(col.key); setSortDir('asc') }
                                                setBcPage(1)
                                            }}
                                        >
                                            {col.label}
                                            {sortCol === col.key && (
                                                <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-left">Print</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {(() => {
                                    const sorted = [...barcodes].sort((a, b) => {
                                        const aVal = (a[sortCol] || '').toString().toLowerCase()
                                        const bVal = (b[sortCol] || '').toString().toLowerCase()
                                        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
                                    })
                                    const totalPages = Math.ceil(sorted.length / bcPerPage)
                                    const paginated = sorted.slice((bcPage - 1) * bcPerPage, bcPage * bcPerPage)
                                    return paginated
                                })().map((b, idx) => (
                                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                        <td className="px-4 py-3 text-gray-400 font-bold text-xs">{(bcPage - 1) * bcPerPage + idx + 1}</td>
                                        <td className="px-4 py-3 font-mono text-blue-600 font-bold cursor-pointer" onClick={() => { setScanResult(b); setTab('scan') }}>{b.barcodeId}</td>
                                        <td className="px-4 py-3 dark:text-gray-200 cursor-pointer" onClick={() => { setScanResult(b); setTab('scan') }}>{b.productName}</td>
                                        <td className="px-4 py-3 dark:text-gray-300 cursor-pointer" onClick={() => { setScanResult(b); setTab('scan') }}>{b.rollNo} · {b.quantity} {b.unit}</td>
                                        <td className="px-4 py-3 dark:text-gray-300 cursor-pointer" onClick={() => { setScanResult(b); setTab('scan') }}>{b.color || '-'}</td>
                                        <td className="px-4 py-3 cursor-pointer" onClick={() => { setScanResult(b); setTab('scan') }}>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStageStyle(b.currentStage)}`}>
                                                {getStageLabel(b.currentStage)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => printLabel(b.barcodeId, b.productName)}
                                                    className="px-3 py-1 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition"
                                                >
                                                    🖨️ Print
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBarcode(b.id)}
                                                    className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 transition"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Pagination Footer */}
                        {(() => {
                            const totalPages = Math.ceil(barcodes.length / bcPerPage)
                            if (totalPages <= 1 && barcodes.length <= 25) return null
                            return (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>Rows:</span>
                                        {[10, 25, 50].map(n => (
                                            <button key={n} onClick={() => { setBcPerPage(n); setBcPage(1) }}
                                                className={`px-2 py-1 rounded font-bold transition ${bcPerPage === n ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                                {n}
                                            </button>
                                        ))}
                                        <span className="ml-2">Showing {Math.min((bcPage - 1) * bcPerPage + 1, barcodes.length)}–{Math.min(bcPage * bcPerPage, barcodes.length)} of {barcodes.length}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setBcPage(1)} disabled={bcPage === 1}
                                            className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition">«</button>
                                        <button onClick={() => setBcPage(p => p - 1)} disabled={bcPage === 1}
                                            className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition">‹</button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === totalPages || Math.abs(p - bcPage) <= 1)
                                            .reduce((acc, p, i, arr) => {
                                                if (i > 0 && arr[i - 1] !== p - 1) acc.push('...')
                                                acc.push(p)
                                                return acc
                                            }, [])
                                            .map((p, i) => p === '...'
                                                ? <span key={`e${i}`} className="px-2 text-gray-400 text-xs">…</span>
                                                : <button key={p} onClick={() => setBcPage(p)}
                                                    className={`px-2 py-1 rounded text-xs font-bold transition ${bcPage === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                                    {p}
                                                </button>
                                            )}
                                        <button onClick={() => setBcPage(p => p + 1)} disabled={bcPage === totalPages}
                                            className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition">›</button>
                                        <button onClick={() => setBcPage(totalPages)} disabled={bcPage === totalPages}
                                            className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition">»</button>
                                    </div>
                                </div>
                            )
                        })()}
                        </>
                    )}
                </div>
            )}
        </Layout>
    )
}
