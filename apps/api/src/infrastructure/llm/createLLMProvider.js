const { OpenAIProvider } = require('./providers/OpenAIProvider');
const { OllamaProvider } = require('./providers/OllamaProvider');
const { GeminiProvider } = require('./providers/GeminiProvider');

function createLLMProvider(overrideModelName) {
  const providerType = process.env.LLM_PROVIDER || 'openai';
  
  if (providerType === 'ollama') {
    return new OllamaProvider(overrideModelName);
  }
  
  if (providerType === 'gemini') {
    return new GeminiProvider(overrideModelName);
  }
  
  return new OpenAIProvider(overrideModelName);
}

module.exports = { createLLMProvider };
