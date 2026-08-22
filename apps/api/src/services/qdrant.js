const { QdrantClient } = require('@qdrant/js-client-rest');
const { v4: uuidv4 } = require('uuid');

class QdrantService {
  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });
  }

  async ensureCollectionExists(collectionName, vectorSize = 1536) {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some(c => c.name === collectionName);
    
    if (!exists) {
      await this.client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      });
      console.log(`Collection ${collectionName} created.`);
    }
  }

  async upsertVector(collectionName, vector, payload) {
    const id = uuidv4();
    await this.client.upsert(collectionName, {
      wait: true,
      points: [
        {
          id,
          vector,
          payload,
        }
      ]
    });
    return id;
  }

  async searchVectors(collectionName, queryVector, limit = 5) {
    const searchResults = await this.client.search(collectionName, {
      vector: queryVector,
      limit,
    });
    return searchResults;
  }
}

const qdrantService = new QdrantService();

module.exports = { QdrantService, qdrantService };
