import { create } from 'zustand'

/**
 * Preload Store
 * Tracks the post-login full-app preload (page chunks + Firestore data).
 * `readyKey` is `${businessId}::${branchId}` — changing business or branch
 * re-triggers the preloader for the new context.
 */
const usePreloadStore = create(() => ({
    readyKey: null,
    status: 'idle', // idle | loading | ready
    done: 0,
    total: 0,
    label: ''
}))

export const resetPreloadState = () => {
    usePreloadStore.setState({ readyKey: null, status: 'idle', done: 0, total: 0, label: '' })
}

export default usePreloadStore
