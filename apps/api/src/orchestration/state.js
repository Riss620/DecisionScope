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
});

module.exports = { DecisionState };
