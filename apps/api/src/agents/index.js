const createInputNode = (llmProvider) => {
  return async (state) => {
    console.log('--- Input Agent ---');
    if (!llmProvider) {
      const enrichedContext = state.policyContext + '\n[Enriched by Input Agent]';
      return { policyContext: enrichedContext, status: 'analyzing_evidence' };
    }
    
    let confidence = 100;
    try {
      const response = await llmProvider.generateText([
        { role: 'system', content: 'You are an input validator. Assess the clarity and specificity of the policy context and proposed action. Return a JSON object with "confidence" (0-100) and "reasoning". Strictly JSON like {"confidence": 85, "reasoning": "Clear policy"}' },
        { role: 'user', content: `Policy: ${state.policyContext}\nAction: ${state.proposedAction}` }
      ]);
      const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      confidence = parsed.confidence || 100;
    } catch(e) {
      console.warn('Failed to validate input or hit API error, proceeding anyway.', e.message);
    }
    
    if (confidence < 60) {
      return { 
        policyContext: state.policyContext, 
        status: 'error', 
        error: 'Ambiguous Input: The provided policy or action is too vague. Please provide more specific details.',
        confidence 
      };
    }
    
    const enrichedContext = state.policyContext + '\n[Validated by Input Agent]';
    return { policyContext: enrichedContext, status: 'analyzing_evidence', confidence };
  };
};

const createEvidenceNode = (llmProvider, retrievalProvider) => {
  return async (state) => {
    console.log('--- Evidence Agent ---');
    let evidence = [];
    if (retrievalProvider) {
      evidence = await retrievalProvider.search(state.policyContext);
    } else {
      try {
        const response = await llmProvider.generateText([
          { role: 'system', content: 'You are an expert researcher. Given a policy context and a proposed action, generate a list of 2-3 potential pieces of evidence or historical precedents.' },
          { role: 'user', content: `Policy: ${state.policyContext}\nProposed Action: ${state.proposedAction}` }
        ]);
        evidence = response.split('\n').filter(line => line.trim() !== '');
      } catch (e) {
        console.warn('Evidence Agent LLM failed, using fallback.', e.message);
        evidence = ["Historical data shows similar policies have mixed outcomes.", "Research indicates strong initial pushback followed by acceptance."];
      }
    }
    return { evidence, status: 'simulating_impacts' };
  };
};

const createSimulationNode = (llmProvider) => {
  return async (state) => {
    console.log('--- Simulation Agent ---');
    
    let impacts = {};
    try {
      const response = await llmProvider.generateText([
        { role: 'system', content: 'You are a stakeholder simulation engine. Given a policy and action, identify the top 3-5 stakeholder groups most affected by the policy. Output a JSON object mapping each stakeholder group name to their impact score (-100 to +100). Output strictly JSON, e.g.: {"Nurses": 10, "Patients": -50, "Admin": 20}' },
        { role: 'user', content: `Policy: ${state.policyContext}\nAction: ${state.proposedAction}\nEvidence: ${state.evidence.join(' ')}` }
      ]);
      const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
      impacts = JSON.parse(jsonStr);
      
      if (typeof impacts !== 'object' || Object.keys(impacts).length === 0) {
        throw new Error('Missing required stakeholder keys in LLM output');
      }
    } catch(e) {
      console.error('Failed to parse impacts JSON or hit API error, degrading gracefully.', e.message);
      impacts = { 
        "Primary Stakeholders": -10,
        "Secondary Stakeholders": 5,
      };
    }
    
    return { stakeholderImpacts: impacts, status: 'critiquing' };
  };
};

const createCriticNode = (llmProvider) => {
  return async (state) => {
    console.log('--- Critic Agent ---');
    let risks = ["Unexpected systemic consequences", "Operational friction"];
    let alternative = "Re-evaluate the current policy and consider a phased rollout.";
    
    try {
      const response = await llmProvider.generateText([
        { role: 'system', content: 'You are a strategic risk analyst. Given a proposed action and its impacts, identify 2 potential negative consequences (risks), AND suggest 1 alternative approach that mitigates these risks. Return strictly JSON: {"risks": ["risk1", "risk2"], "alternative": "alternative description"}' },
        { role: 'user', content: `Action: ${state.proposedAction}\nImpacts: ${JSON.stringify(state.stakeholderImpacts)}` }
      ]);
      const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed.risks && Array.isArray(parsed.risks)) risks = parsed.risks;
      if (parsed.alternative) alternative = parsed.alternative;
    } catch(e) {
      console.warn('Failed to parse Critic JSON or hit API error, degrading gracefully.', e.message);
    }
    
    return { criticFeedback: risks, _tempAlternative: alternative, status: 'generating_alternatives' };
  };
};

const createAlternativeNode = () => {
  return async (state) => {
    console.log('--- Alternative Agent ---');
    const alternative = state._tempAlternative || "Re-evaluate the current policy and consider a phased rollout.";
    return { alternatives: [alternative], status: 'judging' };
  };
};

const createJudgeNode = (llmProvider) => {
  return async (state) => {
    console.log('--- Judge Agent ---');
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
      const response = await llmProvider.generateText([
        { role: 'system', content: 'You are the final decision judge. Synthesize a 1-paragraph summary recommendation based on the provided data. Do not include arbitrary numeric scores.' },
        { role: 'user', content: `Action: ${state.proposedAction}\nImpacts: ${JSON.stringify(state.stakeholderImpacts)}\nRisks: ${state.criticFeedback?.join(' ') || ''}\nAlternative: ${state.alternatives?.join(' ') || ''}` }
      ]);
      finalRecommendation = response.trim();
    } catch(e) {
      console.warn('Judge Agent LLM failed, using fallback.', e.message);
    }
    
    const finalConfidence = Math.round(Math.max(0, Math.min(100, score))); 
    
    return { finalRecommendation, finalConfidence, status: 'completed' };
  };
};

module.exports = {
  createInputNode,
  createEvidenceNode,
  createSimulationNode,
  createCriticNode,
  createAlternativeNode,
  createJudgeNode,
};
