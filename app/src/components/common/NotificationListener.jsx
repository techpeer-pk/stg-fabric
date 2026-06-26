import { useEffect, useRef } from 'react'
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import useAuthStore from '../../store/authStore-multi-branch'
import toast from 'react-hot-toast'

export default function NotificationListener() {
    const { businessId, branchId, userRole } = useAuthStore()
    const notifiedItems = useRef(new Set())
    const productNames = useRef({})

    useEffect(() => {
        if (!businessId || !branchId || (userRole !== 'owner' && userRole !== 'manager')) return

        // Build productId → name lookup first, then start inventory listener
        getDocs(collection(db, `businesses/${businessId}/products`)).then((snap) => {
            snap.forEach(doc => {
                productNames.current[doc.id] = doc.data().name
            })

            const q = query(
                collection(db, `businesses/${businessId}/branches/${branchId}/inventory`),
                where('quantity', '<', 15)
            )

            const unsubscribe = onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'modified' || change.type === 'added') {
                        const item = change.doc.data()
                        const itemId = change.doc.id
                        const name = productNames.current[item.productId] || item.productName || 'Unknown Product'

                        if (item.quantity < (item.reorderLevel || item.minThreshold || 15) && !notifiedItems.current.has(itemId)) {
                            notifiedItems.current.add(itemId)

                            toast.error(
                                (t) => (
                                    <div className="flex flex-col gap-1">
                                        <p className="font-bold text-sm">⚠️ Low Stock Alert</p>
                                        <p className="text-xs">
                                            <span className="font-black">{name}</span> is low in stock!
                                            Remaining: <span className="text-red-600 font-bold">{item.quantity}</span>
                                        </p>
                                        <button
                                            onClick={() => toast.dismiss(t.id)}
                                            className="mt-2 text-[10px] font-black uppercase text-blue-600 hover:underline"
                                        >
                                            Acknowledge
                                        </button>
                                    </div>
                                ),
                                { duration: 6000, id: itemId }
                            )
                        } else if (item.quantity >= (item.reorderLevel || item.minThreshold || 15)) {
                            notifiedItems.current.delete(itemId)
                        }
                    }
                })
            })

            return () => unsubscribe()
        })
    }, [businessId, branchId, userRole])

    return null
}
