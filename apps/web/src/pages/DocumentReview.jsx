import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSimulation } from '../contexts/SimulationContext';
import { FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DocumentReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();
  const { updateSimulationState } = useSimulation();
  
  const { document, decisionInput: initialDecisionInput } = location.state || {};

  const [decisionInput, setDecisionInput] = useState(initialDecisionInput || {
    policy: { name: '' },
    change: { parameter: '', currentValue: '', proposedValue: '', unit: '' },
    effectiveDate: '',
    stakeholders: [],
    affectedProcesses: [],
    confidence: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!document || !decisionInput) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-xl text-[hsl(var(--text-primary))]">No document data found.</h2>
        <button onClick={() => navigate('/documents/upload')} className="mt-4 btn-primary px-4 py-2 rounded-xl">Go Back</button>
      </div>
    );
  }

  const updateField = (path, value) => {
    setDecisionInput(prev => {
      const keys = path.split('.');
      if (keys.length === 1) return { ...prev, [keys[0]]: value };
      return {
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: value
        }
      };
    });
  };

  const updateArray = (field, value) => {
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    setDecisionInput(prev => ({ ...prev, [field]: arr }));
  };

  const handleRunSimulation = async () => {
    setIsSubmitting(true);
    try {
      // 1. Generate a random scenario ID for the frontend just like Decisions.jsx does
      const randomId = `eval-${Math.random().toString(36).substring(2, 8)}`;
      
      // 2. Format the policy context nicely
      const unitStr = decisionInput.change?.unit && decisionInput.change?.unit !== 'N/A' && decisionInput.change?.unit !== 'status' ? ` ${decisionInput.change.unit}` : '';
      const policyContext = `The "${decisionInput.policy?.name || 'Policy'}" is being updated.`;
      const proposedAction = `Change the ${decisionInput.change?.parameter || 'rule'} from "${decisionInput.change?.currentValue}${unitStr}" to "${decisionInput.change?.proposedValue}${unitStr}".`;
      
      // 3. Pre-fill the SimulationContext state so the simulation page receives this data!
      updateSimulationState(randomId, {
        policyContext,
        proposedAction,
        isDemoMode: false
      });
      
      // 4. Navigate directly to the Simulation screen which handles kicking off the real backend pipeline
      navigate(`/decisions/${randomId}/simulate`);
    } catch (err) {
      console.error(err);
      alert('Failed to start simulation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scroll-smooth w-full relative">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl mx-auto pb-32 pt-12 w-full px-6">
        <div className="flex flex-col gap-6">
          
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mb-2">Document Ingestion</span>
            <h2 className="text-2xl font-bold text-[hsl(var(--text-primary))] font-heading">{document.filename}</h2>
          </div>

          <div className="border-t border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.05)] my-4"></div>

          <div className="flex flex-col gap-4">
            <p className="text-[var(--text-secondary)] text-sm">
              I've extracted the following structured decision from the document. Please review it before we start the simulation.
            </p>

            <div className="glass-panel p-6 mt-2 relative overflow-hidden group">
              
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle size={18} className="text-blue-500" />
                <h3 className="font-bold text-[hsl(var(--text-primary))] text-md font-heading">Structured Decision</h3>
                <span className="ml-auto text-xs font-medium text-[hsl(var(--text-muted))]">
                  {Math.round((decisionInput.confidence || 0) * 100)}% Confidence
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Policy Name</label>
                  <input type="text" value={decisionInput.policy?.name || ''} onChange={(e) => updateField('policy.name', e.target.value)} className="w-full bg-transparent text-sm text-[hsl(var(--text-primary))] focus:outline-none border-b border-transparent focus:border-[rgba(0,0,0,0.2)] dark:focus:border-[rgba(255,255,255,0.2)] pb-1 transition-colors" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Parameter</label>
                    <input type="text" value={decisionInput.change?.parameter || ''} onChange={(e) => updateField('change.parameter', e.target.value)} className="w-full bg-transparent text-sm text-[hsl(var(--text-primary))] focus:outline-none border-b border-transparent focus:border-[rgba(0,0,0,0.2)] dark:focus:border-[rgba(255,255,255,0.2)] pb-1 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Unit</label>
                    <input type="text" value={decisionInput.change?.unit || ''} onChange={(e) => updateField('change.unit', e.target.value)} className="w-full bg-transparent text-sm text-[hsl(var(--text-primary))] focus:outline-none border-b border-transparent focus:border-[rgba(0,0,0,0.2)] dark:focus:border-[rgba(255,255,255,0.2)] pb-1 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Current Value</label>
                    <input type="text" value={decisionInput.change?.currentValue || ''} onChange={(e) => updateField('change.currentValue', e.target.value)} className="w-full bg-transparent text-sm text-[hsl(var(--text-primary))] focus:outline-none border-b border-transparent focus:border-[rgba(0,0,0,0.2)] dark:focus:border-[rgba(255,255,255,0.2)] pb-1 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Proposed Value</label>
                    <input type="text" value={decisionInput.change?.proposedValue || ''} onChange={(e) => updateField('change.proposedValue', e.target.value)} className="w-full bg-transparent text-sm text-[hsl(var(--text-primary))] focus:outline-none border-b border-transparent focus:border-[rgba(0,0,0,0.2)] dark:focus:border-[rgba(255,255,255,0.2)] pb-1 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Effective Date</label>
                  <input type="text" value={decisionInput.effectiveDate || ''} onChange={(e) => updateField('effectiveDate', e.target.value)} className="w-full bg-transparent text-sm text-[hsl(var(--text-primary))] focus:outline-none border-b border-transparent focus:border-[rgba(0,0,0,0.2)] dark:focus:border-[rgba(255,255,255,0.2)] pb-1 transition-colors" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Stakeholders (comma separated)</label>
                  <input type="text" value={decisionInput.stakeholders?.join(', ') || ''} onChange={(e) => updateArray('stakeholders', e.target.value)} className="w-full bg-transparent text-sm text-[hsl(var(--text-primary))] focus:outline-none border-b border-transparent focus:border-[rgba(0,0,0,0.2)] dark:focus:border-[rgba(255,255,255,0.2)] pb-1 transition-colors" />
                </div>
              </div>
              
              {decisionInput.confidence < 0.8 && (
                <div className="mt-6 flex items-start gap-2 text-xs text-yellow-500 bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10">
                  <AlertTriangle size={14} className="mt-0.5" />
                  <p>Confidence is low. Please review.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={handleRunSimulation} disabled={isSubmitting} className="btn-primary px-5 py-2.5 rounded-lg text-sm flex items-center gap-2">
                {isSubmitting ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> : 'Review & Run Simulation'}
              </button>
              <button onClick={() => navigate('/documents/upload')} className="btn-ghost px-5 py-2.5 rounded-lg text-sm">Cancel</button>
            </div>
            
            <p className="text-xs text-[var(--text-muted)] mt-2">
              The user can correct something before the agents continue.<br/>
              That is much safer than allowing the LLM to blindly consume an entire document.
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
