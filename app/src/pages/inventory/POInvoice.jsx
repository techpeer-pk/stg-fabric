import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../../firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { handleError } from '../../utils/errorHandler'

function POInvoice() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [po, setPo] = useState(null)
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPO = async () => {
            try {
                const poSnap = await getDoc(doc(db, 'purchase_orders', id))
                if (poSnap.exists()) {
                    setPo({ id: poSnap.id, ...poSnap.data() })
                }

                const settingsSnap = await getDoc(doc(db, 'settings', 'global'))
                if (settingsSnap.exists()) {
                    setSettings(settingsSnap.data())
                }
            } catch (err) {
                handleError(err, 'Fetch PO Invoice', 'Failed to load purchase order')
            } finally {
                setLoading(false)
            }
        }
        fetchPO()
    }, [id])

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    )

    if (!po) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
            <p className="text-gray-500 mb-4 font-medium italic">Purchase Order not found.</p>
            <button onClick={() => navigate(-1)} className="text-blue-600 font-bold hover:underline">← Go Back</button>
        </div>
    )

    const currency = settings?.currency || 'PKR'

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4 print:bg-white print:py-0 print:px-0">
            {/* Action Buttons (Hidden on Print) */}
            <div className="max-w-2xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <button onClick={() => navigate(-1)} className="text-gray-600 font-medium hover:text-gray-800 transition text-sm">
                    ← Back to Management
                </button>
                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2"
                >
                    <span>🖨️</span> Print Order
                </button>
            </div>

            {/* The PO Paper */}
            <div className="max-w-2xl mx-auto bg-white shadow-2xl rounded-2xl p-10 print:shadow-none print:rounded-none print:p-4">
                {/* Header */}
                <div className="flex justify-between items-start border-b-4 border-gray-900 pb-8 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-1">Purchase Order</h1>
                        <p className="text-blue-600 font-black tracking-widest text-xs uppercase">Official Document</p>
                        <div className="mt-6 space-y-1">
                            <p className="text-sm font-black text-gray-800">{settings?.businessName || 'GPOS Business'}</p>
                            <p className="text-xs text-gray-500 font-medium">{settings?.address || 'Business Address'}</p>
                            <p className="text-xs text-gray-500 font-medium">{settings?.phone || 'Contact Number'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order Number</p>
                            <p className="text-xl font-black text-gray-900 leading-none">#{po.id.slice(-6).toUpperCase()}</p>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Date Issued</p>
                        <p className="text-sm font-bold text-gray-800">{po.createdAt?.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* Supplier & Status */}
                <div className="grid grid-cols-2 gap-12 mb-10">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Vendor / Supplier</p>
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <p className="font-black text-gray-900 text-lg leading-tight uppercase mb-1">{po.supplierName}</p>
                            <p className="text-xs text-blue-600 font-bold">Supplier ID: {po.supplierId.slice(0, 8)}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Order Status</p>
                        <div className={`inline-block px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 ${po.status === 'received' ? 'bg-green-50 border-green-500 text-green-700' :
                                po.status === 'pending' ? 'bg-orange-50 border-orange-500 text-orange-700' :
                                    'bg-gray-50 border-gray-500 text-gray-700'
                            }`}>
                            {po.status}
                        </div>
                        {po.receivedAt && (
                            <p className="text-[10px] text-gray-400 font-bold mt-2">
                                Received on: {po.receivedAt.toDate().toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-10">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest">
                                <th className="py-3 px-4 rounded-l-lg">Item Details</th>
                                <th className="py-3 px-4 text-center w-24">Quantity</th>
                                <th className="py-3 px-4 text-right w-32">Unit Cost</th>
                                <th className="py-3 px-4 text-right rounded-r-lg w-32">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {po.items?.map((item, idx) => (
                                <tr key={idx} className="text-sm">
                                    <td className="py-4 px-4">
                                        <p className="font-black text-gray-800">{item.name}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">UID: {item.productId.slice(0, 8)}</p>
                                    </td>
                                    <td className="py-4 px-4 text-center font-bold text-gray-600">{item.quantity}</td>
                                    <td className="py-4 px-4 text-right font-medium text-gray-600">{currency} {item.costPrice.toFixed(2)}</td>
                                    <td className="py-4 px-4 text-right font-black text-gray-900">{currency} {(item.costPrice * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-1/2 space-y-3">
                        <div className="flex justify-between items-center py-4 px-6 bg-gray-900 rounded-2xl text-white shadow-xl">
                            <span className="font-black uppercase tracking-widest text-xs opacity-60">Grand Total</span>
                            <span className="text-2xl font-black">{currency} {po.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Terms and Signatures */}
                <div className="grid grid-cols-2 gap-20 mt-20 pt-10 border-t border-dashed border-gray-200">
                    <div>
                        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4 italic">Terms & Conditions</h4>
                        <ol className="text-[9px] text-gray-500 font-bold space-y-2 uppercase leading-relaxed">
                            <li>1. All items must be inspected upon delivery.</li>
                            <li>2. Payment terms as per agreed supplier contract.</li>
                            <li>3. Quote PO number on all shipping documents.</li>
                        </ol>
                    </div>
                    <div className="flex flex-col justify-end">
                        <div className="border-b-2 border-gray-900 mb-2"></div>
                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest text-center">Authorized Signature</p>
                    </div>
                </div>

                {/* System Footer */}
                <div className="mt-12 pt-8 border-t border-gray-50 text-center">
                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.3em]">
                        Document Generated by GPOS Cloud Management System
                    </p>
                </div>
            </div>
        </div>
    )
}

export default POInvoice
