class StorageProvider {
  /**
   * Save a file to storage.
   * @param {Object} file - The file object (e.g., from multer)
   * @returns {Promise<string>} - The storage key or path
   */
  async saveFile(file) {
    throw new Error('Method not implemented.');
  }

  /**
   * Read a file from storage.
   * @param {string} storageKey - The storage key or path
   * @returns {Promise<Buffer>} - The file buffer
   */
  async readFile(storageKey) {
    throw new Error('Method not implemented.');
  }

  /**
   * Delete a file from storage.
   * @param {string} storageKey - The storage key or path
   */
  async deleteFile(storageKey) {
    throw new Error('Method not implemented.');
  }
}

module.exports = StorageProvider;
