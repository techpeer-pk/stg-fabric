import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { handleError } from '../../utils/errorHandler'
import { QRCodeCanvas } from 'qrcode.react'
import useAuthStore from '../../store/authStore-multi-branch'
import FirestoreService from '../../firebase/firestore-multi-branch'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { ArrowLeft, Printer, FileDown, Share2, Phone, Mail, Factory } from 'lucide-react'

// Generate invoice number from sale ID
const getInvoiceNo = (id) => {
    const year = new Date().getFullYear()
    return `INV-${year}-${id?.slice(-5).toUpperCase() || 'XXXXX'}`
}

function Invoice() {
    const { businessId: paramBizId, branchId: paramBranchId, id } = useParams()
    const { user, businessId: storeBizId, branchId: storeBranchId } = useAuthStore()
    const businessId = paramBizId || storeBizId
    const branchId = paramBranchId || storeBranchId
    const navigate = useNavigate()
    const invoiceRef = useRef()
    const [sale, setSale] = useState(null)
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)

    // ── Fetch Invoice Data ──────────────────────────────────────────────────
    useEffect(() => {
        const fetchInvoice = async () => {
            if (!businessId || !branchId) return
            try {
                const saleSnap = await FirestoreService.getSale(businessId, branchId, id)
                if (saleSnap.exists()) setSale({ id: saleSnap.id, ...saleSnap.data() })

                const [bizSnap, branchSnap] = await Promise.all([
                    FirestoreService.getBusiness(businessId),
                    FirestoreService.getBranch(businessId, branchId)
                ])

                const bizData = bizSnap.exists() ? bizSnap.data() : {}
                const branchData = branchSnap.exists() ? branchSnap.data() : {}
                const branchSettings = branchData.settings || {}

                setSettings({
                    businessName: bizData.businessName || 'Fabric Factory',
                    address: bizData.address || '',
                    phone: bizData.phone || '',
                    email: bizData.email || '',
                    ntn: bizData.ntn || '',
                    paymentTerms: bizData.paymentTerms || '',
                    currency: branchSettings.currency || bizData.settings?.currency || 'PKR',
                    taxEnabled: branchSettings.taxEnabled ?? false,
                    taxLabel: branchSettings.taxLabel || 'GST',
                    taxRate: branchSettings.taxRate || 0,
                    receiptFooter: branchSettings.receipt_footer || 'Thank you for your business!',
                })
            } catch (err) {
                handleError(err, 'Fetch Invoice', 'Failed to load invoice')
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchInvoice()
    }, [id, businessId, branchId])

    // ── PDF Download ────────────────────────────────────────────────────────
    const downloadPDF = async () => {
        const element = invoiceRef.current
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const imgProps = pdf.getImageProperties(imgData)
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save(`${getInvoiceNo(sale?.id)}.pdf`)
    }

    // ── WhatsApp Share ──────────────────────────────────────────────────────
    const shareWhatsApp = async () => {
        const element = invoiceRef.current
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
        canvas.toBlob(async (blob) => {
            const file = new File([blob], `${getInvoiceNo(sale?.id)}.png`, { type: 'image/png' })
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: getInvoiceNo(sale?.id) })
            } else {
                const invoiceUrl = `${window.location.origin}/invoice/${businessId}/${branchId}/${sale.id}`
                window.open(`https://wa.me/?text=${encodeURIComponent(`Invoice: ${getInvoiceNo(sale?.id)}\nAmount: ${settings?.currency} ${(sale?.finalAmount || sale?.total || 0).toFixed(2)}\nView: ${invoiceUrl}`)}`, '_blank')
            }
        })
    }

    // ── Format Date ─────────────────────────────────────────────────────────
    const formatDate = (ts) => {
        if (!ts) return 'N/A'
        const d = ts?.toDate ? ts.toDate() : new Date(ts)
        return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    // ── Loading ─────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    )

    if (!sale) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
            <p className="text-gray-500 mb-4">Invoice not found.</p>
            <button onClick={() => navigate(-1)} className="text-blue-600 font-bold hover:underline">← Back</button>
        </div>
    )

    const currency = sale.currency || settings?.currency || 'PKR'
    const subtotal = sale.subtotal || sale.items?.reduce((s, i) => s + (i.total || 0), 0) || 0
    const tax = sale.tax || 0
    const discount = sale.discount || 0
    const total = sale.finalAmount || sale.total || subtotal

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:py-0 print:px-0">

            {/* ── Action Bar (staff only) ── */}
            {user && (
                <div className="max-w-3xl mx-auto mb-6 print:hidden">
                    <div className="flex justify-between items-center mb-3">
                        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 font-medium text-sm transition flex items-center gap-1">
                            <ArrowLeft size={15} /> Back
                        </button>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                            {getInvoiceNo(sale.id)}
                        </span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-2 justify-center">
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition">
                            <Printer size={15} /> Print
                        </button>
                        <button onClick={downloadPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-sm transition">
                            <FileDown size={15} /> PDF
                        </button>
                        <button onClick={shareWhatsApp} className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl font-bold text-sm transition">
                            <Share2 size={15} /> WhatsApp
                        </button>
                    </div>
                </div>
            )}

            {/* ── Invoice Document ── */}
            <div ref={invoiceRef} className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none">

                {/* ── Header Band ── */}
                <div className="bg-gray-900 px-8 py-5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <img
                            src="/stg_logo.jpeg"
                            alt="Logo"
                            className="h-12 w-12 rounded-xl object-cover"
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                        <div>
                            <h1 className="text-white text-xl font-black tracking-tight">
                                {settings?.businessName || 'Fabric Factory'}
                            </h1>
                            <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1"><Factory size={11} /> Fabric Factory — Karachi, Pakistan</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-blue-400 text-xs font-black uppercase tracking-widest">INVOICE</p>
                        <p className="text-white text-lg font-black mt-1">{getInvoiceNo(sale.id)}</p>
                        <p className="text-gray-400 text-xs mt-1">{formatDate(sale.createdAt)}</p>
                    </div>
                </div>

                <div className="px-8 py-6">

                    {/* ── Company Info + Bill To ── */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        {/* From */}
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">From</p>
                            <p className="font-black text-gray-800">{settings?.businessName || 'Fabric Factory'}</p>
                            {settings?.address && <p className="text-gray-500 text-sm mt-1">{settings.address}</p>}
                            {settings?.phone && <p className="text-gray-500 text-sm flex items-center gap-1"><Phone size={11} /> {settings.phone}</p>}
                            {settings?.email && <p className="text-gray-500 text-sm flex items-center gap-1"><Mail size={11} /> {settings.email}</p>}
                            {settings?.ntn && (
                                <p className="text-gray-400 text-xs mt-2 font-bold">NTN: {settings.ntn}</p>
                            )}
                        </div>
                        {/* To */}
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Bill To</p>
                            <p className="font-black text-gray-800 text-lg">{sale.customerName || 'Customer'}</p>
                            {sale.customerPhone && <p className="text-gray-500 text-sm mt-1 flex items-center gap-1"><Phone size={11} /> {sale.customerPhone}</p>}
                            <div className="mt-3 flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' :
                                    sale.paymentMethod === 'bank' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {sale.paymentMethod?.toUpperCase() || 'N/A'}
                                </span>
                                {settings?.paymentTerms && (
                                    <span className="text-gray-400 text-xs">{settings.paymentTerms}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Items Table ── */}
                    <div className="mb-8">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 rounded-xl">
                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest rounded-l-xl">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Item / Fabric</th>
                                    <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-widest">Qty / Meters</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase tracking-widest">Rate</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase tracking-widest rounded-r-xl">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sale.items?.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 text-gray-400 text-xs font-bold">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-gray-800">{item.name}</p>
                                            {(item.color || item.fabricType) && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {[item.fabricType, item.color, item.width ? `${item.width}"` : null].filter(Boolean).join(' · ')}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="font-bold text-gray-700">{item.quantity}</span>
                                            <span className="text-gray-400 text-xs ml-1">{item.unit || 'mtrs'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-600 font-medium">
                                            {currency} {(item.price || 0).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-gray-800">
                                            {currency} {(item.total || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Totals + QR ── */}
                    <div className="flex justify-between items-end gap-8">
                        {/* QR Code */}
                        <div className="text-center">
                            <QRCodeCanvas
                                value={`${window.location.origin}/invoice/${businessId}/${branchId}/${sale.id}`}
                                size={80}
                                level="M"
                                className="mx-auto"
                            />
                            <p className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-wider">Scan to verify</p>
                        </div>

                        {/* Totals */}
                        <div className="flex-1 max-w-xs ml-auto space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 font-bold">Subtotal</span>
                                <span className="font-bold text-gray-700">{currency} {subtotal.toFixed(2)}</span>
                            </div>
                            {tax > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-bold">{settings?.taxLabel || 'GST'}</span>
                                    <span className="font-bold text-gray-700">{currency} {tax.toFixed(2)}</span>
                                </div>
                            )}
                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-blue-600">
                                    <span className="font-bold">Discount</span>
                                    <span className="font-bold">- {currency} {discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center bg-gray-900 text-white px-4 py-3 rounded-xl">
                                <span className="font-black uppercase tracking-wide text-sm">Total</span>
                                <span className="font-black text-xl">{currency} {total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {sale.paymentMethod === 'cash' && (sale.change || 0) > 0 && (
                                <div className="flex justify-between text-xs text-green-600 font-bold px-1">
                                    <span>Change Returned</span>
                                    <span>{currency} {(sale.change || 0).toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
                        <div className="flex justify-between items-end">
                            <div>
                                {settings?.receiptFooter && (
                                    <p className="text-gray-400 text-xs italic">"{settings.receiptFooter}"</p>
                                )}
                                <p className="text-gray-300 text-[9px] mt-2 uppercase tracking-widest font-bold">
                                    Generated by Fabric POS · {getInvoiceNo(sale.id)}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="border-t border-gray-300 w-36 pt-2">
                                    <p className="text-xs text-gray-400 font-bold">Authorized Signature</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Invoice
