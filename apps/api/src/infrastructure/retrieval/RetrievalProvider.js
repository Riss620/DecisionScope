class RetrievalProvider {
  /**
   * @param {string} query
   * @param {number} topK
   * @returns {Promise<Array<string>>}
   */
  async search(query, topK = 3) {
    throw new Error('search() not implemented');
  }
}

module.exports = { RetrievalProvider };
