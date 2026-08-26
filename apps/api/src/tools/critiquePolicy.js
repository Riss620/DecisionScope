/**
 * Tool: critiquePolicy
 * Critiques the policy based on stakeholder impacts and evidence.
 */

async function critiquePolicy({ policyContext, proposedAction, stakeholderImpacts, evidence, llmProvider }) {
  try {
    let risks = [];
    let alternative = '';
    
    if (llmProvider) {
      try {
        const response = await llmProvider.generateText([
          { role: 'system', content: 'You are a PhD Scholar in Critical Thinking and Systems Analysis. Based on the action and impacts, identify 2 deep, systemic risks (e.g. structural inequalities, epistemic flaws) and propose 1 robust alternative that addresses the root cause rather than patching symptoms. Output JSON: {"risks": ["systemic risk 1", "systemic risk 2"], "alternative": "sophisticated alternative"}' },
          { role: 'user', content: `Action: ${proposedAction}\nImpacts: ${JSON.stringify(stakeholderImpacts)}` }
        ]);
        
        let jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        const parsed = JSON.parse(jsonStr);
        
        risks = parsed.risks || [];
        alternative = parsed.alternative || 'Consider a phased implementation.';
      } catch (err) {
        console.warn('LLM critique failed, falling back:', err.message);
      }
    }
    
    if (risks.length === 0) {
      risks = ["Unexpected pushback from negatively impacted groups.", "Operational friction during transition."];
      alternative = "Re-evaluate the current policy and consider a phased rollout.";
    }

    return {
      success: true,
      risks,
      alternative
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { critiquePolicy };
