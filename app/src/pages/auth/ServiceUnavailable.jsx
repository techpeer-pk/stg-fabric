import { logout } from '../../firebase/auth'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore-multi-branch'

const DEFAULT_MESSAGE = "We're unable to load your workspace right now. Please contact support for assistance."

function ServiceUnavailable() {
    const navigate = useNavigate()
    const { businessDisabledMessage } = useAuthStore()

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-lg border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Service Temporarily Unavailable</h1>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    {businessDisabledMessage || DEFAULT_MESSAGE}
                </p>

                <div className="space-y-4">
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

export default ServiceUnavailable
