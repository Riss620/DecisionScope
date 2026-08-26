import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Scenarios() {
  const [activeScenarios, setActiveScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await fetchWithAuth('/api/decisions');
        if (res.ok) {
          const data = await res.json();
          // Filter for scenarios that are currently running or pending
          const active = data.filter(d => d.status === 'pending' || d.status === 'running');
          setActiveScenarios(active);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActive();
    // Poll every 5 seconds since scenarios might be running
    const interval = setInterval(fetchActive, 5000);
    return () => clearInterval(interval);
  }, [fetchWithAuth]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-heading">Active <span className="text-blue-500">Scenarios</span></h2>
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center flex justify-center items-center gap-3">
           <span className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></span>
           <span className="text-[hsl(var(--text-secondary))]">Scanning for active tasks...</span>
        </div>
      ) : activeScenarios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeScenarios.map(scenario => (
            <motion.div 
              key={scenario.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => navigate(`/decisions/${scenario.id}/simulate`)}
              className="glass-panel rounded-2xl p-6 hover-lift cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/15 transition-all duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="text-xs font-mono bg-white/5 text-[hsl(var(--text-secondary))] px-2 py-1 rounded border border-white/5">{scenario.id}</span>
                <span className="flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  PROCESSING
                </span>
              </div>
              <p className="text-sm text-slate-300 line-clamp-2 mb-4 relative z-10">{scenario.policy_context}</p>
              <div className="w-full bg-slate-900/50 rounded-full h-1 overflow-hidden relative z-10">
                <div className="bg-blue-500 h-full w-1/3 animate-[pulse_2s_ease-in-out_infinite]"></div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-700/50">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No active scenarios</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            You don't have any scenarios currently processing. Simulations in DecisionScope usually complete in a few seconds, but any long-running multi-agent tasks would appear here.
          </p>
        </div>
      )}
    </motion.div>
  );
}
