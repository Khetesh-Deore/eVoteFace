export const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        {/* Navigation will go here */}
      </nav>
      <main className="container mx-auto py-8">
        {children}
      </main>
    </div>
  )
}
