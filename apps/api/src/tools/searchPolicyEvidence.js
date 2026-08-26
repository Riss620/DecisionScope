/**
 * Tool: searchPolicyEvidence
 * Searches for evidence related to the policy context and proposed action.
 */

async function searchPolicyEvidence({ policyContext, proposedAction, memoryContext, retrievalProvider, llmProvider }) {
  try {
    let evidence = [];
    let usedFallback = false;

    // Use retrieval provider if available (Qdrant)
    if (retrievalProvider) {
      try {
        const query = `${policyContext} ${proposedAction}`;
        const results = await retrievalProvider.search(query);
        if (results && results.length > 0) {
          evidence = results.map(r => ({
            source: r.source || 'Qdrant Database',
            finding: r.content || r,
            relevance: 90
          }));
        }
      } catch (err) {
        console.warn('Qdrant retrieval failed, falling back:', err.message);
        usedFallback = true;
      }
    } else {
      usedFallback = true;
    }

    // Fallback to LLM if no retrieval or retrieval failed
    if (usedFallback && llmProvider) {
       try {
         const response = await llmProvider.generateText([
           { role: 'system', content: 'You are a PhD-level academic researcher. Generate 2 highly specific, realistic empirical evidence points or historical precedents related to the policy context and proposed action. Output ONLY the 2 bullet points, no extra text.' },
           { role: 'user', content: `Policy: ${policyContext}\nAction: ${proposedAction}\nMemory Context: ${memoryContext}` }
         ]);
         
         const findings = response.split('\n').filter(line => line.trim() !== '');
         evidence = findings.map(f => ({
            source: 'LLM Generation (Fallback)',
            finding: f.replace(/^- /, ''),
            relevance: 80
         }));
       } catch (llmErr) {
         console.warn('LLM fallback failed, using hardcoded fallback.', llmErr.message);
         evidence = [
           { source: 'Mock Data', finding: 'Historical data shows mixed outcomes for similar changes.', relevance: 50 },
           { source: 'Mock Data', finding: 'Recent surveys indicate mild resistance to this policy.', relevance: 60 }
         ];
       }
    } else if (usedFallback) {
        evidence = [
            { source: 'Mock Data', finding: 'Historical data shows mixed outcomes for similar changes.', relevance: 50 },
            { source: 'Mock Data', finding: 'Recent surveys indicate mild resistance to this policy.', relevance: 60 }
        ];
    }

    return {
      success: true,
      evidence,
      query: `Search evidence for: ${proposedAction}`,
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

module.exports = { searchPolicyEvidence };
