const { recordTrace } = require('./trace');
const { searchPolicyEvidence } = require('../tools/searchPolicyEvidence');
const { simulateStakeholderImpact } = require('../tools/simulateStakeholderImpact');
const { critiquePolicy } = require('../tools/critiquePolicy');

const createPlannerNode = (llmProvider) => {
  return async (state) => {
    console.log('--- Planner Node ---');
    
    // 1. Initial Plan Creation (if not yet created)
    if (!state.agentPlan || !state.agentPlan.goal) {
      state.agentPlan = {
        goal: `Evaluate proposed action: ${state.proposedAction}`,
        steps: ['searchEvidence', 'simulateImpact', 'critiquePolicy', 'finalJudge'],
        currentStep: 0
      };
      recordTrace(state, 'plan', { message: 'Initialized evaluation plan.' });
    }

    let nextAction = 'finalJudge';
    
    // Check if we need to ask for clarification
    if (state.requiresClarification) {
      recordTrace(state, 'decision', { message: 'Input is ambiguous. Requesting clarification.' });
      return { nextAction: 'clarification', status: 'error', error: 'Ambiguous Input: Please clarify the proposed action.' };
    }

    // Determine next step based on state
    if (!state.evidence || state.evidence.length === 0) {
      // Need evidence
      recordTrace(state, 'decision', { message: 'Evidence is required before stakeholder simulation.' });
      nextAction = 'searchEvidence';
    } else if (Object.keys(state.stakeholderImpacts || {}).length === 0) {
      // Need stakeholder simulation
      recordTrace(state, 'decision', { message: 'Evidence is sufficient; proceeding to stakeholder simulation.' });
      nextAction = 'simulateImpact';
    } else if (!state.criticFeedback || state.criticFeedback.length === 0) {
      // Determine if critique is needed
      const impacts = Object.values(state.stakeholderImpacts);
      const hasNegativeImpact = impacts.some(score => score < 0);
      
      if (hasNegativeImpact) {
        recordTrace(state, 'decision', { message: 'Negative stakeholder impact detected. Next action: critiquePolicy.' });
        nextAction = 'critique';
      } else {
        recordTrace(state, 'decision', { message: 'Impacts are positive. Proceeding to final judge.' });
        nextAction = 'finalJudge';
      }
    } else {
      recordTrace(state, 'decision', { message: 'Evaluation complete. Proceeding to final recommendation.' });
      nextAction = 'finalJudge';
    }

    return { nextAction, agentTrace: state.agentTrace };
  };
};

const createEvidenceToolNode = (llmProvider, retrievalProvider) => {
  return async (state) => {
    console.log('--- Evidence Tool Node ---');
    const inputSummary = `Search evidence for proposed action: ${state.proposedAction}`;
    recordTrace(state, 'tool_call', { tool: 'searchPolicyEvidence', inputSummary });
    
    const result = await searchPolicyEvidence({
      policyContext: state.policyContext,
      proposedAction: state.proposedAction,
      memoryContext: state.memory || '',
      retrievalProvider,
      llmProvider
    });
    
    const resultSummary = result.success ? `${result.evidence.length} relevant evidence items found.` : `Search failed: ${result.error}`;
    recordTrace(state, 'tool_result', { tool: 'searchPolicyEvidence', success: result.success, resultSummary });

    if (!result.success) {
      return { status: 'error', error: `Tool searchPolicyEvidence failed: ${result.error}`, agentTrace: state.agentTrace };
    }
    
    return { evidence: result.evidence, toolResults: [resultSummary], agentTrace: state.agentTrace };
  };
};

const createSimulationToolNode = (llmProvider) => {
  return async (state) => {
    console.log('--- Simulation Tool Node ---');
    recordTrace(state, 'tool_call', { tool: 'simulateStakeholderImpact', inputSummary: 'Simulate impacts on stakeholders.' });
    
    const result = await simulateStakeholderImpact({
      policyContext: state.policyContext,
      proposedAction: state.proposedAction,
      evidence: state.evidence,
      memoryContext: state.memory || '',
      llmProvider
    });
    
    const resultSummary = result.success ? `Impacts calculated: ${JSON.stringify(result.stakeholders)}` : `Simulation failed: ${result.error}`;
    recordTrace(state, 'tool_result', { tool: 'simulateStakeholderImpact', success: result.success, resultSummary });
    
    if (!result.success) {
      return { status: 'error', error: `Tool simulateStakeholderImpact failed: ${result.error}`, agentTrace: state.agentTrace };
    }
    
    return { stakeholderImpacts: result.stakeholders, toolResults: [resultSummary], agentTrace: state.agentTrace };
  };
};

const createCritiqueToolNode = (llmProvider) => {
  return async (state) => {
    console.log('--- Critique Tool Node ---');
    recordTrace(state, 'tool_call', { tool: 'critiquePolicy', inputSummary: 'Critique policy based on impacts.' });
    
    const result = await critiquePolicy({
      policyContext: state.policyContext,
      proposedAction: state.proposedAction,
      stakeholderImpacts: state.stakeholderImpacts,
      evidence: state.evidence,
      llmProvider
    });
    
    const resultSummary = result.success ? `Identified ${result.risks.length} risks.` : `Critique failed: ${result.error}`;
    recordTrace(state, 'tool_result', { tool: 'critiquePolicy', success: result.success, resultSummary });
    
    if (!result.success) {
      return { status: 'error', error: `Tool critiquePolicy failed: ${result.error}`, agentTrace: state.agentTrace };
    }
    
    return { criticFeedback: result.risks, alternatives: [result.alternative], toolResults: [resultSummary], agentTrace: state.agentTrace };
  };
};

const createFinalJudgeNode = (llmProvider) => {
  return async (state) => {
    console.log('--- Final Judge Agent ---');
    recordTrace(state, 'plan', { message: 'Generating final recommendation.' });
    
    let score = 50;
    if (state.stakeholderImpacts) {
      const values = Object.values(state.stakeholderImpacts);
      if (values.length > 0) {
        const avgImpact = values.reduce((a, b) => a + Number(b), 0) / values.length;
        score += (avgImpact * 0.4); 
      }
    }
    if (state.criticFeedback && state.criticFeedback.length > 0) {
      score -= (state.criticFeedback.length * 5);
    }
    
    let finalRecommendation = "After careful review of the policy impacts and potential risks, the final decision requires cautious implementation with strong mitigation strategies in place.";
    try {
      if (llmProvider) {
        const response = await llmProvider.generateText([
          { role: 'system', content: 'You are the final decision judge, acting as a PhD Scholar in Critical Thinking and Systems Analysis. Synthesize a profound 1-paragraph summary verdict based on the impacts, risks, and alternatives. Focus on systemic trade-offs, empirical backing, and behavioral incentives. Do not include arbitrary numeric scores.' },
          { role: 'user', content: `Action: ${state.proposedAction}\nImpacts: ${JSON.stringify(state.stakeholderImpacts)}\nRisks: ${state.criticFeedback?.join(' ') || ''}\nAlternative: ${state.alternatives?.join(' ') || ''}` }
        ]);
        finalRecommendation = response.trim();
      }
    } catch(e) {
      console.warn('Judge Agent LLM failed, using fallback.', e.message);
    }
    
    const finalConfidence = Math.round(Math.max(0, Math.min(100, score))); 
    
    return { finalRecommendation, finalConfidence, status: 'completed', agentTrace: state.agentTrace };
  };
};

module.exports = {
  createPlannerNode,
  createEvidenceToolNode,
  createSimulationToolNode,
  createCritiqueToolNode,
  createFinalJudgeNode
};
