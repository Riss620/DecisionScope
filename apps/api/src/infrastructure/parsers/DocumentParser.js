class DocumentParser {
  /**
   * Parse a file buffer and extract text.
   * @param {Buffer} buffer - The file buffer
   * @param {string} filename - The original filename
   * @param {string} mimeType - The mime type
   * @returns {Promise<Object>} - Normalized document representation
   */
  async parse(buffer, filename, mimeType) {
    throw new Error('Method not implemented.');
  }
}

module.exports = DocumentParser;
