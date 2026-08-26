import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [sysConfig, setSysConfig] = useState({ provider: '', model: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setSysConfig({ provider: data.llmProvider, model: data.llmModel });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch config', err);
        setLoading(false);
      });
  }, []);
  
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-heading">Account <span className="text-blue-500">Settings</span></h2>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden mt-6">
        <div className="p-6 border-b border-white/5">
          <h3 className="font-bold text-[hsl(var(--text-secondary))] tracking-wider uppercase text-xs">Profile Information</h3>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
            <input 
              type="text" 
              readOnly 
              value={user?.email || ''} 
              className="w-full max-w-md glass-input rounded-lg p-3 cursor-not-allowed opacity-70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Account ID</label>
            <input 
              type="text" 
              readOnly 
              value={user?.id || ''} 
              className="w-full max-w-md glass-input rounded-lg p-3 font-mono text-sm cursor-not-allowed opacity-70"
            />
          </div>
          
          <div className="pt-4 mt-6 border-t border-white/5">
            <h4 className="text-white font-medium mb-2">System Configuration</h4>
            <p className="text-sm text-slate-400 mb-4">
              Your workspace is currently configured to use{' '}
              <span className="font-mono text-blue-400">
                {loading ? 'fetching...' : `${sysConfig.provider} (${sysConfig.model})`}
              </span>{' '}
              for AI reasoning.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
