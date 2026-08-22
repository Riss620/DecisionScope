const { StateGraph, START, END } = require('@langchain/langgraph');
const { DecisionState } = require('./state');

/**
 * Creates the decision graph orchestration by injecting the fully configured agents.
 * @param {Object} agents 
 * @param {Function} agents.inputNode
 * @param {Function} agents.evidenceNode
 * @param {Function} agents.simulationNode
 * @param {Function} agents.criticNode
 * @param {Function} agents.alternativeNode
 * @param {Function} agents.judgeNode
 * @returns {import('@langchain/langgraph').CompiledStateGraph}
 */
const createDecisionGraph = (agents) => {
  const workflow = new StateGraph(DecisionState)
    .addNode('inputNode', agents.inputNode)
    .addNode('evidenceNode', agents.evidenceNode)
    .addNode('simulationNode', agents.simulationNode)
    .addNode('criticNode', agents.criticNode)
    .addNode('alternativeNode', agents.alternativeNode)
    .addNode('judgeNode', agents.judgeNode)
    .addEdge(START, 'inputNode')
    .addConditionalEdges(
      'inputNode',
      (state) => state.status === 'error' ? 'error_end' : 'continue',
      {
        error_end: END,
        continue: 'evidenceNode',
      }
    )
    .addEdge('evidenceNode', 'simulationNode')
    .addEdge('simulationNode', 'criticNode')
    .addEdge('criticNode', 'alternativeNode')
    .addEdge('alternativeNode', 'judgeNode')
    .addEdge('judgeNode', END);

  return workflow.compile();
};

module.exports = { createDecisionGraph };
