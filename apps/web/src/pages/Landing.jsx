import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Activity, BrainCircuit, ShieldCheck, Zap, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--bg-primary))] text-[hsl(var(--text-primary))] selection:bg-blue-500/30">
      
      {/* Landing Navbar */}
      <nav className="border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.05)] bg-[hsl(var(--bg-primary))] sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-500" size={28} />
            <span className="text-xl font-bold font-heading tracking-wide">DecisionScope</span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTheme} 
              className="p-2 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Sun size={20} className="hidden dark:block" />
              <Moon size={20} className="dark:hidden" />
            </button>
            <Link to="/login" className="text-sm font-medium text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors hidden sm:block">
              Log in
            </Link>
            <Link to="/signup" className="btn-primary px-5 py-2.5 rounded-full text-sm font-bold shadow-sm flex items-center gap-2 group">
              Get Started
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-20 px-6 relative overflow-hidden">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center z-10 relative"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 text-[hsl(var(--text-secondary))] text-xs font-bold uppercase tracking-wider mb-8 border border-[rgba(0,0,0,0.1)] dark:border-white/10">
            Decision Intelligence 2.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight font-heading mb-6 leading-tight">
            Simulate decisions. <br/>
            <span className="text-blue-600 dark:text-blue-500">Predict the impact.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[hsl(var(--text-secondary))] max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload policy documents, configure actions, and let our multi-agent AI framework dynamically simulate consequences across all stakeholders before you execute.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="w-full sm:w-auto btn-primary px-8 py-4 rounded-full text-base font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group">
              Sign In to Workspace
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full mt-32 z-10"
        >
          {/* Feature 1 */}
          <div className="glass-panel p-8 rounded-3xl border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.05)] bg-[hsl(var(--bg-secondary))]">
            <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-[rgba(0,0,0,0.1)] dark:border-white/10">
              <BrainCircuit className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 font-heading">Multi-Agent AI</h3>
            <p className="text-[hsl(var(--text-secondary))] text-sm leading-relaxed">
              Our intelligent critic, simulator, and judge agents debate your proposals to uncover blind spots and unintended consequences.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel p-8 rounded-3xl border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.05)] bg-[hsl(var(--bg-secondary))]">
            <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-[rgba(0,0,0,0.1)] dark:border-white/10">
              <ShieldCheck className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 font-heading">Risk Mitigation</h3>
            <p className="text-[hsl(var(--text-secondary))] text-sm leading-relaxed">
              Identify and quantify risks automatically. We generate alternatives and provide a final confidence score before you decide.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel p-8 rounded-3xl border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.05)] bg-[hsl(var(--bg-secondary))]">
            <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-[rgba(0,0,0,0.1)] dark:border-white/10">
              <Zap className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 font-heading">Real-Time Audits</h3>
            <p className="text-[hsl(var(--text-secondary))] text-sm leading-relaxed">
              Every simulation is documented in real-time. Keep a perfect historical record of why decisions were made, and by whom.
            </p>
          </div>
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.05)] py-8 mt-auto z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-[hsl(var(--text-muted))]">
          <p>© {new Date().getFullYear()} DecisionScope AI. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-[hsl(var(--text-primary))] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[hsl(var(--text-primary))] transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
