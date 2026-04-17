import { Outlet } from 'react-router';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function Root() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
