class LLMProvider {
  /**
   * @param {Array<{role: string, content: string}>} messages
   * @returns {Promise<string>}
   */
  async generateText(messages) {
    throw new Error('generateText() not implemented');
  }
}

module.exports = { LLMProvider };
