const { RetrievalProvider } = require('./RetrievalProvider');

class QdrantRetrievalProvider extends RetrievalProvider {
  constructor(qdrantUrl, apiKey) {
    super();
    this.qdrantUrl = qdrantUrl;
    this.apiKey = apiKey;
  }

  async search(query, topK = 3) {
    // Qdrant not wired yet, throw error to trigger LLM fallback
    throw new Error('Qdrant not connected');
  }
}

module.exports = { QdrantRetrievalProvider };
