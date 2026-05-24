import { logout } from '../../firebase/auth'
import { useNavigate } from 'react-router-dom'

function PendingApproval() {
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-lg border border-yellow-200">
                <div className="text-6xl mb-6">⏳</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Pending Approval</h1>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Account created! Your credentials have been submitted. An administrator needs to approve your account before you can access the POS system.
                </p>

                <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                        Please contact your manager if this is taking longer than expected.
                    </p>
                    <button
                        onClick={handleLogout}
                        className="w-full py-3 text-gray-600 font-medium hover:text-red-600 transition"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PendingApproval
