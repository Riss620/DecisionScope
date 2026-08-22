const express = require('express');

/**
 * Creates the decisions router.
 * @param {import('@langchain/langgraph').CompiledStateGraph} decisionGraph 
 * @param {import('../../infrastructure/events/EventPublisher').EventPublisher} eventPublisher 
 */
module.exports = function(decisionGraph, eventPublisher, dbProvider) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    if (!dbProvider) return res.json([]);
    const decisions = await dbProvider.getDecisions(req.user.id);
    res.json(decisions);
  });

  router.get('/stats', async (req, res) => {
    if (!dbProvider) return res.json({ total: 0, byStatus: {}, avgConfidence: 0 });
    const stats = await dbProvider.getStats();
    res.json(stats);
  });

  router.post('/:id/simulate', async (req, res) => {
    const { id } = req.params;
    const { policyContext, proposedAction, demo } = req.body;
    
    if (!policyContext || !proposedAction) {
      return res.status(400).json({ error: 'policyContext and proposedAction are required' });
    }
    
    if (dbProvider) {
      await dbProvider.insertDecision(id, req.user.id, policyContext, proposedAction);
    }
    
    // Respond immediately, as simulation is asynchronous
    res.status(202).json({ message: 'Simulation started', decisionId: id });
    
    // Only fallback to demo if explicitly requested, or if no LLM provider is configured at all
    const hasLLMConfig = process.env.OPENAI_API_KEY || process.env.LLM_PROVIDER === 'ollama';
    
    if (demo === true || !hasLLMConfig) {
      console.log('Running in demo mode...');
      return runDemoSimulation(id, eventPublisher, policyContext, proposedAction, dbProvider);
    }
    
    const initialState = {
      decisionId: id,
      policyContext,
      proposedAction,
    };

    try {
      const stream = await decisionGraph.stream(initialState);
      
      let finalState = {};
      
      for await (const chunk of stream) {
        const nodeName = Object.keys(chunk)[0];
        const stateUpdate = chunk[nodeName];
        
        finalState = { ...finalState, ...stateUpdate };
        
        eventPublisher.emit(`simulation:${id}:progress`, {
          node: nodeName,
          state: stateUpdate,
          timestamp: new Date().toISOString()
        });
      }
      
      if (dbProvider) {
        if (finalState.status === 'error') {
          await dbProvider.updateDecision(id, { 
            status: 'error', 
            finalRecommendation: finalState.error || 'Simulation failed',
            confidence: finalState.confidence || 0 
          });
        } else if (finalState.status === 'completed') {
          await dbProvider.updateDecision(id, {
            status: 'completed',
            finalRecommendation: finalState.finalRecommendation,
            confidence: finalState.finalConfidence || 0
          });
        }
      }
      
      eventPublisher.emit(`simulation:${id}:complete`, {
        message: 'Simulation completed successfully',
      });
      
    } catch (error) {
      console.error('Simulation error:', error);
      eventPublisher.emit(`simulation:${id}:error`, {
        error: error.message
      });
    }
  });

  router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    if (dbProvider) {
      await dbProvider.pool.query('UPDATE decisions SET status = ? WHERE id = ? AND user_id = ?', [status, id, req.user.id]);
    }
    
    res.json({ success: true, status });
  });

  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    if (dbProvider) {
      const success = await dbProvider.deleteDecision(id, req.user.id);
      if (!success) {
        return res.status(404).json({ error: 'Decision not found or could not be deleted' });
      }
    }
    
    res.json({ success: true });
  });

  return router;
};

async function runDemoSimulation(id, eventPublisher, policyContext, proposedAction, dbProvider) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const demoStates = [
    { node: 'inputNode', state: { policyContext: policyContext, status: 'analyzing_evidence' } },
    { node: 'evidenceNode', state: { evidence: ['Found historical precedent in 2018 where similar action was taken.', 'Student survey data from last year supports this direction.'], status: 'simulating_impacts' } },
    { node: 'simulationNode', state: { stakeholderImpacts: { 'Students': 15, 'Faculty': -10, 'Administration': 25 }, status: 'critiquing' } },
    { node: 'criticNode', state: { criticFeedback: ['Might cause slight pushback from faculty due to increased workload.', 'Potential communication gaps during transition.'], status: 'generating_alternatives' } },
    { node: 'alternativeNode', state: { alternatives: ['Implement the change in phases rather than all at once to ease the transition.'], status: 'judging' } },
    { node: 'judgeNode', state: { finalRecommendation: `Based on the proposal to "${proposedAction}", the overall impact is positive. However, due to faculty concerns, we recommend proceeding with the phased alternative.`, status: 'completed' } },
  ];

  try {
    for (const step of demoStates) {
      await sleep(1500); // simulate think time
      eventPublisher.emit(`simulation:${id}:progress`, {
        node: step.node,
        state: step.state,
        timestamp: new Date().toISOString()
      });
    }

    eventPublisher.emit(`simulation:${id}:complete`, {
      message: 'Simulation completed successfully',
    });
    
    if (dbProvider) {
      await dbProvider.updateDecision(id, {
        status: 'completed',
        finalRecommendation: demoStates[5].state.finalRecommendation,
        confidence: 85
      });
    }
  } catch (err) {
    console.error(err);
  }
}
