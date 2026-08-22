const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const StorageProvider = require('./StorageProvider');

class LocalFileStorageProvider extends StorageProvider {
  constructor(baseDir = 'uploads') {
    super();
    this.baseDir = path.join(process.cwd(), baseDir);
    
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveFile(file) {
    const fileExtension = path.extname(file.originalname);
    const storageKey = `${uuidv4()}${fileExtension}`;
    const destinationPath = path.join(this.baseDir, storageKey);
    
    // file is a multer file object
    fs.writeFileSync(destinationPath, file.buffer);
    
    return storageKey;
  }

  async readFile(storageKey) {
    const filePath = path.join(this.baseDir, storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    return fs.readFileSync(filePath);
  }

  async deleteFile(storageKey) {
    const filePath = path.join(this.baseDir, storageKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = LocalFileStorageProvider;
