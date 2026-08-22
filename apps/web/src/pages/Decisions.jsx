import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useSimulation } from '../contexts/SimulationContext';

export default function Decisions() {
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();
  const { socket } = useSimulation();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDecisions = async () => {
    try {
      const res = await fetchWithAuth('/api/decisions');
      if (res.ok) {
        const data = await res.json();
        setDecisions(data);
      }
    } catch (err) {
      console.error('Failed to fetch decisions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDecision = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this simulation?')) return;
    
    try {
      const res = await fetchWithAuth(`/api/decisions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDecisions(prev => prev.filter(d => d.id !== id));
      } else {
        alert('Failed to delete simulation');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting simulation');
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleSocketEvent = (eventName) => {
      if (eventName.startsWith('simulation:')) {
        // Debounce or just fetch immediately
        fetchDecisions();
      }
    };
    
    socket.onAny(handleSocketEvent);
    
    return () => {
      socket.offAny(handleSocketEvent);
    };
  }, [socket, fetchWithAuth]);

  const handleNewDecision = () => {
    // Generate a random ID for the new simulation
    const randomId = `eval-${Math.random().toString(36).substring(2, 8)}`;
    navigate(`/decisions/${randomId}/simulate`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-[hsl(var(--text-primary))] tracking-tight font-heading">Simulation <span className="text-blue-500">History</span></h2>
        <button 
          onClick={handleNewDecision}
          className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm"
        >
          New Decision Simulation
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden mt-6">
        <div className="p-6 border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.05)]">
          <h3 className="font-bold text-[hsl(var(--text-secondary))] tracking-wider uppercase text-xs">Recent Activity</h3>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-[hsl(var(--text-muted))] italic flex items-center justify-center gap-3">
            <span className="animate-spin w-4 h-4 border-2 border-[hsl(var(--text-muted))] border-t-transparent rounded-full"></span>
            Loading simulation history...
          </div>
        ) : decisions.length === 0 ? (
          <div className="p-12 text-center text-[hsl(var(--text-muted))]">
            No decisions recorded yet. Click "New Decision Simulation" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-black/5 dark:bg-white/5 text-[hsl(var(--text-secondary))] text-xs tracking-wider uppercase border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.05)]">
                  <th className="px-6 py-4 font-semibold">Decision ID</th>
                  <th className="px-6 py-4 font-semibold">Context Snippet</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Confidence</th>
                  <th className="px-6 py-4 font-semibold text-right">Date</th>
                  <th className="px-6 py-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.05)] dark:divide-[rgba(255,255,255,0.05)] text-sm">
                {decisions.map((dec) => (
                  <tr key={dec.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => navigate(`/decisions/${dec.id}/simulate`)}>
                    <td className="px-6 py-4 font-mono text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300">{dec.id}</td>
                    <td className="px-6 py-4 text-[hsl(var(--text-secondary))] max-w-xs truncate">{dec.policy_context}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        dec.status === 'completed' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30' : 
                        dec.status === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' : 
                        'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/30'
                      }`}>
                        {dec.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {dec.confidence !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-black/10 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full ${dec.confidence > 70 ? 'bg-green-500' : dec.confidence > 40 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{width: `${dec.confidence}%`}}></div>
                          </div>
                          <span className="text-[hsl(var(--text-muted))] text-xs">{dec.confidence}%</span>
                        </div>
                      ) : (
                        <span className="text-[hsl(var(--text-muted))] text-xs">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-[hsl(var(--text-muted))] text-xs">
                      {new Date(dec.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => handleDeleteDecision(e, dec.id)}
                        className="text-[hsl(var(--text-muted))] hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10"
                        title="Delete Simulation"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
