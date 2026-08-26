import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

import { useSimulation } from '../contexts/SimulationContext';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, byStatus: {}, avgConfidence: 0 });
  const [loading, setLoading] = useState(true);
  const { fetchWithAuth } = useAuth();
  const { socket } = useSimulation();

  const fetchStats = async () => {
    try {
      const res = await fetchWithAuth('/api/decisions/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleSocketEvent = (eventName) => {
      if (eventName.startsWith('simulation:')) {
        fetchStats();
      }
    };
    
    socket.onAny(handleSocketEvent);
    
    return () => {
      socket.offAny(handleSocketEvent);
    };
  }, [socket, fetchWithAuth]);

  // Mock data for the chart since we don't have time-series volume in the DB right now
  const chartData = [
    { name: 'Mon', volume: 4 },
    { name: 'Tue', volume: 7 },
    { name: 'Wed', volume: 5 },
    { name: 'Thu', volume: 12 },
    { name: 'Fri', volume: stats.total || 3 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-[hsl(var(--text-primary))] tracking-tight font-heading">System <span className="text-blue-500">Overview</span></h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover-lift cursor-default">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all duration-500"></div>
          <h3 className="text-[hsl(var(--text-secondary))] text-xs font-bold uppercase tracking-wider">Total Decisions Evaluated</h3>
          <p className="text-4xl font-extrabold text-[hsl(var(--text-primary))] mt-3 font-heading">
            {loading ? <span className="animate-pulse">--</span> : stats.total}
          </p>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover-lift cursor-default">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-green-500/20 transition-all duration-500"></div>
          <h3 className="text-[hsl(var(--text-secondary))] text-xs font-bold uppercase tracking-wider">Average Confidence Score</h3>
          <p className="text-4xl font-extrabold text-[hsl(var(--text-primary))] mt-3 font-heading">
            {loading ? <span className="animate-pulse">--</span> : `${stats.avgConfidence}%`}
          </p>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover-lift cursor-default">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-red-500/20 transition-all duration-500"></div>
          <h3 className="text-[hsl(var(--text-secondary))] text-xs font-bold uppercase tracking-wider">Refused / Error Rate</h3>
          <p className="text-4xl font-extrabold text-[hsl(var(--text-primary))] mt-3 font-heading">
            {loading ? <span className="animate-pulse">--</span> : stats.byStatus['error'] || 0}
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl h-96 relative overflow-hidden mt-8">
        <h3 className="font-bold text-[hsl(var(--text-secondary))] tracking-wider uppercase text-xs mb-6">Decision Volume (7 Days)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
              itemStyle={{ color: '#60a5fa' }}
            />
            <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
