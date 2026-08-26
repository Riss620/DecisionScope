/**
 * Helper functions to record agent trace events.
 */

function createTraceContext() {
  return {
    step: 0,
    events: []
  };
}

function recordTrace(state, type, details = {}) {
  // Ensure state.agentTrace exists
  if (!state.agentTrace) {
    state.agentTrace = createTraceContext();
  }

  state.agentTrace.step += 1;
  
  const event = {
    step: state.agentTrace.step,
    type, // 'plan', 'tool_call', 'tool_result', 'decision'
    timestamp: new Date().toISOString(),
    ...details
  };
  
  state.agentTrace.events.push(event);
  
  return event;
}

module.exports = {
  createTraceContext,
  recordTrace
};
