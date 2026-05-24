import { create } from 'zustand'

const useAuthStore = create((set) => ({
    user: null,
    role: localStorage.getItem('gpos_user_role') || null,
    loading: true,
    setUser: (user) => set({ user }),
    setRole: (role) => {
        localStorage.setItem('gpos_user_role', role)
        set({ role })
    },
    setLoading: (loading) => set({ loading }),
}))

export default useAuthStore