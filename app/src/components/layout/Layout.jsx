import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

function Layout({ children, title }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
            {/* Sidebar with Backdrop on mobile */}
            <>
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-[40] lg:hidden backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            </>

            <div className="flex-1 flex flex-col min-w-0">
                <Navbar title={title} onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 pt-20 p-4 md:p-6 lg:ml-64 transition-all">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default Layout