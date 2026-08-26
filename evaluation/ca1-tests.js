const { createConversationMemory, updateMemory, buildMemoryContext, readMemory } = require('../apps/api/src/agents/memory');

async function runTests() {
  console.log('Running CA1 Tests...');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
    }
  }

  try {
    // 1. Memory Test
    const conversationId = 'test-conversation-001';
    createConversationMemory(conversationId);
    let memory = readMemory(conversationId);
    
    assert(memory !== null, 'Memory is initialized');
    
    updateMemory(conversationId, {
      previousPolicy: 'Test Policy',
      previousProposedAction: 'Action A',
    });
    
    memory = readMemory(conversationId);
    assert(memory.previousProposedAction === 'Action A', 'Memory is written after Turn 1');
    
    const context = buildMemoryContext(conversationId);
    assert(context.includes('Previous Proposal: Action A'), 'Turn 2 demonstrably uses Turn 1 information');

    console.log(`\nTest Summary: ${passed} / ${total} passed.`);
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

runTests();
