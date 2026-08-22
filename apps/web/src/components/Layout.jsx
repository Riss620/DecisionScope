import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Sun, Moon } from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useTheme } from '../contexts/ThemeContext';

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  // The simulation and review pages have their own custom full-height scroll handling
  const isFullScreenApp = location.pathname.includes('/simulate') || location.pathname.includes('/review');

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[hsl(var(--bg-primary))] text-[hsl(var(--text-primary))]">
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.05)] bg-[hsl(var(--bg-secondary))] absolute top-0 left-0 w-full z-40 h-16">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]">
          <Menu size={24} />
        </button>
        <span className="font-bold font-heading text-lg">DecisionScope</span>
        <button onClick={toggleTheme} className="p-2 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden pt-16 md:pt-0">
        <div className="hidden md:block">
          <Navbar />
        </div>
        <main className={`flex-1 relative z-0 ${isFullScreenApp ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto p-4 md:p-8'}`}>
          <div className={`mx-auto w-full h-full ${isFullScreenApp ? 'max-w-full' : 'max-w-7xl'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
