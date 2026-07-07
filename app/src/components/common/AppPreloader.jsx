import { useEffect, useState, useCallback, Suspense } from 'react'
import useAuthStore from '../../store/authStore-multi-branch'
import usePreloadStore from '../../store/preloadStore'
import { startPreload, preloadKeyFor } from '../../utils/appPreloader'
import { whenReadsIdle } from '../../firebase/queryCache'

const HOLD_MS = 250   // opaque hold after reads settle, so the page finishes painting
const FADE_MS = 300
const POST_READY_CAP_MS = 10000 // never wait on stragglers forever

// Rendered after {children} inside the same Suspense boundary, so its effect
// fires only once the lazy page has actually mounted — and, because effects
// run in tree order, only AFTER the page's own mount effect has started its
// data fetches (which whenReadsIdle then waits on).
function MountSentinel({ onMount }) {
    useEffect(() => {
        onMount()
    }, [onMount])
    return null
}

/**
 * Full-screen gray pre-loader shown after login. The routed page mounts
 * BEHIND this opaque overlay while every app segment (page chunks + data)
 * preloads. The overlay lifts only when the preload is complete, the page has
 * mounted, and none of its data reads are still in flight — so the user never
 * sees skeletons or partial layout, only the finished page.
 *
 * It also covers the window right after login where the auth user exists but
 * the business/branch context is still resolving (previously the page
 * rendered ungated — and visibly — during that gap).
 */
function AppPreloader({ children }) {
    const { businessId, branchId, userRole } = useAuthStore()
    const { readyKey, done, total, label } = usePreloadStore()

    const key = preloadKeyFor(businessId, branchId)
    const gate = Boolean(businessId && branchId)
    const ready = gate && readyKey === key

    // Already preloaded (normal in-app navigation) — skip the overlay entirely
    const [revealedKey, setRevealedKey] = useState(() => (ready ? key : null))
    const [mountedKey, setMountedKey] = useState(null)
    const [fadingKey, setFadingKey] = useState(null)
    const revealed = revealedKey === key
    const fading = fadingKey === key

    const handleMounted = useCallback(() => setMountedKey(key), [key])

    useEffect(() => {
        if (gate && !ready) startPreload({ businessId, branchId, userRole })
    }, [gate, ready, key, businessId, branchId, userRole])

    useEffect(() => {
        if (!gate || !ready || revealed || mountedKey !== key) return
        let cancelled = false
        let holdTimer, revealTimer
        const cap = new Promise((resolve) => setTimeout(resolve, POST_READY_CAP_MS))
        Promise.race([whenReadsIdle(), cap]).then(() => {
            if (cancelled) return
            holdTimer = setTimeout(() => setFadingKey(key), HOLD_MS)
            revealTimer = setTimeout(() => setRevealedKey(key), HOLD_MS + FADE_MS)
        })
        return () => {
            cancelled = true
            clearTimeout(holdTimer)
            clearTimeout(revealTimer)
        }
    }, [gate, ready, revealed, mountedKey, key])

    const percent = total ? Math.round((done / total) * 100) : 0

    // Children always mount behind the overlay (fetching against the warming
    // cache); the tree shape never changes on reveal, so the page is not
    // remounted when the overlay lifts.
    return (
        <>
            {/* Local Suspense keeps lazy-chunk resolution from bubbling up to the
               app-level fallback while the overlay is covering the screen. */}
            <Suspense fallback={null}>
                {children}
                {!revealed && <MountSentinel onMount={handleMounted} />}
            </Suspense>
            {!revealed && (
                <div
                    className={`fixed inset-0 z-[9999] bg-gray-200 dark:bg-gray-950 flex flex-col items-center justify-center gap-4 transition-opacity ease-out ${fading ? 'opacity-0' : 'opacity-100'}`}
                    style={{ transitionDuration: `${FADE_MS}ms` }}
                >
                    <img src="/stg_logo.jpeg" alt="STG" className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-gray-600 dark:text-gray-300 text-sm font-semibold">Preparing your workspace...</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs font-semibold tracking-widest uppercase h-4">
                            {label ? `Loaded ${label}` : 'Loading segments'}
                        </p>
                    </div>
                    <div className="w-56 h-1.5 rounded-full bg-gray-300 dark:bg-gray-800 overflow-hidden">
                        <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                    <p className="text-gray-400 dark:text-gray-500 text-xs font-bold">{percent}%</p>
                </div>
            )}
        </>
    )
}

export default AppPreloader
