const { OpenAIProvider } = require('./providers/OpenAIProvider');
const { OllamaProvider } = require('./providers/OllamaProvider');

function createLLMProvider(overrideModelName) {
  const providerType = process.env.LLM_PROVIDER || 'openai';
  
  if (providerType === 'ollama') {
    return new OllamaProvider(overrideModelName);
  }
  
  return new OpenAIProvider(overrideModelName);
}

module.exports = { createLLMProvider };
