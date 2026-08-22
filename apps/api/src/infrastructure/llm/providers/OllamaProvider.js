const { LLMProvider } = require('../LLMProvider');

class OllamaProvider extends LLMProvider {
  constructor(modelName) {
    super();
    this.baseUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
    this.model = modelName || process.env.LLM_MODEL || 'llama3';
  }

  async generateText(messages) {
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'system' ? 'system' : 'user',
      content: msg.content
    }));

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
          stream: false,
          options: {
            temperature: 0.2
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message.content;
    } catch (error) {
      console.error('Ollama Provider Error:', error.message);
      throw error;
    }
  }
}

module.exports = { OllamaProvider };
