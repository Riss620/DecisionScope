const { LLMProvider } = require('../LLMProvider');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');

class GeminiProvider extends LLMProvider {
  constructor(overrideModelName) {
    super();
    const config = {
      model: overrideModelName || process.env.LLM_MODEL || 'gemini-3.6-flash',
      temperature: 0.2,
      apiKey: process.env.GEMINI_API_KEY || 'sk-mock',
      maxRetries: 1,
    };
    
    this.llm = new ChatGoogleGenerativeAI(config);
  }

  async generateText(messages) {
    const langchainMessages = messages.map(msg => {
      if (msg.role === 'system') return new SystemMessage(msg.content);
      return new HumanMessage(msg.content);
    });

    try {
      const response = await this.llm.invoke(langchainMessages);
      return response.content;
    } catch (error) {
      console.error('Gemini Provider Error:', error.message);
      throw error;
    }
  }
}

module.exports = { GeminiProvider };
