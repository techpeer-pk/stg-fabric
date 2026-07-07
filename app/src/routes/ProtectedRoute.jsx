import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore-multi-branch'
import AppPreloader from '../components/common/AppPreloader'

function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading, userRole, businessDisabled } = useAuthStore()

    if (loading) return (
        <div className="min-h-screen bg-gray-200 dark:bg-gray-950 flex flex-col items-center justify-center fixed inset-0 z-[9999]">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-blue-600 font-medium italic">Verifying Access...</p>
        </div>
    )

    if (!user) {
        return <Navigate to="/login" />
    }

    if (businessDisabled) {
        return <Navigate to="/service-unavailable" />
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/dashboard" />
    }

    return <AppPreloader>{children}</AppPreloader>
}

export default ProtectedRoute
