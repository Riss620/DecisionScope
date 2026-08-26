const { Annotation } = require('@langchain/langgraph');

const DecisionState = Annotation.Root({
  decisionId: Annotation(),
  policyContext: Annotation(),
  proposedAction: Annotation(),
  evidence: Annotation({
    reducer: (curr, next) => curr.concat(next),
    default: () => [],
  }),
  stakeholderImpacts: Annotation({
    reducer: (curr, next) => ({ ...curr, ...next }),
    default: () => ({}),
  }),
  criticFeedback: Annotation({
    reducer: (curr, next) => curr.concat(next),
    default: () => [],
  }),
  alternatives: Annotation({
    reducer: (curr, next) => curr.concat(next),
    default: () => [],
  }),
  finalRecommendation: Annotation(),
  finalConfidence: Annotation(),
  confidence: Annotation(),
  error: Annotation(),
  status: Annotation({
    default: () => 'pending',
  }),
  // Agent Context
  agentPlan: Annotation({
    default: () => ({ goal: '', steps: [], currentStep: 0 })
  }),
  currentAction: Annotation(),
  toolCalls: Annotation({
    reducer: (curr, next) => curr.concat(next),
    default: () => []
  }),
  toolResults: Annotation({
    reducer: (curr, next) => curr.concat(next),
    default: () => []
  }),
  agentTrace: Annotation(),
  memory: Annotation(),
  conversationId: Annotation(),
  turnId: Annotation(),
  nextAction: Annotation(),
  requiresClarification: Annotation({
    default: () => false
  }),
});

module.exports = { DecisionState };
