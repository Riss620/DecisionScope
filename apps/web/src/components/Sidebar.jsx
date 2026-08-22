import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Activity, Sun, Moon, LogOut, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Simulation History', icon: FileText, path: '/decisions' },
    { name: 'Active Scenarios', icon: Activity, path: '/scenarios' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="w-64 bg-[hsl(var(--bg-secondary))] border-r border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.05)] flex flex-col h-screen z-10 flex-shrink-0">
      
      {/* Top Section */}
      <div className="p-4 relative">
        {onClose && (
           <button onClick={onClose} className="absolute top-4 right-4 md:hidden text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]">
             <X size={20} />
           </button>
        )}
        <h1 className="text-xl font-bold flex items-center gap-2 mb-6 px-2 font-heading tracking-wide text-[hsl(var(--text-primary))]">
          <Activity className="text-blue-500" size={24} />
          DecisionScope
        </h1>
        
        {/* New Chat Button Equivalent */}
        <NavLink to="/documents/upload" className="flex items-center gap-2 w-full px-3 py-3 rounded-lg text-sm font-medium text-[hsl(var(--text-primary))] hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
          <Plus size={16} />
          New Simulation
        </NavLink>
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 mt-4 overflow-y-auto">
        <div className="px-3">
          <p className="px-3 text-xs font-bold text-[hsl(var(--text-muted))] mb-2 uppercase tracking-wider">Workspace</p>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-black/5 dark:bg-white/10 text-[hsl(var(--text-primary))] font-medium'
                        : 'text-[hsl(var(--text-secondary))] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[hsl(var(--text-primary))]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={18} className={isActive ? 'text-[hsl(var(--text-primary))]' : ''} />
                      <span className="truncate">{item.name}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      
      {/* User Profile Section */}
      <div className="p-4 border-t border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.05)] mt-auto relative" ref={menuRef}>
        
        <button onClick={toggleTheme} className="hidden md:flex mb-4 items-center justify-between w-full px-3 py-2 text-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
          <span className="flex items-center gap-3"><Sun size={18} className="hidden dark:block" /><Moon size={18} className="dark:hidden" /> Theme</span>
        </button>

        {showUserMenu && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-[hsl(var(--bg-primary))] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl overflow-hidden z-50 py-1">
            <div className="px-3 py-3 border-b border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)]">
              <p className="text-xs text-[hsl(var(--text-muted))] font-medium truncate">{user?.email}</p>
            </div>
            <button 
              onClick={() => { setShowUserMenu(false); logout(); }} 
              className="w-full text-left px-4 py-3 text-sm text-[hsl(var(--text-primary))] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-3"
            >
              <LogOut size={16} className="text-[hsl(var(--text-secondary))]" />
              Sign Out
            </button>
          </div>
        )}

        <div 
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`flex items-center justify-between px-2 hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-lg cursor-pointer transition-colors ${showUserMenu ? 'bg-black/5 dark:bg-white/5' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#10a37f] flex items-center justify-center text-white text-xs font-bold uppercase">
              {user?.email?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate max-w-[120px]">{user?.email || 'Demo User'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
