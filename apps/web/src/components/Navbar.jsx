import React, { useState } from 'react';
import { Bell, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSimulation } from '../contexts/SimulationContext';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [clearedNotifications, setClearedNotifications] = useState(new Set());
  
  const { simulations } = useSimulation();
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const activeNotifications = Object.entries(simulations).filter(([id, sim]) => 
    (sim.status === 'completed' || sim.status === 'error') && !clearedNotifications.has(id)
  );

  const hasUnread = activeNotifications.length > 0;

  const handleNotificationClick = (id) => {
    setIsDropdownOpen(false);
    setClearedNotifications(prev => new Set(prev).add(id));
    navigate(`/decisions/${id}/simulate`);
  };

  const clearAll = () => {
    const newSet = new Set(clearedNotifications);
    activeNotifications.forEach(([id]) => newSet.add(id));
    setClearedNotifications(newSet);
    setIsDropdownOpen(false);
  };

  const location = useLocation();
  const isFullScreenApp = location.pathname.includes('/simulate') || location.pathname.includes('/review');

  const notificationContent = (
    <div className="flex items-center gap-4 relative">
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative p-2.5 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors border border-transparent hover:border-[rgba(0,0,0,0.1)] dark:hover:border-white/10"
      >
        <Bell size={20} />
        {hasUnread && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-[hsl(var(--bg-primary))] rounded-full animate-pulse"></span>
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute top-12 right-0 w-80 bg-[hsl(var(--bg-primary))] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="flex justify-between items-center p-4 border-b border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)]">
            <h3 className="font-bold text-[hsl(var(--text-primary))] text-sm">Notifications</h3>
            {hasUnread && (
              <button onClick={clearAll} className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">Clear All</button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!hasUnread ? (
              <div className="p-6 text-center text-[hsl(var(--text-muted))] text-sm italic">No new notifications</div>
            ) : (
              activeNotifications.map(([id, sim]) => (
                <div 
                  key={id} 
                  onClick={() => handleNotificationClick(id)}
                  className="p-4 border-b border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors flex gap-3 items-start"
                >
                  {sim.status === 'completed' ? (
                    <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={16} />
                  ) : (
                    <XCircle className="text-red-500 mt-1 flex-shrink-0" size={16} />
                  )}
                  <div>
                    <p className="text-sm text-[hsl(var(--text-primary))] font-medium mb-1 capitalize">Scenario {sim.status}</p>
                    <p className="text-xs text-[hsl(var(--text-secondary))] line-clamp-2">{sim.policyContext || id}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (isFullScreenApp) {
    return (
      <div className="absolute top-6 right-8 z-50">
        {notificationContent}
      </div>
    );
  }

  return (
    <header className="h-20 glass-panel border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.05)] flex items-center justify-end px-8 z-10 transition-all flex-shrink-0">
      {notificationContent}
    </header>
  );
}
