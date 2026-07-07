import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { formatUnit } from '../../utils/units'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

const getInvoiceNo = (id) => {
    const year = new Date().getFullYear()
    return `INV-${year}-${id?.slice(-5).toUpperCase() || 'XXXXX'}`
}

const formatDate = (ts) => {
    if (!ts) return 'N/A'
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PublicInvoice() {
    const { businessId, branchId, saleId } = useParams()
    const [sale, setSale] = useState(null)
    const [settings, setSettings] = useState(null)
    const [status, setStatus] = useState('loading') // loading | found | notfound

    useEffect(() => {
        const fetch = async () => {
            try {
                const [saleSnap, bizSnap, branchSnap] = await Promise.all([
                    getDoc(doc(db, `businesses/${businessId}/branches/${branchId}/sales/${saleId}`)),
                    getDoc(doc(db, `businesses/${businessId}`)),
                    getDoc(doc(db, `businesses/${businessId}/branches/${branchId}`)),
                ])

                if (!saleSnap.exists()) { setStatus('notfound'); return }

                setSale({ id: saleSnap.id, ...saleSnap.data() })

                const biz = bizSnap.exists() ? bizSnap.data() : {}
                const branch = branchSnap.exists() ? branchSnap.data() : {}
                const branchSettings = branch.settings || {}

                setSettings({
                    businessName: biz.businessName || 'Relink Global',
                    address: biz.address || '',
                    phone: biz.phone || '',
                    currency: branchSettings.currency || biz.settings?.currency || 'PKR',
                    taxEnabled: branchSettings.taxEnabled ?? false,
                    taxRate: branchSettings.taxRate || 0,
                    taxLabel: branchSettings.taxLabel || 'GST',
                })
                setStatus('found')
            } catch {
                setStatus('notfound')
            }
        }
        if (businessId && branchId && saleId) fetch()
    }, [businessId, branchId, saleId])

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (status === 'notfound') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
                <XCircle className="w-12 h-12 text-red-400" />
                <p className="text-gray-600 font-semibold">Invoice not found</p>
                <p className="text-gray-400 text-sm">{getInvoiceNo(saleId)}</p>
            </div>
        )
    }

    const currency = settings?.currency || 'PKR'
    const items = sale?.items || []
    const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0)
    const discount = sale?.discount || 0
    const taxEnabled = settings?.taxEnabled
    const taxRate = settings?.taxRate || 0
    const taxAmount = taxEnabled ? (subtotal - discount) * (taxRate / 100) : 0
    const total = sale?.finalAmount || sale?.total || (subtotal - discount + taxAmount)

    return (
        <div className="min-h-screen bg-gray-100 flex items-start justify-center py-10 px-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden">

                {/* Verified Banner */}
                <div className="bg-green-500 text-white flex items-center gap-2 px-5 py-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-bold text-sm tracking-wide">VERIFIED INVOICE</span>
                    <span className="ml-auto text-xs opacity-80">Issued by {settings?.businessName}</span>
                </div>

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xl font-black text-gray-800">{settings?.businessName}</p>
                            {settings?.address && <p className="text-xs text-gray-400 mt-0.5">{settings.address}</p>}
                            {settings?.phone && <p className="text-xs text-gray-400">{settings.phone}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Invoice</p>
                            <p className="text-base font-black text-gray-800">{getInvoiceNo(sale.id)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(sale.createdAt || sale.date)}</p>
                        </div>
                    </div>
                </div>

                {/* Customer */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Bill To</p>
                    <p className="font-bold text-gray-700 mt-0.5">{sale.customerName || 'Walk-in Customer'}</p>
                    <span className="inline-block mt-1 text-xs font-bold bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 uppercase">
                        {sale.paymentMethod || 'cash'}
                    </span>
                </div>

                {/* Items */}
                <div className="px-6 py-4">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <th className="text-left pb-2">#</th>
                                <th className="text-left pb-2">Item</th>
                                <th className="text-center pb-2">Qty</th>
                                <th className="text-right pb-2">Rate</th>
                                <th className="text-right pb-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, i) => (
                                <tr key={i} className="border-b border-gray-50">
                                    <td className="py-2 text-gray-400">{i + 1}</td>
                                    <td className="py-2 font-semibold text-gray-700">{item.name}</td>
                                    <td className="py-2 text-center text-gray-500">
                                        {item.quantity} {formatUnit(item.unit)}
                                    </td>
                                    <td className="py-2 text-right text-gray-500">{currency} {Number(item.price).toFixed(2)}</td>
                                    <td className="py-2 text-right font-bold text-gray-700">
                                        {currency} {(item.price * item.quantity).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="px-6 pb-6">
                    <div className="ml-auto max-w-xs space-y-1">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>{currency} {subtotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Discount</span>
                                <span>- {currency} {discount.toFixed(2)}</span>
                            </div>
                        )}
                        {taxEnabled && taxAmount > 0 && (
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>{settings.taxLabel} ({taxRate}%)</span>
                                <span>{currency} {taxAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-black text-gray-800 text-base border-t border-gray-200 pt-2 mt-2">
                            <span>TOTAL</span>
                            <span>{currency} {Number(total).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">This is a digitally verified invoice. Generated by {settings?.businessName}.</p>
                </div>
            </div>
        </div>
    )
}
