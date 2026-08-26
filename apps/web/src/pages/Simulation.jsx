import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useSimulation } from '../contexts/SimulationContext';
import { Send, Mic, Play, Settings, AlertCircle, CheckCircle, BrainCircuit, Activity, Database, Wrench } from 'lucide-react';

const renderStateDetails = (state, node) => {
  if (node === 'inputNode') return null;
  if (node === 'plannerNode') return <p className="text-[hsl(var(--text-secondary))] text-sm">Evaluating state and selecting next tool...</p>;
  
  if (node === 'evidenceToolNode' && state.evidence) {
    return (
      <div className="space-y-2 mt-2">
        {state.evidence.map((item, i) => {
          const text = typeof item === 'string' ? item : (item.finding || JSON.stringify(item));
          return (
            <div key={i} className="flex gap-3 text-sm text-[hsl(var(--text-secondary))]">
              <span className="text-[hsl(var(--text-muted))]">•</span>
              <p>{text.replace(/^\* |\*\*/g, '')}</p> 
            </div>
          );
        })}
      </div>
    );
  }

  if (node === 'simulationToolNode' && state.stakeholderImpacts) {
    const chartData = Object.keys(state.stakeholderImpacts).map(key => ({
      name: key,
      impact: Number(state.stakeholderImpacts[key]) || 0
    }));

    return (
      <div className="w-full h-48 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 10 }} domain={[-100, 100]} tickFormatter={(value) => `${value}%`} />
            <Tooltip 
              cursor={{fill: 'rgba(255,255,255,0.05)'}} 
              contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
              itemStyle={{ color: '#e2e8f0' }}
              formatter={(value) => [`${value}%`, 'Impact']}
            />
            <Bar dataKey="impact" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.impact >= 0 ? '#3b82f6' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  if (node === 'critiqueToolNode') {
    return (
      <div className="space-y-4 mt-2">
        {state.criticFeedback && state.criticFeedback.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identified Risks</span>
            {state.criticFeedback.map((item, i) => (
              <div key={i} className="flex gap-3 text-sm text-[hsl(var(--text-secondary))]">
                <span className="text-red-400">•</span>
                <p>{typeof item === 'string' ? item : JSON.stringify(item)}</p>
              </div>
            ))}
          </div>
        )}
        {state.alternatives && state.alternatives.length > 0 && (
          <div className="space-y-2 mt-4 pt-4 border-t border-slate-700/50">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proposed Alternatives</span>
            {state.alternatives.map((item, i) => (
              <div key={i} className="flex gap-3 text-sm text-[hsl(var(--text-secondary))]">
                <span className="text-amber-400">•</span>
                <p>{typeof item === 'string' ? item : JSON.stringify(item)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  if (node === 'finalJudge' && state.finalRecommendation) {
    return (
      <div className="mt-2 text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
        {state.finalRecommendation}
      </div>
    );
  }
  
  return <p className="text-[hsl(var(--text-secondary))] text-sm flex items-center gap-2"><span className="animate-pulse w-2 h-2 bg-blue-500 rounded-full inline-block"></span> Processing...</p>;
};

export default function Simulation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();
  const { simulations, initSimulationState, updateSimulationState, resetSimulation } = useSimulation();
  
  const bottomRef = useRef(null);

  useEffect(() => {
    initSimulationState(id);
  }, [id, initSimulationState]);

  const simState = simulations[id] || {};
  const status = simState.status || 'idle';
  const progressLog = simState.progressLog || [];
  const traceLog = simState.traceLog || [];
  const impactData = simState.impactData || [];
  const finalRecommendation = simState.finalRecommendation || '';
  const finalConfidence = simState.finalConfidence || null;
  const errorMessage = simState.errorMessage || '';
  const policyContext = simState.policyContext ?? '';
  const proposedAction = simState.proposedAction ?? '';
  const isDemoMode = simState.isDemoMode ?? false;

  const setPolicyContext = (val) => updateSimulationState(id, { policyContext: val });
  const setProposedAction = (val) => updateSimulationState(id, { proposedAction: val });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progressLog, status]);

  const startSimulation = async () => {
    if (!policyContext || !proposedAction) return;
    
    resetSimulation(id);
    
    try {
      await fetchWithAuth(`/api/decisions/${id}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyContext,
          proposedAction,
          demo: isDemoMode
        })
      });
    } catch (err) {
      console.error(err);
      updateSimulationState(id, { status: 'error', errorMessage: 'Failed to start simulation.' });
    }
  };

  const handleFinalDecision = async (decisionStatus) => {
    try {
      await fetchWithAuth(`/api/decisions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: decisionStatus })
      });
      updateSimulationState(id, { status: decisionStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const isConfiguring = status === 'idle' || status === 'error';

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full relative">
      
      {/* Header */}
      <div className="flex justify-between items-center py-4 px-6 border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.05)] bg-[hsl(var(--bg-primary))] sticky top-0 z-10">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[hsl(var(--text-primary))] tracking-wide">Simulation Details</span>
          <span className="text-xs text-[hsl(var(--text-muted))] uppercase">{id}</span>
        </div>
      </div>

      {/* Main Chat Feed */}
      <div className="flex-1 overflow-y-auto scroll-smooth pb-72 px-6 pt-8">
        
        {/* Intro / Context Bubble */}
        <div className="flex gap-4 mb-8">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <BrainCircuit size={16} className="text-white" />
          </div>
          <div className="flex-1 space-y-4">
            <p className="font-bold text-[hsl(var(--text-primary))] text-sm">DecisionScope Agent</p>
            <p className="text-sm text-[hsl(var(--text-secondary))]">
              I'm ready to run a simulation. Please provide the policy context and the proposed action you'd like to evaluate.
            </p>
            
            {errorMessage && isConfiguring && (
              <div className="bg-[hsl(var(--bg-secondary))] border border-red-500/20 rounded-xl p-4 mt-2">
                <p className="text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={14} /> {errorMessage}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* User Submission Bubble */}
        {(!isConfiguring && policyContext && proposedAction) && (
          <div className="flex gap-4 mb-8 justify-end">
            <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-2xl rounded-tr-sm p-4 text-sm text-[hsl(var(--text-primary))] max-w-[80%] border border-[rgba(0,0,0,0.05)] dark:border-white/5">
              <span className="text-xs text-[hsl(var(--text-muted))] font-bold uppercase tracking-wider block mb-2">Context</span>
              <p className="mb-4 text-[hsl(var(--text-secondary))]">{policyContext}</p>
              <span className="text-xs text-[hsl(var(--text-muted))] font-bold uppercase tracking-wider block mb-2">Proposed Action</span>
              <p className="text-[hsl(var(--text-secondary))]">{proposedAction}</p>
            </div>
          </div>
        )}



        {/* Agent Workflow Feed */}
        <AnimatePresence>
          {progressLog.filter(log => log.node !== 'inputNode').map((log, index) => {
            const displayNames = {
              'plannerNode': 'Agent Planner',
              'evidenceToolNode': 'Analyzing Logics & Facts',
              'simulationToolNode': 'Simulating Stakeholder Impacts',
              'critiqueToolNode': 'Identifying Critical Consequences',
              'finalJudge': 'Final Conclusion'
            };
            const displayName = displayNames[log.node] || log.node;
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={index} 
                className="flex gap-4 mb-8"
              >
                <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-slate-800 border border-[rgba(0,0,0,0.1)] dark:border-white/10 flex items-center justify-center shrink-0">
                  {log.node === 'finalJudge' ? <CheckCircle size={14} className="text-green-500" /> : <Settings size={14} className="text-blue-500" />}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[hsl(var(--text-primary))] text-sm mb-1 flex items-center gap-2">
                    {displayName}
                  </p>
                  <div className="text-sm text-[hsl(var(--text-secondary))]">
                    {renderStateDetails(log.state, log.node)}
                  </div>
                  
                  {log.node === 'finalJudge' && finalConfidence !== null && (
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-xs font-bold uppercase text-[hsl(var(--text-muted))]">Confidence</span>
                      <div className="w-48 bg-black/10 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full ${finalConfidence > 70 ? 'bg-green-500' : finalConfidence > 40 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{width: `${finalConfidence}%`}}></div>
                      </div>
                      <span className="text-xs text-[hsl(var(--text-primary))]">{finalConfidence}%</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Decision Actions */}
        {status === 'completed' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center gap-4 mt-8 mb-12">
            <button onClick={() => handleFinalDecision('approved')} className="px-6 py-2.5 rounded-full text-sm font-bold bg-green-600 border border-green-500 text-white hover:bg-green-500 transition-colors shadow-sm">
              Approve Policy Change
            </button>
            <button onClick={() => handleFinalDecision('rejected')} className="px-6 py-2.5 rounded-full text-sm font-bold bg-red-600 border border-red-500 text-white hover:bg-red-500 transition-colors shadow-sm">
              Reject Proposal
            </button>
          </motion.div>
        )}

        {(status === 'approved' || status === 'rejected') && (
          <div className="text-center mt-8 mb-12">
            <span className={`inline-flex px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              Decision {status}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Sticky Bottom Input Bar */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[hsl(var(--bg-primary))] via-[hsl(var(--bg-primary))] to-transparent pt-12 pb-6 px-4 md:px-6 z-20 pointer-events-none">
        <div className="max-w-3xl mx-auto bg-[hsl(var(--bg-secondary))] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-xl p-3 md:p-4 shadow-2xl transition-all duration-300 pointer-events-auto">
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Settings size={14} className="text-blue-500" />
              <span className="text-xs font-bold text-[hsl(var(--text-primary))] uppercase tracking-wider">Simulation Parameters</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-1">Policy Context</label>
                <textarea 
                  className={`w-full bg-transparent border-b ${isConfiguring ? 'border-[rgba(0,0,0,0.2)] focus:border-[rgba(0,0,0,0.5)] dark:border-white/20 dark:focus:border-white/50' : 'border-transparent text-[hsl(var(--text-secondary))]'} pb-1 text-sm text-[hsl(var(--text-primary))] focus:outline-none transition-colors resize-none`}
                  rows="1"
                  placeholder="e.g. Updating grading system"
                  value={policyContext}
                  onChange={(e) => setPolicyContext(e.target.value)}
                  disabled={!isConfiguring}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-1">Proposed Action</label>
                <textarea 
                  className={`w-full bg-transparent border-b ${isConfiguring ? 'border-[rgba(0,0,0,0.2)] focus:border-[rgba(0,0,0,0.5)] dark:border-white/20 dark:focus:border-white/50' : 'border-transparent text-[hsl(var(--text-secondary))]'} pb-1 text-sm text-[hsl(var(--text-primary))] focus:outline-none transition-colors resize-none`}
                  rows="1"
                  placeholder="e.g. Change from A-F to Pass/Fail"
                  value={proposedAction}
                  onChange={(e) => setProposedAction(e.target.value)}
                  disabled={!isConfiguring}
                />
              </div>
            </div>

            <div className="flex justify-between items-end mt-1 pt-2 border-t border-[rgba(0,0,0,0.05)] dark:border-white/5">
              <span className="text-[10px] text-[hsl(var(--text-muted))] hidden sm:block">
                {isConfiguring ? 'Configure parameters and run the simulation to begin.' : 'Simulation is in progress or completed.'}
              </span>
              
              <button 
                onClick={startSimulation}
                disabled={!isConfiguring || !policyContext || !proposedAction}
                className={`px-5 py-2.5 rounded-xl flex items-center justify-center transition-all text-sm font-bold ml-auto sm:ml-0 ${!isConfiguring || !policyContext || !proposedAction ? 'bg-black/5 dark:bg-white/5 text-[hsl(var(--text-muted))] cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]'}`}
              >
                {status === 'running' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> 
                    Running...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Play size={14} className="fill-current" /> 
                    {status === 'completed' ? 'Restart Simulation' : 'Run Simulation'}
                  </span>
                )}
              </button>
            </div>
          </div>

        </div>
        <div className="text-center mt-4">
           <span className="text-[10px] text-slate-500">DecisionScope can make mistakes. Consider verifying important information.</span>
        </div>
      </div>
    </div>
  );
}
