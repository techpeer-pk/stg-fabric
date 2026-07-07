import { useEffect, useState } from 'react'
import { login, logout, onAuthChange } from '../../firebase/auth'
import FirestoreService from '../../firebase/firestore-multi-branch'
import { handleError, showSuccess } from '../../utils/errorHandler'

// Real enforcement is `isPlatformAdmin()` in firestore.rules — this is only
// for UI decisions (which screen to show), never trusted on its own.
const ADMIN_EMAIL = 'techpeer.pk@gmail.com'

function AccessCodeGate({ onUnlock }) {
    const [code, setCode] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        const expected = import.meta.env.VITE_BILLING_ACCESS_CODE
        if (expected && code === expected) {
            sessionStorage.setItem('billing_unlocked', 'true')
            onUnlock()
        } else {
            setError('Incorrect code')
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
                <h1 className="text-lg font-bold text-gray-800 mb-4">Access Code</h1>
                <input
                    type="password"
                    autoFocus
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setError('') }}
                    className="w-full border rounded-xl px-4 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter code"
                />
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
                    Continue
                </button>
            </form>
        </div>
    )
}

function AdminLoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(email, password)
        } catch (err) {
            setError(err.message || 'Sign in failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm space-y-3">
                <h1 className="text-lg font-bold text-gray-800 mb-2">Admin Sign In</h1>
                <input
                    type="email" required autoFocus value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email"
                />
                <input
                    type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Password"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                    type="submit" disabled={loading}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>
        </div>
    )
}

function BillingStatus() {
    const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('billing_unlocked') === 'true')
    const [authUser, setAuthUser] = useState(undefined) // undefined = auth state not resolved yet
    const [businesses, setBusinesses] = useState([])
    const [loading, setLoading] = useState(false)
    const [messageDrafts, setMessageDrafts] = useState({}) // businessId -> draft text shown on their lockout screen

    useEffect(() => {
        const unsubscribe = onAuthChange(setAuthUser)
        return () => unsubscribe()
    }, [])

    const authorized = authUser?.email === ADMIN_EMAIL

    useEffect(() => {
        if (!unlocked || !authorized) return
        const fetchBusinesses = async () => {
            setLoading(true)
            try {
                const snap = await FirestoreService.getAllBusinesses()
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                setBusinesses(list)
                setMessageDrafts(Object.fromEntries(list.map(b => [b.id, b.statusMessage || ''])))
            } catch (err) {
                handleError(err, 'Fetch Businesses', 'Failed to load businesses')
            } finally {
                setLoading(false)
            }
        }
        fetchBusinesses()
    }, [unlocked, authorized])

    const toggleActive = async (biz) => {
        const nextActive = biz.active === false
        const message = messageDrafts[biz.id] || ''
        try {
            await FirestoreService.updateBusinessStatus(biz.id, nextActive, message)
            setBusinesses(prev => prev.map(b => b.id === biz.id ? { ...b, active: nextActive, statusMessage: message } : b))
            showSuccess(`${biz.businessName || biz.id} ${nextActive ? 'enabled' : 'disabled'}`)
        } catch (err) {
            handleError(err, 'Update Business Status', 'Failed to update status')
        }
    }

    if (!unlocked) return <AccessCodeGate onUnlock={() => setUnlocked(true)} />
    if (authUser === undefined) return null
    if (!authUser) return <AdminLoginForm />

    if (!authorized) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm">
                    <p className="text-gray-800 font-bold mb-4">Not authorized</p>
                    <button onClick={() => logout()} className="text-sm text-gray-500 hover:text-red-600">Sign Out</button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-bold">Client Access</h1>
                    <button onClick={() => logout()} className="text-sm text-gray-400 hover:text-red-400">Sign Out</button>
                </div>
                {loading ? (
                    <p className="text-gray-400">Loading...</p>
                ) : (
                    <div className="space-y-2">
                        {businesses.map(biz => {
                            const isActive = biz.active !== false
                            return (
                                <div key={biz.id} className="bg-gray-900 rounded-xl px-4 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-bold">{biz.businessName || biz.id}</p>
                                            <p className="text-xs text-gray-500">{biz.id}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-black uppercase px-2 py-1 rounded-full ${isActive ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                                                {isActive ? 'Active' : 'Disabled'}
                                            </span>
                                            <button
                                                onClick={() => toggleActive(biz)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition text-white ${isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                                            >
                                                {isActive ? 'Disable' : 'Enable'}
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={messageDrafts[biz.id] ?? ''}
                                        onChange={(e) => setMessageDrafts(prev => ({ ...prev, [biz.id]: e.target.value }))}
                                        placeholder="Message shown to this client when disabled (optional — defaults to a generic message)"
                                        className="mt-2 w-full bg-gray-800 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-600"
                                    />
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default BillingStatus
