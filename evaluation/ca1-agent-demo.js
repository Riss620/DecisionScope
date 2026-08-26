const path = require('path');
const dotenvPath = path.resolve(__dirname, '../apps/api/node_modules/dotenv');
try {
  require(dotenvPath).config({ path: path.resolve(__dirname, '../apps/api/.env') });
} catch (e) {
  // Ignore if dotenv is not found, fallback to env vars
}
const { createLLMProvider } = require('../apps/api/src/infrastructure/llm/createLLMProvider');
const { createPlannerNode, createEvidenceToolNode, createSimulationToolNode, createCritiqueToolNode, createFinalJudgeNode } = require('../apps/api/src/agents/decisionAgent');
const { createInputNode } = require('../apps/api/src/agents/index');
const { createDecisionGraph } = require('../apps/api/src/orchestration/decisionGraph');
const { createConversationMemory, buildMemoryContext, updateMemory } = require('../apps/api/src/agents/memory');

async function runDemo() {
  console.log("==================================================");
  console.log("DECISIONSCOPE CA1 AGENT DEMO");
  console.log("==================================================\n");

  const llmProvider = createLLMProvider();
  
  const agents = {
    inputNode: createInputNode(llmProvider),
    plannerNode: createPlannerNode(llmProvider),
    evidenceToolNode: createEvidenceToolNode(llmProvider, null),
    simulationToolNode: createSimulationToolNode(llmProvider),
    critiqueToolNode: createCritiqueToolNode(llmProvider),
    finalJudge: createFinalJudgeNode(llmProvider),
  };

  const decisionGraph = createDecisionGraph(agents);
  
  const conversationId = "demo-001";
  createConversationMemory(conversationId);

  // TURN 1
  console.log("--- TURN 1 ---");
  const turn1Context = buildMemoryContext(conversationId);
  const initialState1 = {
    decisionId: conversationId,
    conversationId,
    policyContext: "Attendance Policy",
    proposedAction: "Increase penalty from 500 to 1000 INR",
    memory: turn1Context
  };

  console.log(`USER GOAL:\n${initialState1.proposedAction}\n`);
  
  let finalState1 = await executeGraph(decisionGraph, initialState1);
  
  updateMemory(conversationId, {
    previousPolicy: finalState1.policyContext,
    previousProposedAction: finalState1.proposedAction,
    previousEvidence: finalState1.evidence,
    previousStakeholderImpacts: finalState1.stakeholderImpacts,
    previousRisks: finalState1.criticFeedback,
    previousAlternatives: finalState1.alternatives,
    lastRecommendation: finalState1.finalRecommendation,
  });

  console.log("\n--- TURN 2 ---");
  const turn2Context = buildMemoryContext(conversationId);
  const initialState2 = {
    decisionId: conversationId,
    conversationId,
    policyContext: "Attendance Policy",
    proposedAction: "Reduce penalty to 750 INR instead",
    memory: turn2Context
  };

  console.log(`USER GOAL:\n${initialState2.proposedAction}\n`);
  console.log(turn2Context);
  console.log("");
  
  await executeGraph(decisionGraph, initialState2);
}

async function executeGraph(decisionGraph, initialState) {
  const stream = await decisionGraph.stream(initialState);
  let finalState = {};

  for await (const chunk of stream) {
    const nodeName = Object.keys(chunk)[0];
    const stateUpdate = chunk[nodeName];
    finalState = { ...finalState, ...stateUpdate };

    if (stateUpdate.agentTrace && stateUpdate.agentTrace.events) {
      const events = stateUpdate.agentTrace.events;
      const latestEvent = events[events.length - 1];
      if (latestEvent) {
        printTraceEvent(latestEvent);
      }
    }
  }
  
  if (finalState.finalRecommendation) {
    console.log(`\nSTEP ${finalState.agentTrace?.step + 1 || '?'} — FINAL`);
    console.log(`Recommendation:\n${finalState.finalRecommendation}`);
  }

  return finalState;
}

function printTraceEvent(event) {
  console.log(`\nSTEP ${event.step} — ${event.type.toUpperCase()}`);
  if (event.type === 'tool_call') {
    console.log(`Tool: ${event.tool}`);
    if (event.inputSummary) console.log(`Input: ${event.inputSummary}`);
  } else if (event.type === 'tool_result') {
    console.log(`Result: ${event.resultSummary}`);
  } else if (event.type === 'plan' || event.type === 'decision') {
    console.log(`${event.message}`);
  }
}

runDemo().catch(console.error);
