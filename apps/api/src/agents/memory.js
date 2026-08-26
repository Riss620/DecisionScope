/**
 * Simple in-memory storage for conversation state across turns.
 * For production, this would be backed by Redis or PostgreSQL.
 */
const conversationStore = new Map();

function createConversationMemory(conversationId) {
  if (!conversationStore.has(conversationId)) {
    conversationStore.set(conversationId, {
      previousTurns: [],
      previousPolicy: null,
      previousProposedAction: null,
      previousEvidence: null,
      previousStakeholderImpacts: null,
      previousRisks: null,
      previousAlternatives: null,
      lastRecommendation: null
    });
  }
  return conversationStore.get(conversationId);
}

function readMemory(conversationId) {
  return conversationStore.get(conversationId) || null;
}

function updateMemory(conversationId, stateUpdate) {
  let memory = conversationStore.get(conversationId);
  if (!memory) {
    memory = createConversationMemory(conversationId);
  }
  
  const updatedMemory = { ...memory, ...stateUpdate };
  conversationStore.set(conversationId, updatedMemory);
  return updatedMemory;
}

function buildMemoryContext(conversationId) {
  const memory = readMemory(conversationId);
  if (!memory) return "No previous context.";

  let context = "Memory Used: Previous decision context detected.\n";
  if (memory.previousProposedAction) {
    context += `Previous Proposal: ${memory.previousProposedAction}\n`;
  }
  if (memory.lastRecommendation) {
    context += `Previous Recommendation: ${memory.lastRecommendation}\n`;
  }
  return context.trim();
}

module.exports = {
  createConversationMemory,
  readMemory,
  updateMemory,
  buildMemoryContext,
  _store: conversationStore // exposed for testing
};
