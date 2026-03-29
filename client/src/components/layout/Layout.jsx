import { useState } from 'react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'

export const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
