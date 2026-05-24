import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create(
    persist(
        (set) => ({
            isDarkMode: true,
            toggleTheme: () => set((state) => {
                const next = !state.isDarkMode
                if (next) {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
                return { isDarkMode: next }
            }),
            initTheme: () => {
                const isDark = useThemeStore.getState().isDarkMode
                if (isDark) {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
            }
        }),
        {
            name: 'gpos-theme-v2',
        }
    )
)

export default useThemeStore
