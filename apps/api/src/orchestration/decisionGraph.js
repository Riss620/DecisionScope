const { StateGraph, START, END } = require('@langchain/langgraph');
const { DecisionState } = require('./state');

/**
 * Creates the decision graph orchestration by injecting the fully configured agents.
 * @param {Object} agents 
 * @returns {import('@langchain/langgraph').CompiledStateGraph}
 */
const createDecisionGraph = (agents) => {
  const workflow = new StateGraph(DecisionState)
    .addNode('inputNode', agents.inputNode)
    .addNode('plannerNode', agents.plannerNode)
    .addNode('evidenceToolNode', agents.evidenceToolNode)
    .addNode('simulationToolNode', agents.simulationToolNode)
    .addNode('critiqueToolNode', agents.critiqueToolNode)
    .addNode('finalJudge', agents.finalJudge)
    
    // START -> input validation
    .addEdge(START, 'inputNode')
    
    // Input -> Planner
    .addConditionalEdges(
      'inputNode',
      (state) => state.status === 'error' ? 'error_end' : 'plannerNode',
      {
        error_end: END,
        plannerNode: 'plannerNode',
      }
    )

    // Action Router from Planner
    .addConditionalEdges(
      'plannerNode',
      (state) => state.nextAction,
      {
        clarification: END,
        searchEvidence: 'evidenceToolNode',
        simulateImpact: 'simulationToolNode',
        critique: 'critiqueToolNode',
        finalJudge: 'finalJudge'
      }
    )

    // Tools always return back to the Planner (PLAN -> ACT -> OBSERVE loop)
    .addEdge('evidenceToolNode', 'plannerNode')
    .addEdge('simulationToolNode', 'plannerNode')
    .addEdge('critiqueToolNode', 'plannerNode')
    
    // End after final judge
    .addEdge('finalJudge', END);

  return workflow.compile();
};

module.exports = { createDecisionGraph };
