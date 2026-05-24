import { db } from './config'
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore'

// Products
export const addProduct = (data) => {
    return addDoc(collection(db, 'products'), {
        ...data,
        createdAt: serverTimestamp()
    })
}

export const getProducts = (businessId) => {
    const q = query(
        collection(db, 'products'),
        where('businessId', '==', businessId)
    )
    return getDocs(q)
}

export const updateProduct = (id, data) => {
    return updateDoc(doc(db, 'products', id), data)
}

export const deleteProduct = (id) => {
    return deleteDoc(doc(db, 'products', id))
}