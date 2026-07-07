import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { auth, db } from '../../firebase/config'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import FirestoreService, { getUserSessionContext } from '../../firebase/firestore-multi-branch'
import useAuthStore from '../../store/authStore-multi-branch'
import { handleError, showSuccess } from '../../utils/errorHandler'
import { Building2, ArrowRight, ArrowLeft, BookOpen, AlertCircle, LogIn, KeyRound } from 'lucide-react'
import { sendPasswordResetEmail } from 'firebase/auth'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const [showBranchSelect, setShowBranchSelect] = useState(false)
    const [availableBranches, setAvailableBranches] = useState([])
    const [loginContext, setLoginContext] = useState(null)
    const [showForgot, setShowForgot] = useState(false)
    const [forgotEmail, setForgotEmail] = useState('')
    const [forgotMsg, setForgotMsg] = useState('')
    const [forgotLoading, setForgotLoading] = useState(false)

    const handleForgotPassword = async (e) => {
        e.preventDefault()
        setForgotLoading(true)
        setForgotMsg('')
        try {
            await sendPasswordResetEmail(auth, forgotEmail)
            setForgotMsg('✅ Password reset email sent! Inbox check karein.')
        } catch (err) {
            setForgotMsg('❌ Email nahi mila. Admin se rabta karein.')
        } finally {
            setForgotLoading(false)
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            // Step 1: Authenticate with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // Step 2: Get user profile from GLOBAL users collection
            const userDoc = await getDoc(doc(db, 'users', user.uid))
            const userData = userDoc.exists() ? userDoc.data() : null

            if (!userData) {
                setError('No account record found. Please register or contact your admin.')
                setLoading(false)
                return
            }

            const businessId = userData.businessId
            const userRole = userData.role

            // Step 3: Check for pending status
            if (userRole === 'pending') {
                useAuthStore.setState({
                    user,
                    userId: user.uid,
                    userEmail: user.email,
                    userRole: 'pending',
                    businessId: businessId,
                    isAuthenticated: true
                })
                navigate('/pending-approval')
                return
            }

            // Step 4: Get business & branches context (Session Context)
            let context = await getUserSessionContext(user.uid)

            if (!context) {
                setError('Failed to load business context. Please contact support.')
                setLoading(false)
                return
            }

            if (context.disabled) {
                useAuthStore.setState({
                    user,
                    userId: user.uid,
                    userEmail: user.email,
                    businessId: context.businessId,
                    isAuthenticated: true,
                    businessDisabled: true,
                    businessDisabledMessage: context.statusMessage || ''
                })
                navigate('/service-unavailable')
                return
            }

            const branches = context.branches?.map(branch => ({
                branchId: branch.branchId,
                branchName: branch.branchName,
                role: context.role || 'owner'
            })) || [
                {
                    branchId: context.branchId,
                    branchName: context.branchName || "Main Branch",
                    role: context.role || 'owner'
                }
            ]

            // Step 5: Decision - Show Branch Selection or Auto-Login
            if (branches.length > 1) {
                setAvailableBranches(branches)
                setLoginContext({ ...context, user, userRole })
                setShowBranchSelect(true)
            } else {
                // Auto-login to the only branch
                completeLogin(user, context, branches[0], userRole)
            }
        } catch (err) {
            console.error('❌ Login error:', err)
            setError(err.message || 'Invalid email or password')
        } finally {
            setLoading(false)
        }
    }

    const completeLogin = async (user, context, selectedBranch, role) => {
        const finalRole = context.role || role

        // Fetch branch settings to get currency
        let currency = 'PKR'
        try {
            const branchSnap = await FirestoreService.getBranch(context.businessId, selectedBranch.branchId)
            if (branchSnap.exists()) {
                currency = branchSnap.data()?.settings?.currency || 'PKR'
            }
        } catch {}

        useAuthStore.setState({
            user,
            businessId: context.businessId,
            branchId: selectedBranch.branchId,
            branchName: selectedBranch.branchName,
            assignedBranches: availableBranches.length > 0 ? availableBranches : [selectedBranch],
            isAuthenticated: true,
            userId: user.uid,
            userEmail: user.email,
            userRole: finalRole,
            currency
        })
        showSuccess(`Welcome back to ${selectedBranch.branchName}!`)
        navigate('/dashboard')
    }

    if (showBranchSelect) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Building2 size={32} /></div>
                        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Select Branch</h2>
                        <p className="text-gray-500 mt-2">Which location would you like to open today?</p>
                    </div>

                    <div className="space-y-3">
                        {availableBranches.map((branch) => (
                            <button
                                key={branch.branchId}
                                onClick={() => completeLogin(loginContext.user, loginContext, branch, loginContext.userRole)}
                                className="w-full text-left p-4 rounded-2xl border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-800 group-hover:text-blue-700">{branch.branchName}</p>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-0.5">{branch.role}</p>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500" />
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            setShowBranchSelect(false)
                            setLoading(false)
                        }}
                        className="w-full mt-6 text-sm text-gray-400 font-bold uppercase tracking-widest hover:text-gray-600 transition"
                    >
                        <ArrowLeft size={14} className="inline mr-1" /> Back to Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <img
                        src="/stg_logo.jpeg"
                        alt="STG Logo"
                        className="h-20 w-20 rounded-2xl object-cover mx-auto mb-3 shadow-lg"
                    />
                    <h1 className="text-2xl font-bold text-gray-800">Fabric POS</h1>
                    <p className="text-gray-400 mt-1 text-sm">Fabric Factory Management</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                        <AlertCircle size={15} className="flex-shrink-0" /> {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <LogIn size={16} /> {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Forgot Password */}
                <div className="mt-4 text-center">
                    <button
                        onClick={() => { setShowForgot(!showForgot); setForgotMsg('') }}
                        className="text-sm text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto transition"
                    >
                        <KeyRound size={13} /> Password bhool gaye?
                    </button>
                </div>

                {showForgot && (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p className="text-xs text-blue-700 font-bold mb-3">Email likhein — password reset link bheja jayega</p>
                        <form onSubmit={handleForgotPassword} className="flex gap-2">
                            <input
                                type="email"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                placeholder="aapka@email.com"
                                required
                                className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <button
                                type="submit"
                                disabled={forgotLoading}
                                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                            >
                                {forgotLoading ? '...' : 'Send'}
                            </button>
                        </form>
                        {forgotMsg && (
                            <p className="text-xs mt-2 font-medium text-blue-800">{forgotMsg}</p>
                        )}
                    </div>
                )}

                <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
                    <div>
                        Account nahi hai?{' '}
                        <span className="text-gray-400">Admin se rabta karein</span>
                    </div>
                    <div>
                        <Link to="/docs" className="text-gray-400 hover:text-blue-600 transition font-medium flex items-center justify-center gap-1">
                            <BookOpen size={13} /> View Documentation
                        </Link>
                    </div>
                </div>

                <p className="text-center text-gray-400 text-xs mt-6">
                    Fabric POS v2.0 · Powered by Firebase
                </p>
            </div>
        </div>
    )
}

export default Login