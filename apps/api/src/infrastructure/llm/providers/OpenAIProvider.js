const { LLMProvider } = require('../LLMProvider');
const { ChatOpenAI } = require('@langchain/openai');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');

class OpenAIProvider extends LLMProvider {
  constructor(overrideModelName) {
    super();
    const config = {
      modelName: process.env.LLM_MODEL || 'gpt-4o',
      temperature: 0.2,
      apiKey: process.env.OPENAI_API_KEY || 'sk-mock',
      maxRetries: 0,
      timeout: 3000,
    };
    
    if (process.env.OPENAI_BASE_URL) {
      config.configuration = {
        baseURL: process.env.OPENAI_BASE_URL
      };
    }

    this.llm = new ChatOpenAI(config);
  }

  async generateText(messages) {
    const langchainMessages = messages.map(msg => {
      if (msg.role === 'system') return new SystemMessage(msg.content);
      return new HumanMessage(msg.content);
    });

    const response = await this.llm.invoke(langchainMessages);
    return response.content;
  }
}

module.exports = { OpenAIProvider };
