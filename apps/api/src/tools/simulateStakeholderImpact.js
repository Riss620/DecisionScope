/**
 * Tool: simulateStakeholderImpact
 * Simulates stakeholder impact based on the policy, action, and evidence.
 */

async function simulateStakeholderImpact({ policyContext, proposedAction, evidence, memoryContext, llmProvider }) {
  try {
    let stakeholders = {};
    let usedFallback = false;
    let summary = '';

    if (llmProvider) {
      try {
        const evidenceStr = Array.isArray(evidence) ? evidence.map(e => e.finding || e).join(' ') : (evidence || '');
        const response = await llmProvider.generateText([
          { role: 'system', content: 'You are a PhD Scholar in Critical Thinking and Behavioral Economics, acting as a systemic impact simulator. Identify 3 stakeholder groups and assign an impact score (-100 to +100) for each. Consider second-order effects, behavioral shifts (e.g., targeting the floor), and operational friction. Output JSON: {"stakeholders": {"Students": -30, "Faculty": 20}, "summary": "Deep analytical summary of systemic impact..."}' },
          { role: 'user', content: `Policy: ${policyContext}\nAction: ${proposedAction}\nEvidence: ${evidenceStr}\nMemory Context: ${memoryContext}` }
        ]);
        
        let jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        const parsed = JSON.parse(jsonStr);
        
        stakeholders = parsed.stakeholders || {};
        summary = parsed.summary || 'Impact simulated successfully.';
      } catch (err) {
        console.warn('LLM simulation failed, falling back:', err.message);
        usedFallback = true;
      }
    } else {
      usedFallback = true;
    }

    if (usedFallback) {
      stakeholders = {
        "Students": -35,
        "Faculty": 15,
        "Administration": 40
      };
      summary = "Fallback simulation: Negative impact on students, positive for administration.";
    }

    return {
      success: true,
      stakeholders,
      summary,
      usedFallback
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      usedFallback: true
    };
  }
}

module.exports = { simulateStakeholderImpact };
